import { describe, expect, it } from 'vitest';
import { chapterAt, contents, EDITION, pageSrc, type Edition } from './edition';

const edition: Edition = {
	count: 10,
	last: 8,
	credits: 9,
	chapters: [
		{ title: 'Prologue', first: 3 },
		{ title: 'Act One', first: 4 },
		{ title: 'Epilogue', first: 7 }
	]
};

describe('contents', () => {
	it('lists each chapter page once, in order, with its chapter', () => {
		expect(contents(edition).flatMap((c) => c.pages)).toEqual([3, 4, 5, 6, 7, 8]);
		const act = contents(edition).find((c) => c.title === 'Act One');
		expect(act?.pages).toEqual([4, 5, 6]);
	});

	it('leaves out every page outside the chapters', () => {
		const pages = contents(edition).flatMap((c) => c.pages);
		for (const p of [1, 2, 9, 10]) expect(pages).not.toContain(p);
		expect(contents(edition).map((c) => c.title)).toEqual(['Prologue', 'Act One', 'Epilogue']);
	});

	it('refuses chapters out of order', () => {
		expect(() =>
			contents({ ...edition, chapters: [edition.chapters[1], edition.chapters[0]] })
		).toThrow(/order/);
	});

	it('refuses a chapter starting after the last page', () => {
		expect(() => contents({ ...edition, chapters: [{ title: 'Late', first: 9 }] })).toThrow();
	});

	it('refuses a last page past the end of the edition', () => {
		expect(() => contents({ ...edition, last: 11 })).toThrow(/last/);
	});

	it('refuses a credits page inside the chapters', () => {
		expect(() => contents({ ...edition, credits: 5 })).toThrow(/credits/);
		expect(() => contents({ ...edition, credits: 12 })).toThrow(/credits/);
	});

	it('accepts the edition the site ships', () => {
		expect(() => contents(EDITION)).not.toThrow();
	});

	it('names the acts as the Premiere Edition dividers do', () => {
		expect(EDITION.chapters.map((c) => c.title)).toEqual([
			'Prologue: Six Disasters, One Dream',
			'Act One: Life, the Pluriverse, and Everything',
			'Act Two: House of Taming Currents',
			'Act Three: Kinetic Adaptation Economy',
			'Act Four: Gross Deliciousness Index',
			'Act Five: A Visa for a Hilsa',
			'Epilogue: River of Seeds'
		]);
	});
});

describe('chapterAt', () => {
	it('gives the chapter of any page, including the last in the book', () => {
		expect(chapterAt(edition, 3).title).toBe('Prologue');
		expect(chapterAt(edition, 4).title).toBe('Act One');
		expect(chapterAt(edition, 6).title).toBe('Act One');
		expect(chapterAt(edition, 8).title).toBe('Epilogue');
	});
});

describe('pageSrc', () => {
	it('zero-pads the page and puts the edition version on the URL', () => {
		expect(pageSrc(3, 800, 'abc123')).toBe('/comic/03-800.webp?v=abc123');
		expect(pageSrc(47, 1600, 'abc123')).toBe('/comic/47-1600.webp?v=abc123');
	});
});
