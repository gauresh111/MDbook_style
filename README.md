# mdbook-style

The Starlight theme shared by the eYantra mdBook docs sites — the stylesheets
and the components that go with them.

- `custom.css` — the shared, token-driven base (design tokens, typography, layout,
  sidebar/header chrome, admonitions, video-embed and icon-list rules).
- `android.css` — the Android-docs design layer, applied *on top of* the base.
- `overrides/` — the Starlight slots the theme fills: `Head`, `Hero`,
  `PageTitle`, `SiteTitle`, `SocialIcons`, `ThemeSelect`. Registered by the
  plugin; a site never names them.
- `components/` — the content components a page imports for itself (`Step`,
  `Verify`, `Fix`, `Troubleshoot`, `DocCard`, `Roadmap*`, `Story*`, …).

## Install

```sh
pnpm add github:gauresh111/MDbook_style
```

Installs straight from GitHub using the git access you already have — no
registry, no token, no `.npmrc`.

## Use

Add the plugin. That is the whole integration — it registers both stylesheets
in the right order, ahead of anything the site declares itself, and fills the
theme's component slots:

```js
import mdbookStyle from 'mdbook-style';

starlight({
  plugins: [mdbookStyle()],
})
```

Nothing goes in `customCss` for the theme, and nothing goes in `components` for
the overrides. Keep `customCss` for site-local overrides only; they load *after*
the theme and so win. A slot you *do* fill yourself in `components` is left
alone — your component is the more specific one.

Content components are imported where they are used, by package path:

```mdx
import Step from 'mdbook-style/components/Step.astro';
```

### Options

| Option | Default | What it does |
| --- | --- | --- |
| `android` | `true` | Layer the Android-docs design over the token-driven base. `false` gives the base alone. |
| `components` | `true` | Register the theme's overrides. `false` for none; `{ Hero: false }` to drop individual ones. |
| `brand.org` | `'e-Yantra'` | The organisation named in component prose — the submission and handoff blocks say what does and does not reach it. |
| `brand.siteTitle` | Starlight `title` | First crumb of the breadcrumb trail. |
| `brand.mark` | `true` | The eYantra mark beside the site title. |
| `links.github` | Starlight `social` | Repository link in the header. Dropped when neither is set. |
| `links.forum` | `https://discuss.e-yantra.org/` | Where the troubleshooting block sends unmatched errors. |
| `links.portal` | `https://portal.e-yantra.org/` | Student portal link in the header. |
| `progress.storagePrefix` | `'mdbook'` | localStorage namespace for the step checkboxes. Two mdBooks on one origin need distinct prefixes or they share progress. |
| `progress.groups` | `{}` | The graded parts of the site's task list, keyed by the `group` prop `Step`, `Verify` and `StepTracker` take. |

```js
mdbookStyle({
  brand: { siteTitle: 'KrishiCobot' },
  progress: {
    storagePrefix: 'kc-task0',
    groups: {
      install: { label: 'Installation', total: 8, slug: 'stage_1/task_0/instruction' },
    },
  },
})
```

The values reach the components through a `virtual:mdbook-style/config` module
the plugin's integration provides, which is also what the client scripts inside
them import — so a site states each of them once, in `astro.config.mjs`, and
never in a component.

### Why one line and not zero

Neither Astro nor Starlight discovers an installed package on its own, so a
stylesheet has to be named somewhere. The plugin is the smallest possible
version of that: the file list, the module specifiers and the layering order all
live inside the package, so consumers never restate them and pick up new theme
files on a version bump instead of a config edit.

The raw stylesheets stay exported (`mdbook-style/custom.css`,
`.../android.css`) as an escape hatch for non-Starlight consumers.

## What the theme expects from the host site

The stylesheets are standalone files with no local asset dependencies (fonts come
from a remote Google Fonts `@import`), but some rules target markup this package
does not emit:

- `.video-embed` / `.video-mini-wrap` / `.video-mini-stage` — produced by the
  `remarkYouTubeEmbeds` plugin in the host's `astro.config.mjs`.
- `.icon-list` — produced by the `remarkIconList` plugin.

Without those plugins the rules are simply inert; the rest of the theme works.

Two components need something from the site as well:

- `Announcements.astro` reads an `announcements` content collection, so the site
  has to define one in `src/content.config.ts`.
- `DocCard.astro` measures the file it links to under the site's `public/`.

## Releasing a change

There is no publish step. Push to `main` and consumers pick it up with
`pnpm update mdbook-style`.
