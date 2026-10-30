import { describe, expect, it } from 'vitest';
import { EDITION } from './edition';
import { badge, split } from './chapters';

describe('badge', () => {
	it('is P for the Prologue, the act numeral, then E for the Epilogue', () => {
		expect(EDITION.chapters.map((_, i) => badge(i))).toEqual([
			'P',
			'I',
			'II',
			'III',
			'IV',
			'V',
			'E'
		]);
	});
});

describe('split', () => {
	it('splits a chapter title at its colon', () => {
		expect(split('Act Two: House of Taming Currents')).toEqual({
			name: 'Act Two',
			sub: 'House of Taming Currents'
		});
	});

	it('keeps a title without a colon whole', () => {
		expect(split('Interlude')).toEqual({ name: 'Interlude', sub: '' });
	});
});
