# p-img

A lightweight web component that adds pinch-to-zoom to images on mobile.

[Demo](https://carterduong.github.io/p-img/)

## Install

```bash
npm install p-img
```

## Usage

```html
<script type="module">
  import "p-img";
</script>

<p-img src="photo.jpg" alt="A zoomable photo"></p-img>
```

The `<p-img>` element accepts the same attributes as a standard `<img>`: `src`, `alt`, `srcset`, `sizes`, `loading`, `crossorigin`, and so on. `width` and `height` attributes size the element and reserve aspect-ratio space before the image loads, like a native `<img>`. (`usemap`/`ismap` are the exception — image maps can't cross the shadow DOM boundary.)

## Properties

The element also mirrors the `HTMLImageElement` property API, so code written against a native `<img>` works unchanged:

```js
const el = document.querySelector("p-img");
el.src = "photo.jpg";      // reflects to the attribute
el.alt = "A zoomable photo";
await el.decode();
console.log(el.naturalWidth, el.currentSrc, el.complete);
```

Available: `src`, `srcset`, `sizes`, `alt`, `loading`, `decoding`, `crossOrigin`, `referrerPolicy`, `fetchPriority`, `width`, `height`, plus read-only `naturalWidth`, `naturalHeight`, `currentSrc`, `complete`, and `decode()`. Properties assigned before the element is defined are picked up on upgrade.

TypeScript consumers get typed elements automatically — the package augments `HTMLElementTagNameMap`, so `document.querySelector("p-img")` returns a `PImg`.

## Loading state

- The `loaded` attribute is present after a successful load (and removed on error or when `src`/`srcset`/`sizes` change), so you can style loading states with `p-img[loaded]`.
- `complete` reports whether the current image has loaded.
- `load` and `error` events are re-dispatched on the element (bubbling), plus composed `p-img-load` / `p-img-error` custom events that also cross shadow DOM boundaries.

## Behavior

- Two-finger pinch scales the image up to 5x
- The zoomed image overflows its container to the full viewport and renders above all other content
- Releasing the pinch animates the image back to its original size and position
- Re-pinching mid-animation picks up from the current state

## Styling

The internal `<img>` is exposed via a CSS `::part`:

```css
p-img::part(img) {
  border-radius: 8px;
}
```

The host element has `overflow: hidden` by default and gains a `[zooming]` attribute during a pinch gesture, which you can target:

```css
p-img[zooming] {
  /* styles applied while zooming */
}
```

## Development

```bash
npm run dev          # start dev server
npm run build        # build the library
npm run build:pages  # build and update GitHub Pages demo
```

## License

MIT
