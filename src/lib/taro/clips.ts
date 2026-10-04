/**
 * Taro's animation clips and the rules for mixing them. Every clip is one 96-frame cycle of the
 * idle loop with one moment layered on, starting and ending on the same frame, so any clip can
 * follow any other when a loop ends. Rendered by art/taro/taro_clips.py.
 */

export const ACCENTS = ['ear-flick', 'tail-swish', 'look-up', 'paw-wash'] as const;
export const CLIPS = ['idle', ...ACCENTS] as const;
export type Clip = (typeof CLIPS)[number];

/** How often a loop of idle is followed by a moment rather than more idle. */
export const ACCENT_CHANCE = 0.4;

export interface MixState {
	current: Clip;
	lastAccent: Clip | null;
	queued?: Clip | null;
}

/**
 * The clip to play when the current one ends. `roll` is a random number in [0, 1); passing it
 * in keeps this pure. A moment is always followed by idle, and the same moment never plays
 * twice in a row.
 */
export function pickNext({ current, lastAccent, queued }: MixState, roll: number): Clip {
	if (queued) return queued;
	if (current !== 'idle' || roll >= ACCENT_CHANCE) return 'idle';
	const choices = ACCENTS.filter((a) => a !== lastAccent);
	// Reuse the roll: below ACCENT_CHANCE, spread it across the choices.
	return choices[Math.min(choices.length - 1, Math.floor((roll / ACCENT_CHANCE) * choices.length))];
}

/**
 * Which encoding to serve. WebKit (Safari, and every browser on iOS) plays HEVC with alpha but
 * not VP9 with alpha; Chrome and Firefox are the other way round, and Chrome would draw HEVC
 * alpha as a black box.
 */
export function videoFormat(userAgent: string): 'mp4' | 'webm' {
	if (/iP(hone|ad|od)/.test(userAgent)) return 'mp4';
	const safari =
		/Safari\//.test(userAgent) && !/Chrom(e|ium)|Edg\/|Firefox|Android/.test(userAgent);
	return safari ? 'mp4' : 'webm';
}
