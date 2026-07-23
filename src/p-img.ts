const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: inline-block;
    overflow: hidden;
    touch-action: pan-x pan-y;
  }
  :host([hidden]) {
    display: none !important;
  }
  :host([zooming]) {
    overflow: visible;
    z-index: 2147483647;
    position: relative;
    touch-action: none;
  }
  :host([zooming]) img {
    will-change: transform;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: inherit;
    object-position: inherit;
    border-radius: inherit;
    filter: inherit;
    transform-origin: 0 0;
  }
  img.returning {
    transition: transform 0.3s ease-out;
  }
</style>
<img part="img" />
`;

// Attributes that belong to the host and should NOT be forwarded to the inner <img>
const HOST_ONLY_ATTRS = new Set([
  "zooming", "loaded", "style", "class", "id", "slot", "part", "exportparts",
  "is", "tabindex",
]);

// Source attributes whose change signals a pending new load
const SOURCE_ATTRS = new Set(["src", "srcset", "sizes"]);

// IDL properties that reflect to host attributes. Also used to re-apply
// properties assigned before the element was upgraded.
const REFLECTED_PROPS = [
  "src", "srcset", "sizes", "alt", "loading", "decoding",
  "crossOrigin", "referrerPolicy", "fetchPriority", "width", "height",
] as const;

export class PImg extends HTMLElement {
  // Source attributes are handled in attributeChangedCallback so they forward
  // synchronously and `complete` never lags a source change; all other
  // attributes go through the MutationObserver.
  static observedAttributes = ["src", "srcset", "sizes"];

  private img: HTMLImageElement;
  private sizeStyle: HTMLStyleElement;
  private attrObserver: MutationObserver;

  /** True when the current image has loaded successfully. */
  get complete(): boolean {
    return this.hasAttribute("loaded");
  }
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private initialDistance = 0;
  private initialScale = 1;
  private initialMidpoint = { x: 0, y: 0 };
  private initialTranslate = { x: 0, y: 0 };
  private cachedRect: DOMRect | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.img = this.shadowRoot!.querySelector("img")!;

    // Per-instance style mirroring width/height attributes onto the host
    this.sizeStyle = document.createElement("style");
    this.shadowRoot!.appendChild(this.sizeStyle);

    // Listen from construction so a load that finishes while the element is
    // detached still updates state and reaches listeners on the element.
    this.img.addEventListener("load", this.onImgLoad);
    this.img.addEventListener("error", this.onImgError);

    // Observe attribute mutations on the host and forward them to the inner
    // <img>. Observation starts here rather than connectedCallback, and is
    // never disconnected, so changes made while detached aren't lost.
    this.attrObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName) {
          // Source attrs are forwarded synchronously in attributeChangedCallback
          if (SOURCE_ATTRS.has(m.attributeName)) continue;
          this.forwardAttribute(m.attributeName);
        }
      }
    });
    this.attrObserver.observe(this, { attributes: true });
  }

  attributeChangedCallback(name: string) {
    this.removeAttribute("loaded");
    this.forwardAttribute(name);
  }

  connectedCallback() {
    // Re-apply properties assigned before the element was upgraded, so they
    // go through the accessors instead of shadowing them.
    for (const prop of REFLECTED_PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = (this as any)[prop];
        delete (this as any)[prop];
        (this as any)[prop] = value;
      }
    }

    // Forward attributes present at upgrade time — the observer only sees
    // changes made after construction.
    for (const attr of this.attributes) {
      this.forwardAttribute(attr.name);
    }
    this.updateHostSizing();

    this.addEventListener("touchstart", this.onTouchStart, { passive: false });
    this.addEventListener("touchmove", this.onTouchMove, { passive: false });
    this.addEventListener("touchend", this.onTouchEnd);
  }

  disconnectedCallback() {
    this.removeEventListener("touchstart", this.onTouchStart);
    this.removeEventListener("touchmove", this.onTouchMove);
    this.removeEventListener("touchend", this.onTouchEnd);
  }

  // --- HTMLImageElement API -------------------------------------------------

  /** Resolved URL of the image source, like HTMLImageElement.src. */
  get src(): string { return this.img.src; }
  set src(value: string) { this.setAttribute("src", value); }

  get srcset(): string { return this.getAttribute("srcset") ?? ""; }
  set srcset(value: string) { this.setAttribute("srcset", value); }

  get sizes(): string { return this.getAttribute("sizes") ?? ""; }
  set sizes(value: string) { this.setAttribute("sizes", value); }

  get alt(): string { return this.getAttribute("alt") ?? ""; }
  set alt(value: string) { this.setForwarded("alt", value); }

  get loading(): string { return this.getAttribute("loading") ?? "eager"; }
  set loading(value: string) { this.setForwarded("loading", value); }

  get decoding(): string { return this.getAttribute("decoding") ?? "auto"; }
  set decoding(value: string) { this.setForwarded("decoding", value); }

  get crossOrigin(): string | null { return this.getAttribute("crossorigin"); }
  set crossOrigin(value: string | null) { this.setForwarded("crossorigin", value); }

  get referrerPolicy(): string { return this.getAttribute("referrerpolicy") ?? ""; }
  set referrerPolicy(value: string) { this.setForwarded("referrerpolicy", value); }

  get fetchPriority(): string { return this.getAttribute("fetchpriority") ?? "auto"; }
  set fetchPriority(value: string) { this.setForwarded("fetchpriority", value); }

  get width(): number { return this.img.width; }
  set width(value: number) { this.setForwarded("width", String(value)); }

  get height(): number { return this.img.height; }
  set height(value: number) { this.setForwarded("height", String(value)); }

  get naturalWidth(): number { return this.img.naturalWidth; }
  get naturalHeight(): number { return this.img.naturalHeight; }
  get currentSrc(): string { return this.img.currentSrc; }

  /** Decode the underlying image; resolves when it is safe to paint. */
  decode(): Promise<void> {
    return this.img.decode();
  }

  // --------------------------------------------------------------------------

  /** Reflect a property to a host attribute and forward it synchronously —
   *  the MutationObserver would otherwise apply it a microtask later. */
  private setForwarded(name: string, value: string | null) {
    if (value === null) {
      this.removeAttribute(name);
    } else {
      this.setAttribute(name, value);
    }
    this.forwardAttribute(name);
  }

  /** Forward a single attribute from the host to the inner <img>, unless it's host-only. */
  private forwardAttribute(name: string) {
    if (HOST_ONLY_ATTRS.has(name)) return;
    const value = this.getAttribute(name);
    if (value === null) {
      this.img.removeAttribute(name);
    } else {
      this.img.setAttribute(name, value);
    }
    if (name === "width" || name === "height") {
      this.updateHostSizing();
    }
  }

  /** Mirror width/height attributes onto the host, like <img>'s presentational
   *  hints. The inner img's `width/height: 100%` CSS would otherwise discard
   *  them, and the aspect-ratio reserves layout space before the image loads. */
  private updateHostSizing() {
    const w = this.getAttribute("width");
    const h = this.getAttribute("height");
    const rules: string[] = [];
    if (w && /^\d+$/.test(w)) rules.push(`width: ${w}px;`);
    if (h && /^\d+$/.test(h)) rules.push(`height: ${h}px;`);
    if (rules.length === 2) rules.push(`aspect-ratio: ${w} / ${h};`);
    this.sizeStyle.textContent = rules.length ? `:host { ${rules.join(" ")} }` : "";
  }

  private onImgLoad = () => {
    this.setAttribute("loaded", "");
    this.dispatchEvent(new Event("load", { bubbles: true }));
    this.dispatchEvent(new CustomEvent("p-img-load", { bubbles: true, composed: true }));
  };

  private onImgError = () => {
    this.removeAttribute("loaded");
    this.dispatchEvent(new Event("error", { bubbles: true }));
    this.dispatchEvent(new CustomEvent("p-img-error", { bubbles: true, composed: true }));
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Cancel any in-progress return animation
      this.img.classList.remove("returning");
      const current = getComputedStyle(this.img).transform;
      if (current && current !== "none") {
        this.img.style.transform = current;
      }
      this.readTransform();

      this.setAttribute("zooming", "");
      this.cachedRect = this.getBoundingClientRect();
      this.initialDistance = this.getTouchDistance(e.touches);
      this.initialScale = this.scale;
      this.initialMidpoint = this.getTouchMidpoint(e.touches);
      this.initialTranslate = { x: this.translateX, y: this.translateY };
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();

      const distance = this.getTouchDistance(e.touches);
      const newScale = Math.min(Math.max(this.initialScale * (distance / this.initialDistance), 1), 5);

      const midpoint = this.getTouchMidpoint(e.touches);
      const rect = this.cachedRect!;

      // Point in the element's coordinate space where the pinch started
      const originX = this.initialMidpoint.x - rect.left;
      const originY = this.initialMidpoint.y - rect.top;

      // Adjust translation so the pinch origin stays fixed under the fingers
      const scaleDelta = newScale / this.initialScale;
      const newTranslateX = this.initialTranslate.x - originX * (scaleDelta - 1)
        + (midpoint.x - this.initialMidpoint.x);
      const newTranslateY = this.initialTranslate.y - originY * (scaleDelta - 1)
        + (midpoint.y - this.initialMidpoint.y);

      this.scale = newScale;
      this.translateX = newTranslateX;
      this.translateY = newTranslateY;
      this.applyTransform();
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      this.cachedRect = null;
      this.animateReset();
    }
  };

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  private getTouchMidpoint(touches: TouchList): { x: number; y: number } {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  private applyTransform() {
    this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  private animateReset() {
    this.img.classList.add("returning");
    this.img.style.transform = "";

    const onEnd = () => {
      this.img.removeEventListener("transitionend", onEnd);
      this.img.classList.remove("returning");
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.removeAttribute("zooming");
    };
    this.img.addEventListener("transitionend", onEnd);
  }

  /** Read the current mid-animation transform back into our state. */
  private readTransform() {
    const raw = getComputedStyle(this.img).transform;
    if (!raw || raw === "none") {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      return;
    }
    // matrix(a, b, c, d, tx, ty) — for uniform scale a===d===scale
    const m = raw.match(/matrix\((.+)\)/);
    if (m) {
      const v = m[1].split(",").map(Number);
      this.scale = v[0];
      this.translateX = v[4];
      this.translateY = v[5];
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "p-img": PImg;
  }
}

customElements.define("p-img", PImg);
