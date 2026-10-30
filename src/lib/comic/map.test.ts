import { describe, expect, it } from 'vitest';
import { EDITION, type Edition } from './edition';
import {
	bounds,
	FRAMED,
	pathPoints,
	RIVERS,
	frame,
	layout,
	MAP,
	MARKERS,
	STOPS,
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

describe('STOPS', () => {
	it('puts every chapter in exactly one stop, in reading order', () => {
		expect(STOPS.flatMap((s) => s.chapters)).toEqual(EDITION.chapters.map((c) => c.first));
	});

	it('gives every stop a river the map has, or none', () => {
		for (const s of STOPS) if (s.river) expect(Object.keys(meta.rivers)).toContain(s.river);
	});

	it('puts every marker on the map', () => {
		for (const m of Object.values(MARKERS)) {
			expect(m.x).toBeGreaterThanOrEqual(0);
			expect(m.x).toBeLessThanOrEqual(meta.w);
			expect(m.y).toBeGreaterThanOrEqual(0);
			expect(m.y).toBeLessThanOrEqual(meta.h);
		}
	});

	it('starts the Prologue and Act One together, at the mouth of the Sunda River', () => {
		expect(STOPS[0]).toMatchObject({ chapters: [4, 6], river: 'north-sunda' });
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
	const stops = [
		{ chapters: [3, 4], name: 'Prologue & Act One', where: 'Here', river: null },
		{ chapters: [7], where: 'There', river: null }
	];

	it('gives one marker per stop, keyed by its first page, a combined stop named as one', () => {
		const at = { 3: { x: 300, y: 150 }, 7: { x: 10, y: 20 } };
		expect(onMap(edition, stops, at)).toEqual([
			{
				key: 3,
				title: 'Prologue & Act One',
				sub: '',
				where: 'Here',
				river: null,
				badge: 'P·I',
				x: 300,
				y: 150
			},
			{ key: 7, title: 'Epilogue', sub: '', where: 'There', river: null, badge: 'E', x: 10, y: 20 }
		]);
	});

	it('splits a single chapter’s title, and leaves out a stop without a marker', () => {
		const titled: Edition = { ...edition, chapters: [{ title: 'Act Two: Currents', first: 3 }] };
		const one = [{ chapters: [3], where: 'Muara', river: null }];
		expect(onMap(titled, one, { 3: { x: 1, y: 2 } })[0]).toMatchObject({
			title: 'Act Two: Currents',
			sub: 'Currents'
		});
		expect(onMap(titled, one, {})).toEqual([]);
	});
});

describe('bounds', () => {
	it('is the box around the markers, padded on every side', () => {
		const at = { 1: { x: 100, y: 50 }, 2: { x: 300, y: 150 }, 3: { x: 200, y: 90 } };
		expect(bounds(Object.values(at), 10)).toEqual({ x: 90, y: 40, w: 220, h: 120 });
	});
});

describe('pathPoints', () => {
	it('reads the points of a path in absolute units', () => {
		expect(pathPoints('M10 20l5-3 -2 4')).toEqual([
			{ x: 10, y: 20 },
			{ x: 15, y: 17 },
			{ x: 13, y: 21 }
		]);
		expect(pathPoints('')).toEqual([]);
	});

	it('frames the markers and all of every river, so a lit river is never off screen', () => {
		const box = bounds(FRAMED, 0);
		const kapuas = pathPoints(RIVERS['north-sunda'].land)[0];
		expect(kapuas.y).toBeLessThanOrEqual(box.y + box.h);
		expect(kapuas.x).toBeLessThanOrEqual(box.x + box.w);
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
