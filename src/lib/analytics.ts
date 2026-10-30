/**
 * Events for Google Analytics (the tag is in app.html). Page views come from GA itself; these are
 * the things a page view can't see: turning pages in the reader, finishing the book, sharing.
 */

/** Send an event, if the tag is there (it isn't in tests, or where a blocker removed it). */
export function track(event: string, params: Record<string, string | number> = {}): void {
	if (typeof window !== 'undefined' && typeof window.gtag === 'function')
		window.gtag('event', event, params);
}
