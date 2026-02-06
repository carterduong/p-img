const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: inline-block;
    overflow: hidden;
    touch-action: none;
  }
  :host([zooming]) {
    overflow: visible;
    z-index: 2147483647;
    position: relative;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: inherit;
    object-position: inherit;
    border-radius: inherit;
    filter: inherit;
    opacity: inherit;
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
  "zooming", "style", "class", "id", "slot", "part", "is", "tabindex",
]);

export class PImg extends HTMLElement {
  private img: HTMLImageElement;
  private attrObserver: MutationObserver;
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private initialDistance = 0;
  private initialScale = 1;
  private initialMidpoint = { x: 0, y: 0 };
  private initialTranslate = { x: 0, y: 0 };

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this.img = this.shadowRoot!.querySelector("img")!;

    // Observe all attribute mutations on the host and forward them to the inner <img>
    this.attrObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName) {
          this.forwardAttribute(m.attributeName);
        }
      }
    });
  }

  connectedCallback() {
    // Forward any attributes already present on the host
    for (const attr of this.attributes) {
      this.forwardAttribute(attr.name);
    }

    // Watch for future attribute changes
    this.attrObserver.observe(this, { attributes: true });

    // Re-dispatch non-bubbling <img> events so they're visible on the host
    this.img.addEventListener("load", this.onImgLoad);
    this.img.addEventListener("error", this.onImgError);

    this.addEventListener("touchstart", this.onTouchStart, { passive: false });
    this.addEventListener("touchmove", this.onTouchMove, { passive: false });
    this.addEventListener("touchend", this.onTouchEnd);
  }

  disconnectedCallback() {
    this.attrObserver.disconnect();
    this.img.removeEventListener("load", this.onImgLoad);
    this.img.removeEventListener("error", this.onImgError);
    this.removeEventListener("touchstart", this.onTouchStart);
    this.removeEventListener("touchmove", this.onTouchMove);
    this.removeEventListener("touchend", this.onTouchEnd);
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
  }

  private onImgLoad = () => {
    this.dispatchEvent(new Event("load"));
  };

  private onImgError = () => {
    this.dispatchEvent(new Event("error"));
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
      const rect = this.getBoundingClientRect();

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

customElements.define("p-img", PImg);
