import { describe, expect, it } from 'vitest';
import type { Edition } from './edition';
import { book, entries, guard, label, preload, step, ticks } from './reader';

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

describe('book', () => {
	it('lists the chapter pages in reading order', () => {
		expect(book(edition)).toEqual([3, 4, 5, 6, 7, 8]);
	});
});

describe('step', () => {
	it('turns one page either way', () => {
		expect(step(edition, 4, 1)).toBe(5);
		expect(step(edition, 4, -1)).toBe(3);
	});

	it('goes from the last page to the end card, and from the first page to nothing', () => {
		expect(step(edition, 8, 1)).toBe('end');
		expect(step(edition, 3, -1)).toBeNull();
	});
});

describe('guard', () => {
	it('lets a chapter page through', () => {
		expect(guard(edition, '5')).toEqual({ page: 5 });
	});

	it('sends a page outside the chapters to the first chapter page', () => {
		for (const n of ['1', '2', '9', '10', '99']) {
			expect(guard(edition, n)).toEqual({ redirect: 3 });
		}
	});

	it('refuses anything that is not a whole page number', () => {
		for (const n of ['abc', '5.5', '-3', '0', '', '05', '1e1'])
			expect(guard(edition, n)).toBeNull();
	});
});

describe('entries', () => {
	it('prerenders exactly the book pages', () => {
		expect(entries(edition)).toEqual(book(edition).map((p) => ({ n: String(p) })));
	});
});

describe('preload', () => {
	it('fetches the next two pages and the previous one', () => {
		expect(preload(edition, 5)).toEqual([6, 7, 4]);
	});

	it('stops at both ends of the book', () => {
		expect(preload(edition, 3)).toEqual([4, 5]);
		expect(preload(edition, 8)).toEqual([7]);
		expect(preload(edition, 7)).toEqual([8, 6]);
	});
});

describe('ticks', () => {
	it('puts one tick per chapter at its position in the book', () => {
		expect(ticks(edition)).toEqual([
			{ title: 'Prologue', first: 3, index: 0 },
			{ title: 'Act One', first: 4, index: 1 },
			{ title: 'Epilogue', first: 7, index: 4 }
		]);
	});
});

describe('label', () => {
	it('names the page by its printed number and its act', () => {
		expect(label(edition, 5)).toBe('Page 5, Act One');
	});
});
