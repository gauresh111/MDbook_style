/**
 * Starlight plugin that registers the mdBook theme — stylesheets first, and
 * the components that go with them.
 *
 * Consumers cannot avoid touching `astro.config.mjs` entirely — nothing in
 * Astro discovers an installed package on its own, and a stylesheet has to be
 * registered somewhere. What this plugin removes is the need for them to know
 * *what* to register: the file list, the specifiers and the layering order all
 * live here, so the consumer writes one entry that never changes again and
 * picks up new theme files on a version bump.
 *
 * The same applies to the component overrides. The theme's chrome — the
 * breadcrumb title, the brand lockup, the theme switch, the head scripts —
 * is only half CSS; declaring it here means a site gets the whole design from
 * one plugin entry instead of a `components` block it has to keep in step.
 */
import { resolveConfig, OVERRIDE_NAMES } from './config.js';
import { mdbookStyleIntegration } from './integration.js';

/* Bare specifiers, not relative paths. Starlight resolves a relative
   `customCss` entry against the *consumer's* project root, where these files
   do not exist; a package specifier goes through node resolution and lands in
   node_modules regardless of who is importing. The same is true of the
   component paths below. */
const BASE_CSS = 'mdbook-style/custom.css';
const ANDROID_CSS = 'mdbook-style/android.css';

/**
 * @param {import('./starlight.js').MdbookStyleOptions} [options]
 * @returns {{ name: string; hooks: Record<string, Function> }}
 */
export default function mdbookStyle(options = {}) {
	const { android = true, components = true } = options;
	const config = resolveConfig(options);

	return {
		name: 'mdbook-style',
		hooks: {
			/**
			 * @param {{ config: any, updateConfig: Function, addIntegration: Function }} param
			 */
			'config:setup'({ config: starlightConfig, updateConfig, addIntegration }) {
				addIntegration(mdbookStyleIntegration(config));

				/* Prepended, not appended: within `customCss` the later entry wins
				   equal-specificity ties, so loading the theme first is what lets a
				   consumer override it from their own stylesheet. android.css still
				   follows custom.css — that pair's relative order is the whole basis
				   of the Android layer's overrides. */
				updateConfig({
					customCss: [
						BASE_CSS,
						...(android ? [ANDROID_CSS] : []),
						...(starlightConfig.customCss ?? []),
					],
					/* Merged rather than replaced: `updateConfig` shallow-merges, so
					   returning a bare object here would drop every override the site
					   declared itself. A slot the site has already filled is left
					   alone — the consumer's own component is more specific than the
					   theme's, and silently displacing it would be unexplainable from
					   their config file. */
					components: {
						...overrideComponents(components, starlightConfig.components ?? {}),
						...(starlightConfig.components ?? {}),
					},
				});
			},
		},
	};
}

/**
 * The theme's component overrides, minus any the site opted out of and any
 * slot it already fills itself.
 *
 * @param {true | false | Partial<Record<string, boolean>>} selection
 * @param {Record<string, string>} userComponents
 * @returns {Record<string, string>}
 */
function overrideComponents(selection, userComponents) {
	if (selection === false) return {};

	/** @type {Record<string, string>} */
	const out = {};
	for (const name of OVERRIDE_NAMES) {
		if (selection !== true && selection[name] === false) continue;
		if (name in userComponents) continue;
		out[name] = `mdbook-style/overrides/${name}.astro`;
	}
	return out;
}
