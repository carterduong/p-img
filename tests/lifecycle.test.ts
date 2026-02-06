import { describe, it, expect, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg, tick } from "./helpers/dom";
import { createTouchEvent, touch } from "./helpers/touch";

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
