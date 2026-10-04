import { describe, expect, it } from 'vitest';
import { ACCENTS, pickNext, videoFormat } from './clips';

describe('pickNext', () => {
	it('always returns to idle after an accent', () => {
		for (const accent of ACCENTS) {
			expect(pickNext({ current: accent, lastAccent: accent }, 0)).toBe('idle');
		}
	});

	it('stays on idle when the roll is above the accent chance', () => {
		expect(pickNext({ current: 'idle', lastAccent: null }, 0.99)).toBe('idle');
	});

	it('plays an accent when the roll is below the accent chance, never the last one', () => {
		for (let i = 0; i < 20; i++) {
			const roll = (i / 20) * 0.39;
			const next = pickNext({ current: 'idle', lastAccent: 'tail-swish' }, roll);
			expect(ACCENTS).toContain(next);
			expect(next).not.toBe('tail-swish');
		}
	});

	it('plays a queued clip whatever the roll', () => {
		expect(pickNext({ current: 'idle', lastAccent: null, queued: 'look-up' }, 0.99)).toBe(
			'look-up'
		);
		expect(
			pickNext({ current: 'ear-flick', lastAccent: 'ear-flick', queued: 'ear-flick' }, 0)
		).toBe('ear-flick');
	});
});

describe('videoFormat', () => {
	const mp4 = {
		'Safari on macOS':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
		'Safari on iPhone':
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
		'Chrome on iPhone':
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/129.0.6668.69 Mobile/15E148 Safari/604.1',
		'Safari on iPad (desktop mode)':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15'
	};
	const webm = {
		'Chrome on macOS':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
		'Edge on Windows':
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
		'Firefox on macOS':
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
		'Chrome on Android':
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36'
	};

	for (const [name, ua] of Object.entries(mp4)) {
		it(`gives ${name} the HEVC mp4`, () => expect(videoFormat(ua)).toBe('mp4'));
	}
	for (const [name, ua] of Object.entries(webm)) {
		it(`gives ${name} the VP9 webm`, () => expect(videoFormat(ua)).toBe('webm'));
	}
});
