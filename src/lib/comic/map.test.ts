import { describe, expect, it } from 'vitest';
import { EDITION, type Edition } from './edition';
import { bounds, frame, layout, MARKERS, onMap, toScreen } from './map';

const edition: Edition = {
	count: 10,
	last: 8,
	chapters: [
		{ title: 'Prologue', first: 3 },
		{ title: 'Act One', first: 4 },
		{ title: 'Epilogue', first: 7 }
	]
};

describe('MARKERS', () => {
	it('has a marker for every chapter, and none for anything else', () => {
		const firsts = EDITION.chapters.map((c) => c.first).sort((a, b) => a - b);
		expect(
			Object.keys(MARKERS)
				.map(Number)
				.sort((a, b) => a - b)
		).toEqual(firsts);
	});
});

describe('onMap', () => {
	it('lists the markers in reading order, whatever their order on the map', () => {
		const at = { 7: { x: 150, y: 60 }, 3: { x: 400, y: 200 }, 4: { x: 300, y: 100 } };
		expect(onMap(edition, at).map((m) => m.first)).toEqual([3, 4, 7]);
	});

	it('leaves out a chapter without a marker, and carries the title and position', () => {
		expect(onMap(edition, { 3: { x: 300, y: 150 } })).toEqual([
			{ title: 'Prologue', first: 3, x: 300, y: 150 }
		]);
	});
});

describe('bounds', () => {
	it('is the box around the markers, padded on every side', () => {
		const at = { 1: { x: 100, y: 50 }, 2: { x: 300, y: 150 }, 3: { x: 200, y: 90 } };
		expect(bounds(at, 10)).toEqual({ x: 90, y: 40, w: 220, h: 120 });
	});
});

describe('frame', () => {
	const view = { w: 1000, h: 600 };
	const box = { x: 100, y: 100, w: 200, h: 100 };

	it('fits the markers’ box in the free space and centres it', () => {
		const f = frame(view, { x: 0, y: 0, w: 1000, h: 600 }, box);
		expect(f.scale).toBe(5);
		// The box's centre (200, 150) lands on the free space's centre.
		expect(toScreen({ x: 200, y: 150 }, f)).toEqual({ left: 500, top: 300 });
	});

	it('is limited by whichever side of the free space is tighter', () => {
		expect(frame(view, { x: 0, y: 0, w: 1000, h: 200 }, box).scale).toBe(2);
		expect(frame(view, { x: 0, y: 0, w: 400, h: 600 }, box).scale).toBe(2);
	});

	it('pulls the map back to the screen’s edges, so no gap shows', () => {
		// Centring in the right half would leave the map's left edge at 500 px.
		const f = frame(view, { x: 500, y: 0, w: 500, h: 600 }, { x: 0, y: 0, w: 100, h: 100 });
		expect(f.x).toBe(0);
		expect(f.y).toBeLessThanOrEqual(0);
	});
});

describe('toScreen', () => {
	it('scales map units and adds the offset', () => {
		expect(toScreen({ x: 10, y: 20 }, { scale: 2, x: -5, y: 7 })).toEqual({ left: 15, top: 47 });
	});
});

describe('layout', () => {
	it('puts the panel at the side on wide landscape screens, at the bottom otherwise', () => {
		expect(layout(1440, 900)).toBe('side');
		expect(layout(1180, 820)).toBe('side');
		expect(layout(820, 1180)).toBe('bottom');
		expect(layout(390, 844)).toBe('bottom');
		expect(layout(844, 390)).toBe('bottom');
	});
});
