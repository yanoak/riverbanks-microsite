/**
 * The landing page's map: where each chapter happens, the river it happens on, and how the map is
 * framed so the markers fill whatever space the welcome panel leaves. Places are longitude and
 * latitude; on screen they are in the map SVG's own units (`static/map/sea.svg`, drawn with its
 * rivers by `scripts/landing-map.py`, which also writes `map.json`).
 */
import { badge, split } from './chapters';
import type { Edition } from './edition';
import meta from './map.json';

export type Point = { x: number; y: number };
export type Box = Point & { w: number; h: number };
/** Screen px = map units × scale + offset. */
export type Frame = { scale: number; x: number; y: number };

export type LonLat = { lon: number; lat: number };
export type Projection = {
	west: number;
	east: number;
	north: number;
	south: number;
	w: number;
	h: number;
};
export type River = keyof typeof meta.rivers;

export const MAP = { w: meta.w, h: meta.h };
export const RIVERS = meta.rivers;

export type Stop = LonLat & {
	/** The chapters told here, by first page, in reading order. */
	chapters: number[];
	/** A name for a stop of more than one chapter; one chapter goes by its own title. */
	name?: string;
	where: string;
	river: River | null;
};

/** The map's stops: where the chapters happen, and the river each happens on, at Southeast Asia
 * scale. The Prologue and Act One share one, at the mouth of the North Sunda River (the end of
 * its trace in `map.json`), north-east of Natuna. */
export const STOPS: Stop[] = [
	{
		chapters: [4, 6],
		name: 'Prologue & Act One',
		where: 'The mouth of the Sunda River',
		lon: 109.5,
		lat: 4.96,
		river: 'north-sunda'
	},
	{ chapters: [11], where: 'Muara, on the Muar', lon: 102.57, lat: 2.05, river: 'muar' },
	{
		chapters: [19],
		where: 'Myitsone, on the Ayeyarwady',
		lon: 97.65,
		lat: 25.7,
		river: 'ayeyarwady'
	},
	{
		chapters: [26],
		where: 'The Chao Phraya to Chiang Mai',
		lon: 98.98,
		lat: 18.79,
		river: 'chao-phraya'
	},
	{ chapters: [33], where: 'A village on the Meghna', lon: 90.65, lat: 23.23, river: 'meghna' },
	{ chapters: [43], where: 'Svalbard, then Muara', lon: 102.57, lat: 2.05, river: 'muar' }
];

/** Longitude and latitude to map units: equirectangular, as the map is drawn. */
export function project({ lon, lat }: LonLat, p: Projection = meta): Point {
	return {
		x: ((lon - p.west) / (p.east - p.west)) * p.w,
		y: ((p.north - lat) / (p.north - p.south)) * p.h
	};
}

/** Map units back to longitude and latitude, to a tenth of a degree (placement mode's copy). */
export function unproject({ x, y }: Point, p: Projection = meta): LonLat {
	const tenth = (n: number) => Math.round(n * 10) / 10;
	return {
		lon: tenth(p.west + (x / p.w) * (p.east - p.west)),
		lat: tenth(p.north - (y / p.h) * (p.north - p.south))
	};
}

/** Each stop's marker in map units, keyed by the stop's first page. */
export const MARKERS: Record<number, Point> = Object.fromEntries(
	STOPS.map((s) => [s.chapters[0], project(s)])
);

/**
 * Push apart markers closer than `min` px (Act Two and the Epilogue share Muara), each pair about
 * its middle, a few rounds. Markers far enough apart don't move.
 */
export function spread<T extends { left: number; top: number }>(points: T[], min: number): T[] {
	const ps = points.map((p) => ({ ...p }));
	for (let round = 0; round < 12; round++) {
		let moved = false;
		for (let i = 0; i < ps.length; i++)
			for (let j = i + 1; j < ps.length; j++) {
				const dx = ps[j].left - ps[i].left;
				const dy = ps[j].top - ps[i].top;
				const d = Math.hypot(dx, dy);
				if (d >= min - 0.01) continue;
				// On the very same spot, part them along a direction set by their order.
				const a = d > 0 ? Math.atan2(dy, dx) : (j * 2 * Math.PI) / 3;
				const push = (min - d) / 2;
				ps[i].left -= Math.cos(a) * push;
				ps[i].top -= Math.sin(a) * push;
				ps[j].left += Math.cos(a) * push;
				ps[j].top += Math.sin(a) * push;
				moved = true;
			}
		if (!moved) break;
	}
	return ps;
}

/** The stops with a marker, in reading order, so Tab follows the book: each keyed by its first
 * page, with its title, the badge its dot shows ("P·I" for the Prologue and Act One), and where. */
export function onMap(
	edition: Edition,
	stops: Omit<Stop, 'lon' | 'lat'>[],
	markers: Record<number, Point>
): {
	key: number;
	title: string;
	sub: string;
	where: string;
	river: River | null;
	badge: string;
	x: number;
	y: number;
}[] {
	const index = (first: number) => edition.chapters.findIndex((c) => c.first === first);
	return stops.flatMap((s) => {
		const key = s.chapters[0];
		if (!markers[key]) return [];
		const titles = s.chapters.map((f) => edition.chapters[index(f)].title);
		return [
			{
				key,
				title: s.name ?? titles[0],
				sub: titles
					.map((t) => split(t).sub)
					.filter(Boolean)
					.join(' / '),
				where: s.where,
				river: s.river,
				badge: s.chapters.map((f) => badge(index(f), edition.chapters.length)).join('·'),
				...markers[key]
			}
		];
	});
}

/** The box around some points, padded on every side, in map units. */
export function bounds(ps: Point[], pad: number): Box {
	const x = Math.min(...ps.map((p) => p.x)) - pad;
	const y = Math.min(...ps.map((p) => p.y)) - pad;
	return {
		x,
		y,
		w: Math.max(...ps.map((p) => p.x)) + pad - x,
		h: Math.max(...ps.map((p) => p.y)) + pad - y
	};
}

/** The points of a path as `landing-map.py` writes it (one M, then relative l steps). */
export function pathPoints(d: string): Point[] {
	const n = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
	const ps: Point[] = [];
	for (let i = 0; i + 1 < n.length; i += 2) {
		const prev = ps.at(-1);
		ps.push(prev ? { x: prev.x + n[i], y: prev.y + n[i + 1] } : { x: n[i], y: n[i + 1] });
	}
	return ps;
}

/** What the map frames: every marker and every point of every river, so the lit one shows. */
export const FRAMED: Point[] = [
	...Object.values(MARKERS),
	...Object.values(RIVERS).flatMap((r) => [...pathPoints(r.land), ...pathPoints(r.drowned)])
];

/**
 * Scale and place the map so `box` (map units) fits, centred, in `free` (screen px): the screen
 * less the header and the panel. Where the map is bigger than the screen, its edges are pulled
 * back to the screen's so no gap shows; the markers may then sit off-centre, never off the land.
 */
export function frame(view: { w: number; h: number }, free: Box, box: Box): Frame {
	// Never narrower than the screen: a strip of flat sea at the side looks like a mistake.
	const scale = Math.max(Math.min(free.w / box.w, free.h / box.h), view.w / MAP.w);
	const fit = (offset: number, map: number, screen: number) =>
		map >= screen ? Math.min(0, Math.max(screen - map, offset)) : offset;
	return {
		scale,
		x: fit(free.x + (free.w - box.w * scale) / 2 - box.x * scale, MAP.w * scale, view.w),
		y: fit(free.y + (free.h - box.h * scale) / 2 - box.y * scale, MAP.h * scale, view.h)
	};
}

export function toScreen(p: Point, f: Frame): { left: number; top: number } {
	return { left: p.x * f.scale + f.x, top: p.y * f.scale + f.y };
}

/** The welcome panel at the side on a wide landscape screen, at the bottom otherwise. */
export function layout(w: number, h: number): 'side' | 'bottom' {
	return w >= 900 && w > h ? 'side' : 'bottom';
}
