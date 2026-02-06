import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg } from "./helpers/dom";
import { createTouchEvent, touch } from "./helpers/touch";

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
