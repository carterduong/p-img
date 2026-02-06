import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createTouchEvent, touch } from "./helpers/touch";
import { PImg } from "../src/pimg";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create an element attached to the DOM so connectedCallback fires. */
function createElement(attrs: Record<string, string> = {}): PImg {
  const el = document.createElement("p-img") as PImg;
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

function getImg(el: PImg): HTMLImageElement {
  return el.shadowRoot!.querySelector("img")!;
}

function getStyle(el: PImg): HTMLStyleElement {
  return el.shadowRoot!.querySelector("style")!;
}

/** Wait a microtask so MutationObserver callbacks run. */
async function tick() {
  await Promise.resolve();
}

// ---------------------------------------------------------------------------
// Registration & Instantiation
// ---------------------------------------------------------------------------

describe("Registration & Instantiation", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("is registered as 'p-img'", () => {
    expect(customElements.get("p-img")).toBe(PImg);
  });

  it("creates an instance via document.createElement", () => {
    const el = document.createElement("p-img");
    expect(el).toBeInstanceOf(PImg);
  });

  it("has an open shadow root", () => {
    const el = createElement();
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.mode).toBe("open");
  });

  it("contains an <img> with part='img'", () => {
    const el = createElement();
    const img = getImg(el);
    expect(img).toBeInstanceOf(HTMLImageElement);
    expect(img.getAttribute("part")).toBe("img");
  });

  it("contains a <style> element", () => {
    const el = createElement();
    const style = getStyle(el);
    expect(style).toBeInstanceOf(HTMLStyleElement);
  });

  it("each instance has its own shadow root and img", () => {
    const a = createElement();
    const b = createElement();
    expect(a.shadowRoot).not.toBe(b.shadowRoot);
    expect(getImg(a)).not.toBe(getImg(b));
  });
});

// ---------------------------------------------------------------------------
// Attribute Forwarding
// ---------------------------------------------------------------------------

describe("Attribute Forwarding", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // --- standard attrs forwarded ---

  it("forwards src", async () => {
    el.setAttribute("src", "photo.jpg");
    await tick();
    expect(img.getAttribute("src")).toBe("photo.jpg");
  });

  it("forwards alt", async () => {
    el.setAttribute("alt", "a photo");
    await tick();
    expect(img.getAttribute("alt")).toBe("a photo");
  });

  it("forwards width", async () => {
    el.setAttribute("width", "200");
    await tick();
    expect(img.getAttribute("width")).toBe("200");
  });

  it("forwards height", async () => {
    el.setAttribute("height", "100");
    await tick();
    expect(img.getAttribute("height")).toBe("100");
  });

  it("forwards loading", async () => {
    el.setAttribute("loading", "lazy");
    await tick();
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("forwards decoding", async () => {
    el.setAttribute("decoding", "async");
    await tick();
    expect(img.getAttribute("decoding")).toBe("async");
  });

  it("forwards crossorigin", async () => {
    el.setAttribute("crossorigin", "anonymous");
    await tick();
    expect(img.getAttribute("crossorigin")).toBe("anonymous");
  });

  it("forwards data-* attributes", async () => {
    el.setAttribute("data-testid", "my-img");
    await tick();
    expect(img.getAttribute("data-testid")).toBe("my-img");
  });

  it("forwards aria-* attributes", async () => {
    el.setAttribute("aria-label", "Photo");
    await tick();
    expect(img.getAttribute("aria-label")).toBe("Photo");
  });

  it("forwards fetchpriority", async () => {
    el.setAttribute("fetchpriority", "high");
    await tick();
    expect(img.getAttribute("fetchpriority")).toBe("high");
  });

  // --- host-only attrs blocked ---

  it("blocks style", async () => {
    el.setAttribute("style", "color:red");
    await tick();
    expect(img.hasAttribute("style")).toBe(false);
  });

  it("blocks class", async () => {
    el.setAttribute("class", "foo");
    await tick();
    expect(img.hasAttribute("class")).toBe(false);
  });

  it("blocks id", async () => {
    el.setAttribute("id", "my-id");
    await tick();
    expect(img.hasAttribute("id")).toBe(false);
  });

  it("blocks slot", async () => {
    el.setAttribute("slot", "s");
    await tick();
    expect(img.hasAttribute("slot")).toBe(false);
  });

  it("blocks part", async () => {
    // part is already on <img> as "img"; host-level part should not overwrite
    el.setAttribute("part", "custom");
    await tick();
    expect(img.getAttribute("part")).toBe("img");
  });

  it("blocks tabindex", async () => {
    el.setAttribute("tabindex", "0");
    await tick();
    expect(img.hasAttribute("tabindex")).toBe(false);
  });

  it("blocks zooming", async () => {
    el.setAttribute("zooming", "");
    await tick();
    expect(img.hasAttribute("zooming")).toBe(false);
  });

  it("blocks is", async () => {
    el.setAttribute("is", "x");
    await tick();
    expect(img.hasAttribute("is")).toBe(false);
  });

  // --- dynamic removal ---

  it("removes forwarded attribute when host attr is removed", async () => {
    el.setAttribute("alt", "hello");
    await tick();
    expect(img.getAttribute("alt")).toBe("hello");
    el.removeAttribute("alt");
    await tick();
    expect(img.hasAttribute("alt")).toBe(false);
  });

  // --- pre-existing attrs ---

  it("forwards pre-existing attributes set before connection", async () => {
    const pre = document.createElement("p-img") as PImg;
    pre.setAttribute("alt", "preexisting");
    pre.setAttribute("src", "pre.jpg");
    document.body.appendChild(pre);
    // connectedCallback runs synchronously
    const preImg = getImg(pre);
    expect(preImg.getAttribute("alt")).toBe("preexisting");
    expect(preImg.getAttribute("src")).toBe("pre.jpg");
  });
});

// ---------------------------------------------------------------------------
// Event Re-dispatching
// ---------------------------------------------------------------------------

describe("Event Re-dispatching", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("re-dispatches load event from host", () => {
    const spy = vi.fn();
    el.addEventListener("load", spy);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("re-dispatches error event from host", () => {
    const spy = vi.fn();
    el.addEventListener("error", spy);
    img.dispatchEvent(new Event("error"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("re-dispatched event is a new Event (not the original)", () => {
    let received: Event | null = null;
    const original = new Event("load");
    el.addEventListener("load", (e) => { received = e; });
    img.dispatchEvent(original);
    expect(received).not.toBeNull();
    expect(received).not.toBe(original);
  });

  it("does not duplicate events after disconnect and reconnect", () => {
    const spy = vi.fn();
    el.addEventListener("load", spy);

    // disconnect
    el.remove();
    img.dispatchEvent(new Event("load"));
    expect(spy).not.toHaveBeenCalled();

    // reconnect
    document.body.appendChild(el);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Shadow DOM Styles
// ---------------------------------------------------------------------------

describe("Shadow DOM Styles", () => {
  let css: string;

  beforeEach(() => {
    const el = createElement();
    css = getStyle(el).textContent!;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // :host
  it(":host has display:inline-block", () => {
    expect(css).toContain("display: inline-block");
  });

  it(":host has overflow:hidden", () => {
    expect(css).toMatch(/overflow:\s*hidden/);
  });

  it(":host has touch-action:none", () => {
    expect(css).toMatch(/touch-action:\s*none/);
  });

  // :host([zooming])
  it(":host([zooming]) has overflow:visible", () => {
    expect(css).toMatch(/overflow:\s*visible/);
  });

  it(":host([zooming]) has z-index:2147483647", () => {
    expect(css).toContain("z-index: 2147483647");
  });

  it(":host([zooming]) has position:relative", () => {
    expect(css).toMatch(/position:\s*relative/);
  });

  // img
  it("img has display:block", () => {
    expect(css).toMatch(/display:\s*block/);
  });

  it("img has width:100%", () => {
    expect(css).toMatch(/width:\s*100%/);
  });

  it("img has height:100%", () => {
    expect(css).toMatch(/height:\s*100%/);
  });

  it("img has transform-origin:0 0", () => {
    expect(css).toMatch(/transform-origin:\s*0\s+0/);
  });

  // inherited properties
  it("img inherits object-fit", () => {
    expect(css).toMatch(/object-fit:\s*inherit/);
  });

  it("img inherits object-position", () => {
    expect(css).toMatch(/object-position:\s*inherit/);
  });

  // img.returning
  it("img.returning has transition for transform", () => {
    expect(css).toMatch(/transition:\s*transform/);
  });
});

// ---------------------------------------------------------------------------
// Touch / Pinch-to-Zoom
// ---------------------------------------------------------------------------

describe("Touch / Pinch-to-Zoom", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
    // Mock getBoundingClientRect (jsdom returns all zeros)
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, width: 200, height: 200,
      top: 0, left: 0, right: 200, bottom: 200,
      toJSON() { return {}; },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("single touch does not activate zooming", () => {
    const e = createTouchEvent("touchstart", [touch(50, 50)]);
    el.dispatchEvent(e);
    expect(el.hasAttribute("zooming")).toBe(false);
  });

  it("two-finger touchstart sets [zooming] attribute", () => {
    const e = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(e);
    expect(el.hasAttribute("zooming")).toBe(true);
  });

  it("two-finger touchstart calls preventDefault", () => {
    const e = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    const spy = vi.spyOn(e, "preventDefault");
    el.dispatchEvent(e);
    expect(spy).toHaveBeenCalled();
  });

  it("two-finger touchmove applies scale transform", () => {
    // start: distance = hypot(50,50) ≈ 70.71
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // move: distance = hypot(100,100) ≈ 141.42 → scale ≈ 2
    const move = createTouchEvent("touchmove", [touch(25, 25, 0), touch(125, 125, 1)]);
    el.dispatchEvent(move);

    expect(img.style.transform).toContain("scale(");
    // scale should be approximately 2
    const scaleMatch = img.style.transform.match(/scale\(([^)]+)\)/);
    expect(scaleMatch).not.toBeNull();
    const scaleVal = parseFloat(scaleMatch![1]);
    expect(scaleVal).toBeCloseTo(2, 0);
  });

  it("two-finger touchmove calls preventDefault", () => {
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    const move = createTouchEvent("touchmove", [touch(25, 25, 0), touch(125, 125, 1)]);
    const spy = vi.spyOn(move, "preventDefault");
    el.dispatchEvent(move);
    expect(spy).toHaveBeenCalled();
  });

  it("scale is clamped to minimum of 1", () => {
    // start: distance = hypot(100,100)
    const start = createTouchEvent("touchstart", [touch(0, 0, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // move: fingers closer → would produce scale < 1
    const move = createTouchEvent("touchmove", [touch(48, 48, 0), touch(52, 52, 1)]);
    el.dispatchEvent(move);

    const scaleMatch = img.style.transform.match(/scale\(([^)]+)\)/);
    expect(scaleMatch).not.toBeNull();
    const scaleVal = parseFloat(scaleMatch![1]);
    expect(scaleVal).toBe(1);
  });

  it("scale is clamped to maximum of 5", () => {
    // start: distance = hypot(2,2) ≈ 2.83
    const start = createTouchEvent("touchstart", [touch(99, 99, 0), touch(101, 101, 1)]);
    el.dispatchEvent(start);

    // move: distance = hypot(200,200) → ratio ~100 → clamped to 5
    const move = createTouchEvent("touchmove", [touch(0, 0, 0), touch(200, 200, 1)]);
    el.dispatchEvent(move);

    const scaleMatch = img.style.transform.match(/scale\(([^)]+)\)/);
    expect(scaleMatch).not.toBeNull();
    const scaleVal = parseFloat(scaleMatch![1]);
    expect(scaleVal).toBe(5);
  });

  it("touchmove applies translation for panning", () => {
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // move fingers to the right by 30px (same distance to keep scale ~1)
    const d = Math.hypot(50, 50); // keep same distance
    const move = createTouchEvent("touchmove", [
      touch(80, 50, 0),
      touch(80 + 50, 100, 1),
    ]);
    el.dispatchEvent(move);

    expect(img.style.transform).toContain("translate(");
  });

  it("touchend with < 2 fingers triggers reset animation", () => {
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    const move = createTouchEvent("touchmove", [touch(25, 25, 0), touch(125, 125, 1)]);
    el.dispatchEvent(move);

    // lift one finger
    const end = createTouchEvent("touchend", [touch(125, 125, 1)], [touch(25, 25, 0)]);
    (end as any).touches = { 0: touch(125, 125, 1), length: 1, item: (i: number) => i === 0 ? touch(125, 125, 1) : null };
    el.dispatchEvent(end);

    expect(img.classList.contains("returning")).toBe(true);
    expect(img.style.transform).toBe("");
  });

  it("transitionend after reset removes zooming attr and returning class", () => {
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // end
    const end = createTouchEvent("touchend", [], [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(end);

    // simulate transitionend
    img.dispatchEvent(new Event("transitionend"));

    expect(img.classList.contains("returning")).toBe(false);
    expect(el.hasAttribute("zooming")).toBe(false);
  });

  it("re-pinch during return animation reads current transform", () => {
    // Start a zoom
    const start1 = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start1);

    const move1 = createTouchEvent("touchmove", [touch(25, 25, 0), touch(125, 125, 1)]);
    el.dispatchEvent(move1);

    // End → starts returning animation
    const end = createTouchEvent("touchend", [], [touch(25, 25, 0), touch(125, 125, 1)]);
    el.dispatchEvent(end);
    expect(img.classList.contains("returning")).toBe(true);

    // Mock getComputedStyle to return a mid-animation matrix
    const origGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((elt) => {
      if (elt === img) {
        const fake = origGetComputedStyle(elt);
        return new Proxy(fake, {
          get(target, prop) {
            if (prop === "transform") return "matrix(1.5, 0, 0, 1.5, 10, 20)";
            return Reflect.get(target, prop);
          },
        });
      }
      return origGetComputedStyle(elt);
    });

    // New pinch starts — should cancel return animation
    const start2 = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start2);

    expect(img.classList.contains("returning")).toBe(false);
    // Style should have the frozen transform
    expect(img.style.transform).toContain("matrix(1.5, 0, 0, 1.5, 10, 20)");
  });

  it("single-finger touchmove is ignored (no transform)", () => {
    const start = createTouchEvent("touchstart", [touch(50, 50, 0)]);
    el.dispatchEvent(start);

    const move = createTouchEvent("touchmove", [touch(80, 80, 0)]);
    el.dispatchEvent(move);

    expect(img.style.transform).toBe("");
  });
});

// ---------------------------------------------------------------------------
// readTransform
// ---------------------------------------------------------------------------

describe("readTransform", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, width: 200, height: 200,
      top: 0, left: 0, right: 200, bottom: 200,
      toJSON() { return {}; },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("parses matrix transform values correctly", () => {
    const origGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((elt) => {
      if (elt === img) {
        const fake = origGetComputedStyle(elt);
        return new Proxy(fake, {
          get(target, prop) {
            if (prop === "transform") return "matrix(2, 0, 0, 2, 30, 40)";
            return Reflect.get(target, prop);
          },
        });
      }
      return origGetComputedStyle(elt);
    });

    // Trigger touchstart which calls readTransform internally
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // The transform should have been frozen onto the style
    expect(img.style.transform).toContain("matrix(2, 0, 0, 2, 30, 40)");
  });

  it("handles 'none' / empty transform", () => {
    // jsdom getComputedStyle returns "" for transform by default, which
    // readTransform treats same as "none" → resets scale/translate to 0

    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);

    // After readTransform with "none", a touchmove with same distance should give scale=1
    const move = createTouchEvent("touchmove", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(move);

    const scaleMatch = img.style.transform.match(/scale\(([^)]+)\)/);
    expect(scaleMatch).not.toBeNull();
    expect(parseFloat(scaleMatch![1])).toBeCloseTo(1, 5);
  });
});

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

describe("Lifecycle", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("connectedCallback forwards attributes and starts observing", async () => {
    const el = createElement({ src: "img.jpg", alt: "test" });
    const img = getImg(el);
    expect(img.getAttribute("src")).toBe("img.jpg");
    expect(img.getAttribute("alt")).toBe("test");

    // MutationObserver is active after connection
    el.setAttribute("data-x", "1");
    await tick();
    expect(img.getAttribute("data-x")).toBe("1");
  });

  it("disconnectedCallback removes img event listeners", () => {
    const el = createElement();
    const img = getImg(el);

    const spy = vi.fn();
    el.addEventListener("load", spy);

    el.remove(); // triggers disconnectedCallback

    img.dispatchEvent(new Event("load"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("disconnectedCallback stops MutationObserver", async () => {
    const el = createElement();
    const img = getImg(el);

    el.remove();
    el.setAttribute("data-test", "val");
    await tick();
    // The observer was disconnected, so attr should NOT forward
    expect(img.hasAttribute("data-test")).toBe(false);
  });

  it("reconnecting restores all functionality", async () => {
    const el = createElement({ src: "a.jpg" });
    const img = getImg(el);

    el.remove();
    document.body.appendChild(el);

    // Existing attrs re-forwarded
    expect(img.getAttribute("src")).toBe("a.jpg");

    // Observer active again
    el.setAttribute("alt", "reconnected");
    await tick();
    expect(img.getAttribute("alt")).toBe("reconnected");

    // Events re-wired
    const spy = vi.fn();
    el.addEventListener("load", spy);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("disconnectedCallback removes touch listeners", () => {
    const el = createElement();
    const img = getImg(el);

    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      x: 0, y: 0, width: 200, height: 200,
      top: 0, left: 0, right: 200, bottom: 200,
      toJSON() { return {}; },
    });

    el.remove();

    // Touch events should not activate zoom after disconnect
    const start = createTouchEvent("touchstart", [touch(50, 50, 0), touch(100, 100, 1)]);
    el.dispatchEvent(start);
    expect(el.hasAttribute("zooming")).toBe(false);
  });

  it("handles element created with pre-existing attrs before DOM insertion", () => {
    const el = document.createElement("p-img") as PImg;
    el.setAttribute("src", "early.jpg");
    el.setAttribute("alt", "early");
    el.setAttribute("class", "should-not-forward");

    // Not yet connected — img should not have attrs yet via observer
    // but after connecting, connectedCallback forwards them
    document.body.appendChild(el);
    const img = getImg(el);

    expect(img.getAttribute("src")).toBe("early.jpg");
    expect(img.getAttribute("alt")).toBe("early");
    expect(img.hasAttribute("class")).toBe(false);
  });
});
