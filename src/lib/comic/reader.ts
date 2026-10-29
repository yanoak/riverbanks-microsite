/**
 * The page reader's view of an edition: the book as a flat list of pages, turning, the `/p/[n]`
 * route's guard and the scrubber's chapter ticks. PhotoSwipe does the preloading. Pages are always the PDF page number, the one the
 * footer prints, so `/p/15` is the page that says "p15".
 */
import { chapterAt, contents, type Chapter, type Edition } from './edition';

/** The chapter pages, Prologue to Epilogue, in reading order. */
export function book(edition: Edition): number[] {
	return contents(edition).flatMap((c) => c.pages);
}

/** The page one turn away: 'end' past the last page (the end card), null before the first. */
export function step(edition: Edition, page: number, dir: 1 | -1): number | 'end' | null {
	const pages = book(edition);
	const next = pages.indexOf(page) + dir;
	if (next >= pages.length) return 'end';
	return next < 0 ? null : pages[next];
}

/** The `/p/[n]` param as a page to show, a page to redirect to, or null for a 404. */
export function guard(
	edition: Edition,
	param: string
): { page: number } | { redirect: number } | null {
	if (!/^[1-9]\d*$/.test(param)) return null;
	const pages = book(edition);
	const page = Number(param);
	return pages.includes(page) ? { page } : { redirect: pages[0] };
}

/** The pages to prerender, as `/p/[n]` entries: all of them, since the site is static and a
 * page outside the book needs its own redirect file. */
export function entries(edition: Edition): { n: string }[] {
	return Array.from({ length: edition.count }, (_, i) => ({ n: String(i + 1) }));
}

/** One scrubber tick per chapter, at the 0-based index of its first page in the book. */
export function ticks(edition: Edition): (Chapter & { index: number })[] {
	const pages = book(edition);
	return edition.chapters.map((c) => ({ ...c, index: pages.indexOf(c.first) }));
}

/** The page's accessible name, and the start of its title. */
export function label(edition: Edition, page: number): string {
	return `Page ${page}, ${chapterAt(edition, page).title}`;
}
