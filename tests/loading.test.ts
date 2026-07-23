import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg, tick } from "./helpers/dom";

describe("Loading State", () => {
  let el: PImg;
  let img: HTMLImageElement;

  beforeEach(() => {
    el = createElement();
    img = getImg(el);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  // --- loaded attribute ---

  it("does not have loaded attribute initially", () => {
    expect(el.hasAttribute("loaded")).toBe(false);
  });

  it("sets loaded attribute when image loads", () => {
    img.dispatchEvent(new Event("load"));
    expect(el.hasAttribute("loaded")).toBe(true);
  });

  it("removes loaded attribute on error", () => {
    img.dispatchEvent(new Event("load"));
    img.dispatchEvent(new Event("error"));
    expect(el.hasAttribute("loaded")).toBe(false);
  });

  it("removes loaded attribute when src changes", async () => {
    img.dispatchEvent(new Event("load"));
    el.setAttribute("src", "new.jpg");
    await tick();
    expect(el.hasAttribute("loaded")).toBe(false);
  });

  it("removes loaded attribute when srcset changes", async () => {
    img.dispatchEvent(new Event("load"));
    el.setAttribute("srcset", "a.jpg 1x, b.jpg 2x");
    await tick();
    expect(el.hasAttribute("loaded")).toBe(false);
  });

  it("removes loaded attribute when sizes changes", async () => {
    img.dispatchEvent(new Event("load"));
    el.setAttribute("sizes", "100vw");
    await tick();
    expect(el.hasAttribute("loaded")).toBe(false);
  });

  it("does not remove loaded when unrelated attributes change", async () => {
    img.dispatchEvent(new Event("load"));
    el.setAttribute("alt", "updated");
    await tick();
    expect(el.hasAttribute("loaded")).toBe(true);
  });

  it("loaded is not forwarded to inner img", () => {
    img.dispatchEvent(new Event("load"));
    expect(img.hasAttribute("loaded")).toBe(false);
  });

  // --- complete property ---

  it("complete is false initially", () => {
    expect(el.complete).toBe(false);
  });

  it("complete is true after load", () => {
    img.dispatchEvent(new Event("load"));
    expect(el.complete).toBe(true);
  });

  it("complete is false after error", () => {
    img.dispatchEvent(new Event("load"));
    img.dispatchEvent(new Event("error"));
    expect(el.complete).toBe(false);
  });

  it("complete is false after src change", async () => {
    img.dispatchEvent(new Event("load"));
    el.setAttribute("src", "next.jpg");
    await tick();
    expect(el.complete).toBe(false);
  });

  // --- cached images ---

  it("catches load fired synchronously during connectedCallback (cached image)", () => {
    document.body.innerHTML = "";
    const el2 = document.createElement("p-img") as PImg;
    el2.setAttribute("src", "cached.jpg");

    const inner = el2.shadowRoot!.querySelector("img") as HTMLImageElement;
    const origSet = inner.setAttribute.bind(inner);
    inner.setAttribute = (name: string, value: string) => {
      origSet(name, value);
      if (name === "src") inner.dispatchEvent(new Event("load"));
    };

    document.body.appendChild(el2);
    expect(el2.hasAttribute("loaded")).toBe(true);
    expect(el2.complete).toBe(true);
  });

  // --- p-img-load / p-img-error custom events ---

  it("emits p-img-load on successful load", () => {
    const spy = vi.fn();
    el.addEventListener("p-img-load", spy);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("emits p-img-error on failed load", () => {
    const spy = vi.fn();
    el.addEventListener("p-img-error", spy);
    img.dispatchEvent(new Event("error"));
    expect(spy).toHaveBeenCalledOnce();
  });

  it("p-img-load bubbles", () => {
    const spy = vi.fn();
    document.body.addEventListener("p-img-load", spy);
    img.dispatchEvent(new Event("load"));
    document.body.removeEventListener("p-img-load", spy);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("p-img-error bubbles", () => {
    const spy = vi.fn();
    document.body.addEventListener("p-img-error", spy);
    img.dispatchEvent(new Event("error"));
    document.body.removeEventListener("p-img-error", spy);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("p-img-load is composed", () => {
    let received: CustomEvent | null = null;
    el.addEventListener("p-img-load", (e) => { received = e as CustomEvent; });
    img.dispatchEvent(new Event("load"));
    expect(received!.composed).toBe(true);
  });

  it("p-img-error is composed", () => {
    let received: CustomEvent | null = null;
    el.addEventListener("p-img-error", (e) => { received = e as CustomEvent; });
    img.dispatchEvent(new Event("error"));
    expect(received!.composed).toBe(true);
  });

  it("p-img-load crosses shadow DOM boundary (composed event)", () => {
    const wrapper = document.createElement("div");
    const shadowRoot = wrapper.attachShadow({ mode: "open" });
    el.remove();
    shadowRoot.appendChild(el);
    document.body.appendChild(wrapper);

    const spy = vi.fn();
    wrapper.addEventListener("p-img-load", spy);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();
  });
});
