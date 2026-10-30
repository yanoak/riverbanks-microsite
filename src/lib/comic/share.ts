/**
 * What sharing a page sends: its canonical URL, the words a share sheet and a chat's link card
 * show, and the card image. The cards are made by `scripts/comic-pages.sh`, one per page.
 */
import { chapterAt, pageSrc, type Edition } from './edition';

export function pageUrl(origin: string, page: number): string {
	return `${origin}/p/${page}`;
}

/** The title and text for the share sheet and for `og:title` / `og:description`. */
export function shareFor(edition: Edition, page: number): { title: string; text: string } {
	return {
		title: `Riverbanks · ${chapterAt(edition, page).title}`,
		text: `Page ${page} of Riverbanks Volume I, a climate fiction comic by Seapunk Studios. Read it free online.`
	};
}

/** The Open Graph tags for `/p/N`. Chats need the URLs absolute. */
export function meta(edition: Edition, origin: string, page: number, version: string) {
	return {
		...shareFor(edition, page),
		url: pageUrl(origin, page),
		image: origin + pageSrc(page, 'card', version),
		width: 1200,
		height: 630,
		alt: `Page ${page} of Riverbanks, ${chapterAt(edition, page).title}`
	};
}

export function saveName(page: number): string {
	return `riverbanks-p${page}.jpg`;
}

/** The share sheet where the browser has one; otherwise the Copy link / Save page menu. */
export function shareMode(nav: Partial<Pick<Navigator, 'share'>>): 'native' | 'menu' {
	return typeof nav.share === 'function' ? 'native' : 'menu';
}
