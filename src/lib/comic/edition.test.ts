import { describe, expect, it } from 'vitest';
import { chapterAt, contents, EDITION, pageSrc, type Edition } from './edition';

const edition: Edition = {
	count: 8,
	credits: 8,
	chapters: [
		{ title: 'Prologue', first: 3 },
		{ title: 'Act One', first: 4 },
		{ title: 'Epilogue', first: 7 }
	]
};

describe('contents', () => {
	it('lists each page once, in order, with its chapter', () => {
		const pages = contents(edition).flatMap((c) => c.pages);
		expect(pages).toEqual([1, 2, 3, 4, 5, 6, 7]);
		const act = contents(edition).find((c) => c.title === 'Act One');
		expect(act?.pages).toEqual([4, 5, 6]);
	});

	it('leaves the credits page out of the book', () => {
		expect(contents(edition).flatMap((c) => c.pages)).not.toContain(8);
	});

	it('puts pages before the first chapter in a front-matter group', () => {
		const [front] = contents(edition);
		expect(front).toMatchObject({ title: 'Cover', pages: [1, 2] });
	});

	it('has no front-matter group when the first chapter starts on page 1', () => {
		const groups = contents({ count: 3, chapters: [{ title: 'Only', first: 1 }] });
		expect(groups).toEqual([{ title: 'Only', first: 1, pages: [1, 2, 3] }]);
	});

	it('refuses chapters out of order', () => {
		expect(() =>
			contents({ ...edition, chapters: [edition.chapters[1], edition.chapters[0]] })
		).toThrow(/order/);
	});

	it('refuses a chapter starting past the end or on the credits page', () => {
		expect(() => contents({ ...edition, chapters: [{ title: 'Late', first: 9 }] })).toThrow();
		expect(() => contents({ ...edition, chapters: [{ title: 'Credits', first: 8 }] })).toThrow();
	});

	it('accepts the edition the site ships', () => {
		expect(() => contents(EDITION)).not.toThrow();
	});

	it('refuses a credits page that is not in the edition', () => {
		expect(() => contents({ ...edition, credits: 12 })).toThrow(/credits/);
	});
});

describe('chapterAt', () => {
	it('gives the chapter of any page, including the last in the book', () => {
		expect(chapterAt(edition, 1).title).toBe('Cover');
		expect(chapterAt(edition, 4).title).toBe('Act One');
		expect(chapterAt(edition, 6).title).toBe('Act One');
		expect(chapterAt(edition, 7).title).toBe('Epilogue');
	});
});

describe('pageSrc', () => {
	it('zero-pads the page and puts the edition version on the URL', () => {
		expect(pageSrc(3, 800, 'abc123')).toBe('/comic/03-800.webp?v=abc123');
		expect(pageSrc(47, 1600, 'abc123')).toBe('/comic/47-1600.webp?v=abc123');
	});
});
