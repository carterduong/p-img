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
