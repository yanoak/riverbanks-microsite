import { describe, expect, it } from 'vitest';
import { EDITION, type Edition } from './edition';
import { CROP, MARKERS, onMap, place } from './map';

const edition: Edition = {
	count: 10,
	last: 8,
	chapters: [
		{ title: 'Prologue', first: 3 },
		{ title: 'Act One', first: 4 },
		{ title: 'Epilogue', first: 7 }
	]
};
const crop = { x: 100, y: 50, w: 400, h: 200 };

describe('MARKERS', () => {
	it('has a marker for every chapter, and none for anything else', () => {
		const firsts = EDITION.chapters.map((c) => c.first).sort((a, b) => a - b);
		expect(
			Object.keys(MARKERS)
				.map(Number)
				.sort((a, b) => a - b)
		).toEqual(firsts);
	});

	it('puts every marker inside the crop the landing page shows', () => {
		expect(onMap(EDITION, MARKERS, CROP)).toHaveLength(EDITION.chapters.length);
	});
});

describe('place', () => {
	it('gives percentages inside the crop, its corners at 0% and 100%', () => {
		expect(place({ x: 100, y: 50 }, crop)).toEqual({ left: 0, top: 0 });
		expect(place({ x: 500, y: 250 }, crop)).toEqual({ left: 100, top: 100 });
		expect(place({ x: 200, y: 100 }, crop)).toEqual({ left: 25, top: 25 });
	});

	it('reports a marker outside the crop as off the map', () => {
		expect(place({ x: 99, y: 100 }, crop)).toBeNull();
		expect(place({ x: 200, y: 251 }, crop)).toBeNull();
	});
});

describe('onMap', () => {
	it('lists the markers in reading order, whatever their order on the map', () => {
		const at = { 7: { x: 150, y: 60 }, 3: { x: 400, y: 200 }, 4: { x: 300, y: 100 } };
		expect(onMap(edition, at, crop).map((m) => m.first)).toEqual([3, 4, 7]);
	});

	it('leaves out a chapter whose marker is missing or off the map', () => {
		const at = { 3: { x: 400, y: 200 }, 4: { x: 0, y: 0 } };
		expect(onMap(edition, at, crop).map((m) => m.first)).toEqual([3]);
	});

	it('carries the chapter title and the position', () => {
		const at = { 3: { x: 300, y: 150 } };
		expect(onMap(edition, at, crop)[0]).toEqual({
			title: 'Prologue',
			first: 3,
			left: 50,
			top: 50
		});
	});
});
