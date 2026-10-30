/** How the landing page labels chapters: a short badge for the marker, and the title in two. */
import { EDITION } from './edition';

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/** "P" for the first chapter, "E" for the last, the act's numeral between. */
export function badge(i: number, count = EDITION.chapters.length): string {
	if (i === 0) return 'P';
	if (i === count - 1) return 'E';
	return NUMERALS[i - 1];
}

/** "Act Two: House of Taming Currents" → name "Act Two", sub "House of Taming Currents". */
export function split(title: string): { name: string; sub: string } {
	const at = title.indexOf(': ');
	return at < 0 ? { name: title, sub: '' } : { name: title.slice(0, at), sub: title.slice(at + 2) };
}
