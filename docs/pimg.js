const r = document.createElement("template");
r.innerHTML = `
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
    transform-origin: 0 0;
  }
  img.returning {
    transition: transform 0.3s ease-out;
  }
</style>
<img part="img" />
`;
const u = ["src", "alt", "loading", "crossorigin", "srcset", "sizes"], n = class n extends HTMLElement {
  constructor() {
    super(), this.scale = 1, this.translateX = 0, this.translateY = 0, this.initialDistance = 0, this.initialScale = 1, this.initialMidpoint = { x: 0, y: 0 }, this.initialTranslate = { x: 0, y: 0 }, this.onTouchStart = (t) => {
      if (t.touches.length === 2) {
        t.preventDefault(), this.img.classList.remove("returning");
        const i = getComputedStyle(this.img).transform;
        i && i !== "none" && (this.img.style.transform = i), this.readTransform(), this.setAttribute("zooming", ""), this.initialDistance = this.getTouchDistance(t.touches), this.initialScale = this.scale, this.initialMidpoint = this.getTouchMidpoint(t.touches), this.initialTranslate = { x: this.translateX, y: this.translateY };
      }
    }, this.onTouchMove = (t) => {
      if (t.touches.length === 2) {
        t.preventDefault();
        const i = this.getTouchDistance(t.touches), s = Math.min(Math.max(this.initialScale * (i / this.initialDistance), 1), 5), a = this.getTouchMidpoint(t.touches), o = this.getBoundingClientRect(), l = this.initialMidpoint.x - o.left, c = this.initialMidpoint.y - o.top, h = s / this.initialScale, m = this.initialTranslate.x - l * (h - 1) + (a.x - this.initialMidpoint.x), d = this.initialTranslate.y - c * (h - 1) + (a.y - this.initialMidpoint.y);
        this.scale = s, this.translateX = m, this.translateY = d, this.applyTransform();
      }
    }, this.onTouchEnd = (t) => {
      t.touches.length < 2 && this.animateReset();
    }, this.attachShadow({ mode: "open" }), this.shadowRoot.appendChild(r.content.cloneNode(!0)), this.img = this.shadowRoot.querySelector("img");
  }
  connectedCallback() {
    this.addEventListener("touchstart", this.onTouchStart, { passive: !1 }), this.addEventListener("touchmove", this.onTouchMove, { passive: !1 }), this.addEventListener("touchend", this.onTouchEnd);
  }
  disconnectedCallback() {
    this.removeEventListener("touchstart", this.onTouchStart), this.removeEventListener("touchmove", this.onTouchMove), this.removeEventListener("touchend", this.onTouchEnd);
  }
  attributeChangedCallback(t, i, s) {
    s === null ? this.img.removeAttribute(t) : this.img.setAttribute(t, s);
  }
  getTouchDistance(t) {
    const i = t[0].clientX - t[1].clientX, s = t[0].clientY - t[1].clientY;
    return Math.hypot(i, s);
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
    const i = t.match(/matrix\((.+)\)/);
    if (i) {
      const s = i[1].split(",").map(Number);
      this.scale = s[0], this.translateX = s[4], this.translateY = s[5];
    }
  }
};
n.observedAttributes = u;
let e = n;
customElements.define("p-img", e);
export {
  e as PImg
};
