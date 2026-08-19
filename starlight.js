/**
 * Starlight plugin that registers the mdBook theme stylesheets.
 *
 * Consumers cannot avoid touching `astro.config.mjs` entirely — nothing in
 * Astro discovers an installed package on its own, and a stylesheet has to be
 * registered somewhere. What this plugin removes is the need for them to know
 * *what* to register: the file list, the specifiers and the layering order all
 * live here, so the consumer writes one entry that never changes again and
 * picks up new theme files on a version bump.
 */

/* Bare specifiers, not relative paths. Starlight resolves a relative
   `customCss` entry against the *consumer's* project root, where these files
   do not exist; a package specifier goes through node resolution and lands in
   node_modules regardless of who is importing. */
const BASE_CSS = 'mdbook-style/custom.css';
const ANDROID_CSS = 'mdbook-style/android.css';

/**
 * @param {{ android?: boolean }} [options]
 *   `android` (default `true`) — layer the Android-docs design over the base.
 *   Set it to `false` to take only the token-driven base and skin it yourself.
 * @returns {{ name: string; hooks: Record<string, Function> }}
 */
export default function mdbookStyle(options = {}) {
	const { android = true } = options;

	return {
		name: 'mdbook-style',
		hooks: {
			/**
			 * @param {{ config: any, updateConfig: Function }} param
			 */
			'config:setup'({ config, updateConfig }) {
				/* Prepended, not appended: within `customCss` the later entry wins
				   equal-specificity ties, so loading the theme first is what lets a
				   consumer override it from their own stylesheet. android.css still
				   follows custom.css — that pair's relative order is the whole basis
				   of the Android layer's overrides. */
				updateConfig({
					customCss: [
						BASE_CSS,
						...(android ? [ANDROID_CSS] : []),
						...(config.customCss ?? []),
					],
				});
			},
		},
	};
}
