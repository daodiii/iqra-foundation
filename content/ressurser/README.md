# ressurser

The library: one JSON file per item, named by slug. Each item has a `category` (publikasjoner, artikler, videoer or styringsdokumenter: the client's four), a title, a date, a summary, and at least one of `file`, `video` or `url`. The shape is in `lib/content.ts`; the admin (`/keystatic`) writes the same files.
