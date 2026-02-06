import { describe, it, expect, afterEach } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg, getStyle } from "./helpers/dom";

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
