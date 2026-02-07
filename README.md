#p-img

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

The `<p-img>` element accepts the same attributes as a standard `<img>`: `src`, `alt`, `srcset`, `sizes`, `loading`, and `crossorigin`.

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
