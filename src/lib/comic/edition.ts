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
	/** The credits board. It is shown in the credits box after the book, not in it. */
	credits?: number;
}

export interface Group extends Chapter {
	pages: number[];
}

export const PAGES = pages;

// From Compilation Lo Res (12 Oct): two posters, then each act opens on its divider board.
export const EDITION: Edition = {
	count: pages.count,
	credits: pages.count,
	chapters: [
		{ title: 'Prologue: Six Disasters, One Dream', first: 3 },
		{ title: 'Act One: Life, the Pluriverse, and Everything', first: 4 },
		{ title: 'Act Two: House of Taming Currents', first: 9 },
		{ title: 'Act Three: Kinetic Adaptation Economy', first: 17 },
		{ title: 'Act Four: Gross Deliciousness Index', first: 24 },
		{ title: 'Act Five: A Visa for a Hilsa', first: 31 },
		{ title: 'Epilogue: River of Seeds', first: 41 }
	]
};

/** The book's pages grouped by chapter, with any pages before the first chapter as "Cover". */
export function contents({ count, chapters, credits }: Edition): Group[] {
	if (credits !== undefined && (credits < 1 || credits > count)) {
		throw new Error(`credits page ${credits} is not in a ${count}-page edition`);
	}
	chapters.forEach((c, i) => {
		if (c.first < 1 || c.first > count) throw new Error(`${c.title} starts past the end`);
		if (c.first === credits) throw new Error(`${c.title} starts on the credits page`);
		if (i > 0 && c.first <= chapters[i - 1].first) throw new Error(`${c.title} is out of order`);
	});

	const starts = chapters[0]?.first === 1 ? chapters : [{ title: 'Cover', first: 1 }, ...chapters];
	return starts.map((c, i) => {
		const end = i + 1 < starts.length ? starts[i + 1].first : count + 1;
		const pages: number[] = [];
		for (let p = c.first; p < end; p++) if (p !== credits) pages.push(p);
		return { ...c, pages };
	});
}

export function chapterAt(edition: Edition, page: number): Group {
	const groups = contents(edition);
	return groups.findLast((g) => g.first <= page) ?? groups[0];
}

export function pageSrc(page: number, width: 800 | 1600, version: string): string {
	return `/comic/${String(page).padStart(2, '0')}-${width}.webp?v=${version}`;
}
