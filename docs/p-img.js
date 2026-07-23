const a = document.createElement("template");
a.innerHTML = `
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
const g = /* @__PURE__ */ new Set([
  "zooming",
  "loaded",
  "style",
  "class",
  "id",
  "slot",
  "part",
  "exportparts",
  "is",
  "tabindex"
]), m = /* @__PURE__ */ new Set(["src", "srcset", "sizes"]), p = [
  "src",
  "srcset",
  "sizes",
  "alt",
  "loading",
  "decoding",
  "crossOrigin",
  "referrerPolicy",
  "fetchPriority",
  "width",
  "height"
], r = class r extends HTMLElement {
  constructor() {
    super(), this.scale = 1, this.translateX = 0, this.translateY = 0, this.initialDistance = 0, this.initialScale = 1, this.initialMidpoint = { x: 0, y: 0 }, this.initialTranslate = { x: 0, y: 0 }, this.cachedRect = null, this.onImgLoad = () => {
      this.setAttribute("loaded", ""), this.dispatchEvent(new Event("load", { bubbles: !0 })), this.dispatchEvent(new CustomEvent("p-img-load", { bubbles: !0, composed: !0 }));
    }, this.onImgError = () => {
      this.removeAttribute("loaded"), this.dispatchEvent(new Event("error", { bubbles: !0 })), this.dispatchEvent(new CustomEvent("p-img-error", { bubbles: !0, composed: !0 }));
    }, this.onTouchStart = (t) => {
      if (t.touches.length === 2) {
        t.preventDefault(), this.img.classList.remove("returning");
        const e = getComputedStyle(this.img).transform;
        e && e !== "none" && (this.img.style.transform = e), this.readTransform(), this.setAttribute("zooming", ""), this.cachedRect = this.getBoundingClientRect(), this.initialDistance = this.getTouchDistance(t.touches), this.initialScale = this.scale, this.initialMidpoint = this.getTouchMidpoint(t.touches), this.initialTranslate = { x: this.translateX, y: this.translateY };
      }
    }, this.onTouchMove = (t) => {
      if (t.touches.length === 2) {
        t.preventDefault();
        const e = this.getTouchDistance(t.touches), i = Math.min(Math.max(this.initialScale * (e / this.initialDistance), 1), 5), n = this.getTouchMidpoint(t.touches), o = this.cachedRect, c = this.initialMidpoint.x - o.left, l = this.initialMidpoint.y - o.top, h = i / this.initialScale, d = this.initialTranslate.x - c * (h - 1) + (n.x - this.initialMidpoint.x), u = this.initialTranslate.y - l * (h - 1) + (n.y - this.initialMidpoint.y);
        this.scale = i, this.translateX = d, this.translateY = u, this.applyTransform();
      }
    }, this.onTouchEnd = (t) => {
      t.touches.length < 2 && (this.cachedRect = null, this.animateReset());
    }, this.attachShadow({ mode: "open" }), this.shadowRoot.appendChild(a.content.cloneNode(!0)), this.img = this.shadowRoot.querySelector("img"), this.sizeStyle = document.createElement("style"), this.shadowRoot.appendChild(this.sizeStyle), this.img.addEventListener("load", this.onImgLoad), this.img.addEventListener("error", this.onImgError), this.attrObserver = new MutationObserver((t) => {
      for (const e of t)
        if (e.type === "attributes" && e.attributeName) {
          if (m.has(e.attributeName)) continue;
          this.forwardAttribute(e.attributeName);
        }
    }), this.attrObserver.observe(this, { attributes: !0 });
  }
  /** True when the current image has loaded successfully. */
  get complete() {
    return this.hasAttribute("loaded");
  }
  attributeChangedCallback(t) {
    this.removeAttribute("loaded"), this.forwardAttribute(t);
  }
  connectedCallback() {
    for (const t of p)
      if (Object.prototype.hasOwnProperty.call(this, t)) {
        const e = this[t];
        delete this[t], this[t] = e;
      }
    for (const t of this.attributes)
      this.forwardAttribute(t.name);
    this.updateHostSizing(), this.addEventListener("touchstart", this.onTouchStart, { passive: !1 }), this.addEventListener("touchmove", this.onTouchMove, { passive: !1 }), this.addEventListener("touchend", this.onTouchEnd);
  }
  disconnectedCallback() {
    this.removeEventListener("touchstart", this.onTouchStart), this.removeEventListener("touchmove", this.onTouchMove), this.removeEventListener("touchend", this.onTouchEnd);
  }
  // --- HTMLImageElement API -------------------------------------------------
  /** Resolved URL of the image source, like HTMLImageElement.src. */
  get src() {
    return this.img.src;
  }
  set src(t) {
    this.setAttribute("src", t);
  }
  get srcset() {
    return this.getAttribute("srcset") ?? "";
  }
  set srcset(t) {
    this.setAttribute("srcset", t);
  }
  get sizes() {
    return this.getAttribute("sizes") ?? "";
  }
  set sizes(t) {
    this.setAttribute("sizes", t);
  }
  get alt() {
    return this.getAttribute("alt") ?? "";
  }
  set alt(t) {
    this.setForwarded("alt", t);
  }
  get loading() {
    return this.getAttribute("loading") ?? "eager";
  }
  set loading(t) {
    this.setForwarded("loading", t);
  }
  get decoding() {
    return this.getAttribute("decoding") ?? "auto";
  }
  set decoding(t) {
    this.setForwarded("decoding", t);
  }
  get crossOrigin() {
    return this.getAttribute("crossorigin");
  }
  set crossOrigin(t) {
    this.setForwarded("crossorigin", t);
  }
  get referrerPolicy() {
    return this.getAttribute("referrerpolicy") ?? "";
  }
  set referrerPolicy(t) {
    this.setForwarded("referrerpolicy", t);
  }
  get fetchPriority() {
    return this.getAttribute("fetchpriority") ?? "auto";
  }
  set fetchPriority(t) {
    this.setForwarded("fetchpriority", t);
  }
  get width() {
    return this.img.width;
  }
  set width(t) {
    this.setForwarded("width", String(t));
  }
  get height() {
    return this.img.height;
  }
  set height(t) {
    this.setForwarded("height", String(t));
  }
  get naturalWidth() {
    return this.img.naturalWidth;
  }
  get naturalHeight() {
    return this.img.naturalHeight;
  }
  get currentSrc() {
    return this.img.currentSrc;
  }
  /** Decode the underlying image; resolves when it is safe to paint. */
  decode() {
    return this.img.decode();
  }
  // --------------------------------------------------------------------------
  /** Reflect a property to a host attribute and forward it synchronously —
   *  the MutationObserver would otherwise apply it a microtask later. */
  setForwarded(t, e) {
    e === null ? this.removeAttribute(t) : this.setAttribute(t, e), this.forwardAttribute(t);
  }
  /** Forward a single attribute from the host to the inner <img>, unless it's host-only. */
  forwardAttribute(t) {
    if (g.has(t)) return;
    const e = this.getAttribute(t);
    e === null ? this.img.removeAttribute(t) : this.img.setAttribute(t, e), (t === "width" || t === "height") && this.updateHostSizing();
  }
  /** Mirror width/height attributes onto the host, like <img>'s presentational
   *  hints. The inner img's `width/height: 100%` CSS would otherwise discard
   *  them, and the aspect-ratio reserves layout space before the image loads. */
  updateHostSizing() {
    const t = this.getAttribute("width"), e = this.getAttribute("height"), i = [];
    t && /^\d+$/.test(t) && i.push(`width: ${t}px;`), e && /^\d+$/.test(e) && i.push(`height: ${e}px;`), i.length === 2 && i.push(`aspect-ratio: ${t} / ${e};`), this.sizeStyle.textContent = i.length ? `:host { ${i.join(" ")} }` : "";
  }
  getTouchDistance(t) {
    const e = t[0].clientX - t[1].clientX, i = t[0].clientY - t[1].clientY;
    return Math.hypot(e, i);
  }
  getTouchMidpoint(t) {
    return {
      x: (t[0].clientX + t[1].clientX) / 2,
      y: (t[0].clientY + t[1].clientY) / 2
    };
  }
  applyTransform() {
    this.img.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }
  animateReset() {
    this.img.classList.add("returning"), this.img.style.transform = "";
    const t = () => {
      this.img.removeEventListener("transitionend", t), this.img.classList.remove("returning"), this.scale = 1, this.translateX = 0, this.translateY = 0, this.removeAttribute("zooming");
    };
    this.img.addEventListener("transitionend", t);
  }
  /** Read the current mid-animation transform back into our state. */
  readTransform() {
    const t = getComputedStyle(this.img).transform;
    if (!t || t === "none") {
      this.scale = 1, this.translateX = 0, this.translateY = 0;
      return;
    }
    const e = t.match(/matrix\((.+)\)/);
    if (e) {
      const i = e[1].split(",").map(Number);
      this.scale = i[0], this.translateX = i[4], this.translateY = i[5];
    }
  }
};
r.observedAttributes = ["src", "srcset", "sizes"];
let s = r;
customElements.define("p-img", s);
export {
  s as PImg
};
