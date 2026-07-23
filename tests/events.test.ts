import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PImg } from "../src/p-img";
import { createElement, getImg } from "./helpers/dom";

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

  it("re-dispatched load event bubbles", () => {
    const spy = vi.fn();
    document.body.addEventListener("load", spy);
    img.dispatchEvent(new Event("load"));
    document.body.removeEventListener("load", spy);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("re-dispatched error event bubbles", () => {
    const spy = vi.fn();
    document.body.addEventListener("error", spy);
    img.dispatchEvent(new Event("error"));
    document.body.removeEventListener("error", spy);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("load listener is registered before src is forwarded (catches cached-image load)", () => {
    // Simulate: element created with src already set, then connected.
    // The inner img fires load synchronously when src is assigned to a cached URL.
    // We verify the listener is in place before forwardAttribute runs by checking
    // that a load fired during connectedCallback is still caught.
    document.body.innerHTML = "";
    const el2 = document.createElement("p-img") as PImg;
    el2.setAttribute("src", "cached.jpg");

    const spy = vi.fn();
    el2.addEventListener("load", spy);

    // Intercept setAttribute on the inner img to fire load synchronously,
    // mimicking a cached-image decode that resolves before connectedCallback returns.
    const inner = el2.shadowRoot!.querySelector("img") as HTMLImageElement;
    const origSet = inner.setAttribute.bind(inner);
    inner.setAttribute = (name: string, value: string) => {
      origSet(name, value);
      if (name === "src") inner.dispatchEvent(new Event("load"));
    };

    document.body.appendChild(el2);
    expect(spy).toHaveBeenCalledOnce();
  });

  it("does not duplicate events after disconnect and reconnect", () => {
    const spy = vi.fn();
    el.addEventListener("load", spy);

    // events still fire while detached
    el.remove();
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledOnce();

    // reconnecting must not stack a second internal listener
    document.body.appendChild(el);
    img.dispatchEvent(new Event("load"));
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
