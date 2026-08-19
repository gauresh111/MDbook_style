# mdbook-style

The Starlight stylesheet layer shared by the eYantra mdBook docs sites.

- `custom.css` — the shared, token-driven base (design tokens, typography, layout,
  sidebar/header chrome, admonitions, video-embed and icon-list rules).
- `android.css` — the Android-docs design layer, applied *on top of* the base.

## Install

```sh
pnpm add github:gauresh111/MDbook_style
```

Installs straight from GitHub using the git access you already have — no
registry, no token, no `.npmrc`.

## Use

Add the plugin. That is the whole integration — it registers both stylesheets,
in the right order, ahead of anything the site declares itself:

```js
import mdbookStyle from 'mdbook-style';

starlight({
  plugins: [mdbookStyle()],
})
```

Nothing goes in `customCss` for the theme. Keep that array for site-local
overrides only; they load *after* the theme and so win.

Pass `{ android: false }` to take just the token-driven base without the
Android-docs layer.

### Why one line and not zero

Neither Astro nor Starlight discovers an installed package on its own, so a
stylesheet has to be named somewhere. The plugin is the smallest possible
version of that: the file list, the module specifiers and the layering order all
live inside the package, so consumers never restate them and pick up new theme
files on a version bump instead of a config edit.

The raw stylesheets stay exported (`mdbook-style/custom.css`,
`.../android.css`) as an escape hatch for non-Starlight consumers.

## What the CSS expects from the host site

The stylesheets are standalone files with no local asset dependencies (fonts come
from a remote Google Fonts `@import`), but some rules target markup this package
does not emit:

- `.video-embed` / `.video-mini-wrap` / `.video-mini-stage` — produced by the
  `remarkYouTubeEmbeds` plugin in the host's `astro.config.mjs`.
- `.icon-list` — produced by the `remarkIconList` plugin.

Without those plugins the rules are simply inert; the rest of the theme works.

## Releasing a change

There is no publish step. Push to `main` and consumers pick it up with
`pnpm update mdbook-style`.
