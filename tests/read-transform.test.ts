import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg } from "./helpers/dom";
import { createTouchEvent, touch } from "./helpers/touch";

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
