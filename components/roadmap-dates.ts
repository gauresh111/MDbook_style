/**
 * Dates for the competition roadmap.
 *
 * Imported by the roadmap components' frontmatter *and* by the container's
 * client script, on purpose: the server renders a correct first paint, then the
 * client re-runs these same functions on a one-second clock so the countdowns
 * move. Two implementations of "is this task still open?" would eventually
 * disagree with each other; one cannot.
 */

/**
 * Every published deadline is an IST wall-clock date, so the offset is pinned
 * rather than read from the visitor's machine. Left to local time a task shown
 * as ending "15 Sep" would close a day early in Auckland and a day late in
 * Los Angeles — and the time remaining would be wrong for everyone outside
 * India, which is most of the point of showing it.
 */
const IST = '+05:30';
const DAY = 86_400_000;

export type Status = 'past' | 'live' | 'upcoming';

export interface Span {
	start: string;
	end: string;
}

/** Midnight IST on a span's first day — the instant it opens. */
export const opensAt = (iso: string) => Date.parse(`${iso}T00:00:00.000${IST}`);

/**
 * The last instant of a span's final day, IST. End dates are inclusive: a task
 * ending on the 15th is open all through the 15th, so the participant's deadline
 * is that day's midnight, not its morning.
 */
export const closesAt = (iso: string) => Date.parse(`${iso}T23:59:59.999${IST}`);

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Every beat on this page must state both of its dates, so a missing or
 * malformed one stops the build instead of rendering a card that quietly says
 * nothing. `label` names the offender in the message — with nine of these on the
 * page, "a task is missing a date" is not an actionable error.
 */
export function requireDay(value: unknown, prop: 'start' | 'end', label: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(
			`Roadmap: ${label} has no \`${prop}\` date. Every task and subtask needs both ` +
				`\`start\` and \`end\` as YYYY-MM-DD, e.g. ${prop}="2025-08-26".`
		);
	}
	const iso = value.trim();
	if (!ISO.test(iso) || Number.isNaN(opensAt(iso))) {
		throw new Error(
			`Roadmap: ${label} has \`${prop}="${value}"\`, which is not a date. ` +
				`Use YYYY-MM-DD, e.g. ${prop}="2025-08-26".`
		);
	}
	return iso;
}

/** Both dates at once, plus the one ordering mistake worth catching here. */
export function requireSpan(start: unknown, end: unknown, label: string): Span {
	const span = {
		start: requireDay(start, 'start', label),
		end: requireDay(end, 'end', label),
	};
	if (closesAt(span.end) < opensAt(span.start)) {
		throw new Error(
			`Roadmap: ${label} ends before it starts (start="${span.start}", end="${span.end}"). ` +
				`Check the two are not swapped.`
		);
	}
	return span;
}

export function requireText(value: unknown, prop: string, label: string): string {
	if (typeof value !== 'string' || value.trim() === '') {
		throw new Error(`Roadmap: ${label} has no \`${prop}\`. Add ${prop}="…".`);
	}
	return value.trim();
}

export function statusOf(span: Span, now: number): Status {
	if (now > closesAt(span.end)) return 'past';
	if (now >= opensAt(span.start)) return 'live';
	return 'upcoming';
}

/** How far through its own span a beat is: 0 before it opens, 1 once closed. */
export function elapsed(span: Span, now: number): number {
	const a = opensAt(span.start);
	const b = closesAt(span.end);
	if (b <= a) return now >= b ? 1 : 0;
	return Math.max(0, Math.min(1, (now - a) / (b - a)));
}

/**
 * Inclusive length in whole weeks. Inclusive is what makes these agree with the
 * published durations: 26 Aug → 15 Sep is 20 days apart but 21 days long, and
 * the schedule calls it three weeks.
 */
export function weeks(span: Span): number {
	const days = Math.round((opensAt(span.end) - opensAt(span.start)) / DAY) + 1;
	return Math.max(1, Math.round(days / 7));
}

export function weeksLabel(span: Span): string {
	const w = weeks(span);
	return w === 1 ? '1 week' : `${w} weeks`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Split an ISO day without constructing a Date — no zone to get wrong. */
const ymd = (iso: string): [number, number, number] => {
	const [y, m, d] = iso.split('-').map(Number);
	return [y ?? 0, m ?? 1, d ?? 1];
};

export function formatDay(iso: string, withYear = true): string {
	const [y, m, d] = ymd(iso);
	const day = `${d} ${MONTHS[m - 1]}`;
	return withYear ? `${day} ${y}` : day;
}

/** True when a span needs the year stated on both ends to be readable. */
export const crossesYear = (span: Span) => ymd(span.start)[0] !== ymd(span.end)[0];

/** "26 Aug – 15 Sep 2025" — the year is stated once unless the span crosses it. */
export function formatSpan(span: Span): string {
	return `${formatDay(span.start, crossesYear(span))} – ${formatDay(span.end)}`;
}

/**
 * Days, hours and minutes, down to seconds inside the last hour. The fine grain
 * appears only when it can change a decision — nobody needs seconds three weeks
 * out, and everybody wants them on submission night.
 */
export function countdown(ms: number): string {
	const t = Math.max(0, Math.floor(ms / 1000));
	const d = Math.floor(t / 86_400);
	const h = Math.floor((t % 86_400) / 3600);
	const m = Math.floor((t % 3600) / 60);
	const s = t % 60;
	if (d > 0) return `${d}d ${h}h ${m}m`;
	if (h > 0) return `${h}h ${m}m ${s}s`;
	return `${m}m ${s}s`;
}

/** Rounded up, because a deadline "in 0 days" is today, not passed. */
export function daysAway(ms: number): string {
	const d = Math.max(1, Math.ceil(ms / DAY));
	return d === 1 ? '1 day' : `${d} days`;
}

/** Coarse elapsed time, for spans closed long enough ago not to count in days. */
export function timeSince(ms: number): string {
	const d = Math.max(0, Math.floor(ms / DAY));
	if (d < 1) return 'today';
	if (d === 1) return 'yesterday';
	if (d < 21) return `${d} days ago`;
	const w = Math.round(d / 7);
	if (w < 9) return `${w} weeks ago`;
	const mo = Math.round(d / 30.44);
	if (mo < 18) return `${mo === 1 ? '1 month' : `${mo} months`} ago`;
	return `${Math.round((d / 365.25) * 10) / 10} years ago`;
}

export interface State {
	status: Status;
	/** Word for the status chip. */
	word: string;
	/** The participant's deadline, phrased for whichever side of it we are on. */
	remaining: string;
	/** Progress through this beat's own span, as a ready-made percentage. */
	meter: string;
}

const WORD: Record<Status, string> = {
	past: 'Completed',
	live: 'Live now',
	upcoming: 'Upcoming',
};

export function stateOf(span: Span, now: number): State {
	const status = statusOf(span, now);
	const meter = (elapsed(span, now) * 100).toFixed(2) + '%';

	if (status === 'past') {
		return { status, word: WORD.past, remaining: `closed ${timeSince(now - closesAt(span.end))}`, meter };
	}
	if (status === 'live') {
		return { status, word: WORD.live, remaining: `${countdown(closesAt(span.end) - now)} left`, meter };
	}
	return { status, word: WORD.upcoming, remaining: `opens in ${daysAway(opensAt(span.start) - now)}`, meter };
}
