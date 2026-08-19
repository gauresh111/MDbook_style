import type { StarlightPlugin } from '@astrojs/starlight/types';

export interface MdbookStyleOptions {
	/**
	 * Layer the Android-docs design over the token-driven base.
	 *
	 * @default true
	 */
	android?: boolean;
}

/**
 * Starlight plugin that registers the mdBook theme stylesheets, in the
 * correct order, ahead of any `customCss` the consuming site declares itself.
 */
export default function mdbookStyle(options?: MdbookStyleOptions): StarlightPlugin;
