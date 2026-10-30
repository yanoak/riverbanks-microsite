/**
 * The landing page's map: where each chapter happens, the river it happens on, and how the map is
 * framed so the markers fill whatever space the welcome panel leaves. Places are longitude and
 * latitude; on screen they are in the map SVG's own units (`static/map/sea.svg`, drawn with its
 * rivers by `scripts/landing-map.py`, which also writes `map.json`).
 */
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

/** Where each chapter happens, keyed by its first page, and its river (Southeast Asia scale). */
export const PLACES: Record<number, LonLat & { where: string; river: River | null }> = {
	4: { lon: 103.8, lat: 1.45, where: 'Johor Straits', river: 'johor' },
	6: { lon: 108.2, lat: 3.95, where: 'Natuna Island, the Sunda Summit', river: 'north-sunda' },
	11: { lon: 102.57, lat: 2.05, where: 'Muara, on the Muar', river: 'muar' },
	19: { lon: 97.65, lat: 25.7, where: 'Myitsone, on the Ayeyarwady', river: 'ayeyarwady' },
	26: { lon: 98.98, lat: 18.79, where: 'The Chao Phraya to Chiang Mai', river: 'chao-phraya' },
	33: { lon: 90.65, lat: 23.23, where: 'A village on the Meghna', river: 'meghna' },
	43: { lon: 102.57, lat: 2.05, where: 'Svalbard, then Muara', river: 'muar' }
};

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

export const MARKERS: Record<number, Point> = Object.fromEntries(
	Object.entries(PLACES).map(([first, place]) => [first, project(place)])
);

/**
 * Push apart markers closer than `min` px (Act Two and the Epilogue share Muara, and the Prologue
 * is next door), each pair about its middle, a few rounds. Markers far enough apart don't move.
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

/** The chapters with a marker, in reading order, so Tab follows the book. */
export function onMap(
	edition: Edition,
	markers: Record<number, Point>
): { title: string; first: number; x: number; y: number }[] {
	return edition.chapters.flatMap(({ title, first }) =>
		markers[first] ? [{ title, first, ...markers[first] }] : []
	);
}

/** The box around the markers, padded on every side, in map units. */
export function bounds(markers: Record<number, Point>, pad: number): Box {
	const ps = Object.values(markers);
	const x = Math.min(...ps.map((p) => p.x)) - pad;
	const y = Math.min(...ps.map((p) => p.y)) - pad;
	return {
		x,
		y,
		w: Math.max(...ps.map((p) => p.x)) + pad - x,
		h: Math.max(...ps.map((p) => p.y)) + pad - y
	};
}

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
