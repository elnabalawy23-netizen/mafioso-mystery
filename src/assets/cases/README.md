# Case art

One image per case, named by the case id (`c1`, `e6`, `h3`, …).

- **Built-in art:** every case ships with a hand-drawn noir `<id>.svg` poster
  (in this folder). These render on the case-select cards and the crime-story
  hero via `src/components/CaseArt.tsx` (`import.meta.glob`).
- **Overriding with real images:** drop `<id>.webp` / `.jpg` / `.png` next to
  the SVG — raster art automatically wins over the built-in SVG, no code
  change. Recommended: landscape 3:2, no text, well under ~200 KB (WebP).
- The card banner crops vertically (object-cover), so keep the subject in the
  middle band of the image.

Case ids: c1 villa · c2 hotel · c3 yacht · c4 museum · c5 tech ·
e1 coffeehouse · e2 bakery · e3 car showroom · e4 gym · e5 pharmacy ·
e6 clothes shop · m1 film set · m2 night train · m3 hospital ·
m4 TV studio · h1 desert station · h2 opera · h3 Nile cruise.
