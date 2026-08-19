/**
 * Option resolution for the mdbook-style plugin.
 *
 * The packaged components carry prose and links that belong to the site, not
 * to the theme — the organisation's name, its forum and portal URLs, the
 * localStorage namespace the progress store writes under. Those cannot be
 * props: Starlight instantiates the override components itself, and the
 * progress store is a plain module shared by client scripts. So they are
 * resolved here, once, and handed to every component through the
 * `virtual:mdbook-style/config` module.
 *
 * Defaults describe an eYantra mdBook, which is what every consumer of this
 * package is today; anything site-specific enough to have no sensible default
 * (the progress groups) starts empty.
 */

/** @typedef {import('./starlight.js').MdbookStyleOptions} MdbookStyleOptions */

/** Names of the Starlight components this package can supply. */
export const OVERRIDE_NAMES = [
	'Head',
	'Hero',
	'PageTitle',
	'SiteTitle',
	'SocialIcons',
	'ThemeSelect',
];

/**
 * @param {MdbookStyleOptions} [options]
 * @returns {import('./starlight.js').MdbookStyleConfig}
 */
export function resolveConfig(options = {}) {
	const { brand = {}, links = {}, progress = {} } = options;

	return {
		brand: {
			org: brand.org ?? 'e-Yantra',
			/* No default: PageTitle falls back to the Starlight `title`, which is
			   already the one name every site has to declare. */
			siteTitle: brand.siteTitle ?? null,
			mark: brand.mark ?? true,
		},
		links: {
			github: links.github ?? null,
			forum: links.forum ?? 'https://discuss.e-yantra.org/',
			portal: links.portal ?? 'https://portal.e-yantra.org/',
		},
		progress: {
			storagePrefix: progress.storagePrefix ?? 'mdbook',
			/* Empty by default. A group is a graded part of one site's own task
			   list; a theme cannot guess them, and inventing defaults would make
			   the summary meter report on steps that do not exist. */
			groups: progress.groups ?? {},
		},
	};
}
