/**
 * Astro integration behind the Starlight plugin.
 *
 * It exists for two things the Starlight plugin API cannot do on its own:
 *
 *   1. `virtual:mdbook-style/config` — the resolved options, importable from
 *      both the `.astro` components and the client scripts inside them. A
 *      virtual module rather than a JSON file so the values are inlined into
 *      whichever bundle imports them, with no runtime fetch and no path that
 *      has to resolve at the consumer's root.
 *
 *   2. `ssr.noExternal` — this package ships uncompiled `.astro` files. Vite
 *      externalises dependencies for the SSR build by default, which would
 *      hand them to Node as-is; keeping the package inlined is what lets the
 *      Astro plugin compile them.
 */

const VIRTUAL_ID = 'virtual:mdbook-style/config';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * @param {import('./starlight.js').MdbookStyleConfig} config
 * @returns {import('astro').AstroIntegration}
 */
export function mdbookStyleIntegration(config) {
	return {
		name: 'mdbook-style',
		hooks: {
			'astro:config:setup': ({ updateConfig }) => {
				updateConfig({
					vite: {
						plugins: [
							{
								name: 'vite-plugin-mdbook-style-config',
								resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
								load: (id) =>
									id === RESOLVED_ID
										? `export default ${JSON.stringify(config)};`
										: undefined,
							},
						],
						ssr: { noExternal: ['mdbook-style'] },
					},
				});
			},
		},
	};
}
