import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg, getSizeStyle } from "./helpers/dom";

describe("Property Reflection", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // --- setters reflect to attributes and forward synchronously ---

  it("src property reflects to attribute and forwards", () => {
    el.src = "photo.jpg";
    expect(el.getAttribute("src")).toBe("photo.jpg");
    expect(img.getAttribute("src")).toBe("photo.jpg");
  });

  it("src getter returns the resolved URL like a native img", () => {
    el.src = "photo.jpg";
    expect(el.src).toBe(img.src);
    expect(el.src).toContain("photo.jpg");
  });

  it("srcset property reflects and forwards", () => {
    el.srcset = "a.jpg 1x, b.jpg 2x";
    expect(el.srcset).toBe("a.jpg 1x, b.jpg 2x");
    expect(img.getAttribute("srcset")).toBe("a.jpg 1x, b.jpg 2x");
  });

  it("sizes property reflects and forwards", () => {
    el.sizes = "100vw";
    expect(el.sizes).toBe("100vw");
    expect(img.getAttribute("sizes")).toBe("100vw");
  });

  it("alt property reflects and forwards synchronously", () => {
    el.alt = "a photo";
    expect(el.getAttribute("alt")).toBe("a photo");
    expect(img.getAttribute("alt")).toBe("a photo");
    expect(el.alt).toBe("a photo");
  });

  it("loading property reflects and forwards", () => {
    el.loading = "lazy";
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(el.loading).toBe("lazy");
  });

  it("decoding property reflects and forwards", () => {
    el.decoding = "sync";
    expect(img.getAttribute("decoding")).toBe("sync");
    expect(el.decoding).toBe("sync");
  });

  it("fetchPriority property reflects and forwards", () => {
    el.fetchPriority = "high";
    expect(img.getAttribute("fetchpriority")).toBe("high");
    expect(el.fetchPriority).toBe("high");
  });

  it("referrerPolicy property reflects and forwards", () => {
    el.referrerPolicy = "no-referrer";
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(el.referrerPolicy).toBe("no-referrer");
  });

  it("crossOrigin property reflects and forwards", () => {
    el.crossOrigin = "anonymous";
    expect(img.getAttribute("crossorigin")).toBe("anonymous");
    expect(el.crossOrigin).toBe("anonymous");
  });

  it("crossOrigin set to null removes the attribute", () => {
    el.crossOrigin = "anonymous";
    el.crossOrigin = null;
    expect(el.hasAttribute("crossorigin")).toBe(false);
    expect(img.hasAttribute("crossorigin")).toBe(false);
    expect(el.crossOrigin).toBeNull();
  });

  it("width/height properties reflect and forward", () => {
    el.width = 200;
    el.height = 100;
    expect(el.getAttribute("width")).toBe("200");
    expect(img.getAttribute("height")).toBe("100");
    expect(el.width).toBe(200);
    expect(el.height).toBe(100);
  });

  // --- getter defaults match native <img> ---

  it("getters return native defaults when attributes are absent", () => {
    expect(el.alt).toBe("");
    expect(el.srcset).toBe("");
    expect(el.sizes).toBe("");
    expect(el.loading).toBe("eager");
    expect(el.decoding).toBe("auto");
    expect(el.fetchPriority).toBe("auto");
    expect(el.referrerPolicy).toBe("");
    expect(el.crossOrigin).toBeNull();
  });

  // --- read-only passthroughs ---

  it("exposes naturalWidth/naturalHeight/currentSrc from the inner img", () => {
    expect(el.naturalWidth).toBe(img.naturalWidth);
    expect(el.naturalHeight).toBe(img.naturalHeight);
    expect(el.currentSrc).toBe(img.currentSrc);
  });

  it("decode() delegates to the inner img", async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    (img as any).decode = spy;
    await el.decode();
    expect(spy).toHaveBeenCalledOnce();
  });

  // --- setting the property clears loaded state ---

  it("setting src property clears complete", () => {
    img.dispatchEvent(new Event("load"));
    expect(el.complete).toBe(true);
    el.src = "next.jpg";
    expect(el.complete).toBe(false);
  });

  // --- pre-upgrade property assignment ---

  it("re-applies properties that shadow the accessors at connect time", () => {
    const pre = document.createElement("p-img") as PImg;
    // Simulate a property assigned before the element was upgraded: an own
    // property that shadows the class accessor
    Object.defineProperty(pre, "src", {
      value: "pre-upgrade.jpg",
      writable: true,
      configurable: true,
      enumerable: true,
    });
    document.body.appendChild(pre);

    expect(pre.getAttribute("src")).toBe("pre-upgrade.jpg");
    expect(getImg(pre).getAttribute("src")).toBe("pre-upgrade.jpg");
    // The own property is gone; the accessor is back in charge
    expect(Object.prototype.hasOwnProperty.call(pre, "src")).toBe(false);
  });
});

describe("Host Sizing from width/height", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("mirrors width attribute onto the host", () => {
    const el = createElement({ width: "400" });
    expect(getSizeStyle(el).textContent).toContain("width: 400px");
  });

  it("mirrors height attribute onto the host", () => {
    const el = createElement({ height: "300" });
    expect(getSizeStyle(el).textContent).toContain("height: 300px");
  });

  it("sets aspect-ratio when both width and height are present", () => {
    const el = createElement({ width: "400", height: "300" });
    const css = getSizeStyle(el).textContent!;
    expect(css).toContain("width: 400px");
    expect(css).toContain("height: 300px");
    expect(css).toContain("aspect-ratio: 400 / 300");
  });

  it("clears host sizing when the attributes are removed", async () => {
    const el = createElement({ width: "400", height: "300" });
    el.removeAttribute("width");
    el.removeAttribute("height");
    await Promise.resolve();
    expect(getSizeStyle(el).textContent).toBe("");
  });

  it("ignores non-numeric width/height values", () => {
    const el = createElement({ width: "banana", height: "50%" });
    expect(getSizeStyle(el).textContent).toBe("");
  });

  it("updates when set via properties", () => {
    const el = createElement();
    el.width = 640;
    el.height = 480;
    expect(getSizeStyle(el).textContent).toContain("aspect-ratio: 640 / 480");
  });
});
