import { describe, expect, it } from 'vitest';
import type { Edition } from './edition';
import { meta, pageUrl, saveName, shareFor, shareMode } from './share';

const edition: Edition = {
	count: 10,
	last: 8,
	chapters: [
		{ title: 'Prologue', first: 3 },
		{ title: 'Act One', first: 4 }
	]
};

describe('pageUrl', () => {
	it('is the canonical /p/N on the origin', () => {
		expect(pageUrl('https://riverbanks.lol', 26)).toBe('https://riverbanks.lol/p/26');
	});
});

describe('shareFor', () => {
	it('names the act and the page', () => {
		expect(shareFor(edition, 5)).toEqual({
			title: 'Riverbanks · Act One',
			text: 'Page 5 of Riverbanks Volume I, a climate fiction comic by Seapunk Studios. Read it free online.'
		});
	});
});

describe('meta', () => {
	it('points the card at the page, absolute, at 1200×630', () => {
		const m = meta(edition, 'https://riverbanks.lol', 5, 'abc123');
		expect(m.url).toBe('https://riverbanks.lol/p/5');
		expect(m.image).toBe('https://riverbanks.lol/comic/05-card.jpg?v=abc123');
		expect([m.width, m.height]).toEqual([1200, 630]);
		expect(m.title).toBe('Riverbanks · Act One');
		expect(m.alt).toBe('Page 5 of Riverbanks, Act One');
	});
});

describe('saveName', () => {
	it('names the saved page after the site and the page', () => {
		expect(saveName(26)).toBe('riverbanks-p26.jpg');
	});
});

describe('shareMode', () => {
	it('uses the share sheet where there is one, else the menu', () => {
		expect(shareMode({ share: () => Promise.resolve() })).toBe('native');
		expect(shareMode({})).toBe('menu');
	});
});
