import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg, tick } from "./helpers/dom";

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
