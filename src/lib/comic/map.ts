/**
 * The landing page's map: where each chapter's marker sits, and how the map is framed so the
 * markers fill whatever space the welcome panel leaves. Positions are in the map SVG's own units
 * (`static/map/sunda-landmass.svg`, 1000×596), so they hold at any screen size.
 */
import type { Edition } from './edition';

export type Point = { x: number; y: number };
export type Box = Point & { w: number; h: number };
/** Screen px = map units × scale + offset. */
export type Frame = { scale: number; x: number; y: number };

export const MAP = { w: 1000, h: 596 };

/** One marker per chapter, keyed by its first page. Sketch positions from the mockup until Yan
 * places them (`/?place` in dev). */
export const MARKERS: Record<number, Point> = {
	4: { x: 559, y: 319 },
	6: { x: 489, y: 259 },
	11: { x: 639, y: 378 },
	19: { x: 450, y: 394 },
	26: { x: 689, y: 250 },
	33: { x: 400, y: 311 },
	43: { x: 733, y: 439 }
};

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
	const scale = Math.min(free.w / box.w, free.h / box.h);
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
