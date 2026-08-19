/// <reference path="./virtual.d.ts" />
import type { StarlightPlugin } from '@astrojs/starlight/types';

/** A graded part of a site's task list, tracked by the progress components. */
export interface ProgressGroup {
	/** Name shown in the summary meter. */
	label: string;
	/**
	 * Fallback step count, used before the group's own page has been visited.
	 * The page itself reports the real number, which wins from then on.
	 */
	total: number;
	/** Page slug the meter links to, relative to the site base. */
	slug: string;
	/** Heading on that page to land on, for groups that share a page. */
	hash?: string;
}

export interface MdbookStyleOptions {
	/**
	 * Layer the Android-docs design over the token-driven base.
	 *
	 * @default true
	 */
	android?: boolean;

	/**
	 * Register the theme's Starlight component overrides (`Head`, `Hero`,
	 * `PageTitle`, `SiteTitle`, `SocialIcons`, `ThemeSelect`).
	 *
	 * Pass `false` for none of them, or an object to drop individual ones —
	 * `{ Hero: false }`. A slot the site fills in its own `components` block is
	 * left alone either way.
	 *
	 * @default true
	 */
	components?: boolean | Partial<Record<MdbookStyleOverride, boolean>>;

	brand?: {
		/**
		 * Organisation named in component prose — the submission and handoff
		 * blocks say what does and does not reach it.
		 *
		 * @default 'e-Yantra'
		 */
		org?: string;
		/**
		 * First crumb of the breadcrumb trail. Defaults to the Starlight
		 * `title`.
		 */
		siteTitle?: string;
		/**
		 * Show the eYantra mark beside the site title in the header.
		 *
		 * @default true
		 */
		mark?: boolean;
	};

	links?: {
		/**
		 * Repository link in the header. Defaults to the `github` entry of
		 * Starlight's own `social` config, and the link is dropped when neither
		 * is set.
		 */
		github?: string;
		/** @default 'https://discuss.e-yantra.org/' */
		forum?: string;
		/** @default 'https://portal.e-yantra.org/' */
		portal?: string;
	};

	progress?: {
		/**
		 * localStorage namespace for the step/verify checkboxes. Sites served
		 * from the same origin need distinct prefixes or they share progress.
		 *
		 * @default 'mdbook'
		 */
		storagePrefix?: string;
		/**
		 * Groups the summary meter reports on, keyed by the `group` prop the
		 * `Step`, `Verify` and `StepTracker` components take.
		 *
		 * @default {}
		 */
		groups?: Record<string, ProgressGroup>;
	};
}

/** Starlight slots this package can fill. */
export type MdbookStyleOverride =
	| 'Head'
	| 'Hero'
	| 'PageTitle'
	| 'SiteTitle'
	| 'SocialIcons'
	| 'ThemeSelect';

/** The resolved options, as the components see them. */
export interface MdbookStyleConfig {
	brand: { org: string; siteTitle: string | null; mark: boolean };
	links: { github: string | null; forum: string; portal: string };
	progress: { storagePrefix: string; groups: Record<string, ProgressGroup> };
}

/**
 * Starlight plugin that registers the mdBook theme stylesheets, in the
 * correct order, ahead of any `customCss` the consuming site declares itself,
 * along with the theme's component overrides.
 */
export default function mdbookStyle(options?: MdbookStyleOptions): StarlightPlugin;
