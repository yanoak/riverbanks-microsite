/**
 * The edition of the comic the reader shows: its chapters, and where each starts. The page
 * images and pages.json come from scripts/comic-pages.sh, run on the generator's web-edition
 * PDF. When a new edition moves pages, update `first` here; the tests refuse a chapter list
 * that no longer fits the page count.
 */
import pages from './pages.json';

export interface Chapter {
	title: string;
	/** The 1-based page the chapter starts on, usually its divider board. */
	first: number;
}

export interface Edition {
	count: number;
	chapters: Chapter[];
	/** The last page of the last chapter. The reader shows only the chapters, so covers,
	 * blanks and posters around them stay in the PDF. */
	last: number;
	/** The credits board. It is shown in the credits box after the book, not in it. */
	credits?: number;
}

export interface Group extends Chapter {
	pages: number[];
}

export const PAGES = pages;

// From Compilation Lo Res (30 Oct, Premiere Edition): the cover, the credits board on 2 and a
// blank 3, then each act opens on its divider board; the Epilogue ends on 49, then three posters.
// Titles follow the compilation comic's dividers (checked over MCP, 29 Oct).
export const EDITION: Edition = {
	count: pages.count,
	last: 49,
	credits: 2,
	chapters: [
		{ title: 'Prologue: Six Disasters, One Dream', first: 4 },
		{ title: 'Act One: Life, the Pluriverse, and Everything', first: 6 },
		{ title: 'Act Two: House of Taming Currents', first: 11 },
		{ title: 'Act Three: Kinetic Adaptation Economy', first: 19 },
		{ title: 'Act Four: Gross Deliciousness Index', first: 26 },
		{ title: 'Act Five: A Visa for a Hilsa', first: 33 },
		{ title: 'Epilogue: River of Seeds', first: 43 }
	]
};

/** The book's pages grouped by chapter, from the first chapter's first page to `last`. */
export function contents({ count, chapters, last, credits }: Edition): Group[] {
	if (last < 1 || last > count)
		throw new Error(`last page ${last} is not in a ${count}-page edition`);
	chapters.forEach((c, i) => {
		if (c.first < 1 || c.first > last) throw new Error(`${c.title} starts after the last page`);
		if (i > 0 && c.first <= chapters[i - 1].first) throw new Error(`${c.title} is out of order`);
	});
	if (
		credits !== undefined &&
		(credits < 1 || credits > count || (credits >= chapters[0].first && credits <= last))
	) {
		throw new Error(`credits page ${credits} is inside the chapters or not in the edition`);
	}

	return chapters.map((c, i) => {
		const end = i + 1 < chapters.length ? chapters[i + 1].first - 1 : last;
		const pages: number[] = [];
		for (let p = c.first; p <= end; p++) pages.push(p);
		return { ...c, pages };
	});
}

export function chapterAt(edition: Edition, page: number): Group {
	const groups = contents(edition);
	return groups.findLast((g) => g.first <= page) ?? groups[0];
}

/** A page's image: WebP for reading, a 1200 px JPEG for saving, or its 1200×630 share card. */
export function pageSrc(page: number, size: 800 | 1600 | 'jpg' | 'card', version: string): string {
	const n = String(page).padStart(2, '0');
	const file =
		size === 'jpg' ? `${n}.jpg` : size === 'card' ? `${n}-card.jpg` : `${n}-${size}.webp`;
	return `/comic/${file}?v=${version}`;
}
