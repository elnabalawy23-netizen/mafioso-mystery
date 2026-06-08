# Case art

Drop one image per case here, named by the case id, e.g. `c1.webp`, `e1.webp`,
`h2.webp`. Supported: `.webp`, `.jpg`, `.png` (WebP preferred — smallest).

They are auto-detected by `src/components/CaseArt.tsx` (via `import.meta.glob`)
and shown on the case-select cards and the crime-story screen. Until a file
exists for a case, a themed placeholder (icon + gradient) is shown instead.

Recommended source images: landscape ~3:2, no text. Convert to WebP and keep
each well under ~200 KB.

Case ids: c1 villa · c2 hotel · c3 yacht · c4 museum · c5 tech ·
e1 coffeehouse · e2 bakery · e3 car showroom · e4 gym · e5 pharmacy ·
m1 film set · m2 night train · m3 hospital · h1 desert station · h2 opera.
