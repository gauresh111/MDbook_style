/**
 * Shared progress store for the step components.
 *
 * Four components read and write the same state — the checklist panel, the
 * inline step markers, the verify blocks and the summary meter — and two of
 * those live on pages the others don't. So the state cannot hang off any one
 * component; it is one localStorage key that all of them talk to through here.
 *
 * The site is served inside the portal's own iframe, where storage is often
 * partitioned and can be blocked outright. Every access is therefore guarded
 * and falls back to an in-memory copy: ticking a step still works for the rest
 * of the visit, it just doesn't survive a reload. Progress is a convenience
 * here, never a prerequisite — nothing in the docs is gated on it.
 */
import config from 'virtual:mdbook-style/config';
import type { ProgressGroup } from '../starlight.js';

/* Namespaced per site rather than per package: two mdBooks served from the
   same origin (the portal hosts them all under one host) would otherwise read
   each other's ticks, and the ids inside are only unique within a site. */
const KEY = `${config.progress.storagePrefix}-progress`;
const TOTALS_KEY = `${config.progress.storagePrefix}-totals`;

/** Fired on the document after any write, so components on the page re-render. */
export const EVENT = 'mdbook-style:progress';

export type GroupSpec = ProgressGroup;

/**
 * The graded parts of the site's task list, declared in `astro.config.mjs`
 * through the plugin's `progress.groups` option. Keys are the `group` prop the
 * components take, and every stored id is `group/step`, which is what lets the
 * summary meter count a group's progress without knowing its steps.
 *
 * Which parts belong here is a judgement about the site's own marks — an
 * ungraded bonus in the meter would misreport how much of a task is actually
 * left — so the theme ships none and a site names its own.
 */
export const GROUPS: Record<string, GroupSpec> = config.progress.groups;

/** Base-aware page URL for a group, for links out of the summary meter. */
export function hrefFor(group: string): string {
	const spec = GROUPS[group];
	if (!spec) return import.meta.env.BASE_URL;
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}/${spec.slug}/${spec.hash ? '#' + spec.hash : ''}`;
}

type Store = Record<string, true>;

/* Mirrors localStorage so a blocked or full store degrades to session-only
   state rather than to nothing at all. */
let memory: Store | null = null;
let memoryTotals: Record<string, number> = {};

function load<T>(key: string, fallback: T): T {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		const parsed = JSON.parse(raw);
		/* Anything but a plain object means the key was written by something
		   else, or by an older shape of this one. Discard rather than trust. */
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback;
		return parsed as T;
	} catch {
		return fallback;
	}
}

function save(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		/* Blocked, partitioned or over quota — the in-memory copy still holds. */
	}
}

function store(): Store {
	if (memory === null) memory = load<Store>(KEY, {});
	return memory;
}

export function isDone(id: string): boolean {
	return store()[id] === true;
}

export function setDone(id: string, done: boolean): void {
	const next = store();
	if (done) next[id] = true;
	else delete next[id];
	save(KEY, next);
	document.dispatchEvent(new CustomEvent(EVENT));
}

/** How many steps of a group are ticked, counted by id prefix. */
export function countFor(group: string): number {
	const prefix = group + '/';
	return Object.keys(store()).filter((id) => id.startsWith(prefix)).length;
}

/**
 * The step count a group's page actually rendered. Recorded on visit so the
 * summary meter reports the real denominator instead of the hardcoded one,
 * and so editing a page's steps cannot leave the meter quietly wrong.
 */
export function recordTotal(group: string, total: number): void {
	if (!total) return;
	memoryTotals = { ...totals(), [group]: total };
	save(TOTALS_KEY, memoryTotals);
}

function totals(): Record<string, number> {
	if (!Object.keys(memoryTotals).length) {
		memoryTotals = load<Record<string, number>>(TOTALS_KEY, {});
	}
	return memoryTotals;
}

export function totalFor(group: string): number {
	const seen = totals()[group];
	return typeof seen === 'number' && seen > 0 ? seen : (GROUPS[group]?.total ?? 0);
}

/**
 * Subscribe to changes. Covers three sources: this page's own writes, another
 * tab's writes (`storage`), and a view transition landing on a page whose
 * markup was rendered before the state changed.
 *
 * `root` is the element the subscriber renders into. View transitions replace
 * the document body without giving components a teardown hook, so each
 * navigation leaves the previous page's subscribers registered against markup
 * that is no longer attached. Checking the root still means every one of them
 * costs a boolean rather than a walk over detached nodes.
 */
export function onChange(fn: () => void, root?: Element): void {
	const run = () => {
		if (root && !root.isConnected) return;
		fn();
	};

	document.addEventListener(EVENT, run);
	window.addEventListener('storage', (e) => {
		if (e.key !== KEY && e.key !== TOTALS_KEY) return;
		/* Another tab wrote it, so the cached copy is stale by definition. */
		memory = null;
		memoryTotals = {};
		run();
	});
	document.addEventListener('astro:page-load', () => {
		memory = null;
		memoryTotals = {};
		run();
	});
}
