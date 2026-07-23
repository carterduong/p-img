import { PImg } from "../../src/p-img";

/** Create an element attached to the DOM so connectedCallback fires. */
export function createElement(attrs: Record<string, string> = {}): PImg {
  const el = document.createElement("p-img") as PImg;
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  document.body.appendChild(el);
  return el;
}

export function getImg(el: PImg): HTMLImageElement {
  return el.shadowRoot!.querySelector("img")!;
}

export function getStyle(el: PImg): HTMLStyleElement {
  return el.shadowRoot!.querySelector("style")!;
}

/** The per-instance style element that mirrors width/height onto the host. */
export function getSizeStyle(el: PImg): HTMLStyleElement {
  const styles = el.shadowRoot!.querySelectorAll("style");
  return styles[styles.length - 1] as HTMLStyleElement;
}

/** Wait a microtask so MutationObserver callbacks run. */
export async function tick() {
  await Promise.resolve();
}
