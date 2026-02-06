import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement, getStyle } from "./helpers/dom";

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
