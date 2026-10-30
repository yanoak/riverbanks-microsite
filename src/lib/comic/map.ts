/**
 * The landing page's map: where each chapter's marker sits, and the part of the map the hero
 * shows. Positions are in the map SVG's own units (`static/map/sunda-landmass.svg`, 1000×596),
 * so they hold whatever the crop or the screen.
 */
import type { Edition } from './edition';

export type Point = { x: number; y: number };
export type Crop = Point & { w: number; h: number };

/** The middle of the landmass, as in the mockup's iPad board (820×640 there). */
export const CROP: Crop = { x: 344, y: 144, w: 456, h: 356 };

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

/** A point as percentages across and down the crop, or null when the crop doesn't show it. */
export function place(p: Point, crop: Crop): { left: number; top: number } | null {
	const left = ((p.x - crop.x) / crop.w) * 100;
	const top = ((p.y - crop.y) / crop.h) * 100;
	return left < 0 || left > 100 || top < 0 || top > 100 ? null : { left, top };
}

/** The chapters with a marker on the map, in reading order, so Tab follows the book. */
export function onMap(
	edition: Edition,
	markers: Record<number, Point>,
	crop: Crop
): { title: string; first: number; left: number; top: number }[] {
	return edition.chapters.flatMap(({ title, first }) => {
		const at = markers[first] && place(markers[first], crop);
		return at ? [{ title, first, ...at }] : [];
	});
}
