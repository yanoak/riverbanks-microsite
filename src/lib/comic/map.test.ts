import { describe, expect, it } from 'vitest';
import { EDITION, type Edition } from './edition';
import {
	bounds,
	frame,
	layout,
	MAP,
	MARKERS,
	PLACES,
	project,
	spread,
	toScreen,
	unproject,
	onMap
} from './map';
import meta from './map.json';

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

describe('PLACES', () => {
	it('gives every marker a river the map has, or none', () => {
		for (const p of Object.values(PLACES))
			if (p.river) expect(Object.keys(meta.rivers)).toContain(p.river);
	});

	it('puts every marker on the map', () => {
		for (const m of Object.values(MARKERS)) {
			expect(m.x).toBeGreaterThanOrEqual(0);
			expect(m.x).toBeLessThanOrEqual(meta.w);
			expect(m.y).toBeGreaterThanOrEqual(0);
			expect(m.y).toBeLessThanOrEqual(meta.h);
		}
	});
});

describe('project', () => {
	const proj = { west: 100, east: 110, north: 20, south: 10, w: 1000, h: 1000 };

	it('maps the corners to the corners, north up', () => {
		expect(project({ lon: 100, lat: 20 }, proj)).toEqual({ x: 0, y: 0 });
		expect(project({ lon: 110, lat: 10 }, proj)).toEqual({ x: 1000, y: 1000 });
		expect(project({ lon: 105, lat: 12 }, proj)).toEqual({ x: 500, y: 800 });
	});

	it('round-trips through unproject, to a tenth of a degree', () => {
		expect(unproject(project({ lon: 103.8, lat: 1.4 }, proj), proj)).toEqual({
			lon: 103.8,
			lat: 1.4
		});
	});
});

describe('spread', () => {
	const gap = (a: { left: number; top: number }, b: { left: number; top: number }) =>
		Math.hypot(a.left - b.left, a.top - b.top);

	it('pushes markers that would overlap apart, about their middle', () => {
		const [a, b] = spread(
			[
				{ left: 100, top: 100 },
				{ left: 110, top: 100 }
			],
			30
		);
		expect(gap(a, b)).toBeGreaterThanOrEqual(29.9);
		expect((a.left + b.left) / 2).toBeCloseTo(105);
	});

	it('separates markers on the very same spot', () => {
		const [a, b] = spread(
			[
				{ left: 50, top: 50 },
				{ left: 50, top: 50 }
			],
			30
		);
		expect(gap(a, b)).toBeGreaterThanOrEqual(29.9);
	});

	it('leaves markers that are far enough apart where they are', () => {
		const ps = [
			{ left: 0, top: 0 },
			{ left: 100, top: 0 }
		];
		expect(spread(ps, 30)).toEqual(ps);
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

	it('is never narrower than the screen, so no strip of flat sea shows at the side', () => {
		// The box fits at scale 0.5, but the map is only 1000 units wide: it needs 1.2 to fill 1200 px.
		const f = frame(
			{ w: 1200, h: 600 },
			{ x: 0, y: 0, w: 100, h: 50 },
			{ x: 0, y: 0, w: 200, h: 100 }
		);
		expect(f.scale * MAP.w).toBeGreaterThanOrEqual(1200);
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
