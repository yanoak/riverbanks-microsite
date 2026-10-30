import { describe, expect, it } from 'vitest';
import { check, empty, encode, ENTRY, INTERESTS, QUESTION_IDS, UPDATES_OPTION } from './fields';

const all = (p: URLSearchParams, k: string) => p.getAll(k);

describe('ENTRY', () => {
	it('is the decimal of each question’s hex id, as the form’s fields are named', () => {
		expect(ENTRY.interests).toBe(1445834458);
		for (const [k, hex] of Object.entries(QUESTION_IDS))
			expect(ENTRY[k as keyof typeof ENTRY]).toBe(parseInt(hex, 16));
	});
});

describe('encode', () => {
	it('puts each ticked interest under the interests entry', () => {
		const p = encode({ ...empty(), interests: [INTERESTS[0], INTERESTS[4]] });
		expect(all(p, `entry.${ENTRY.interests}`)).toEqual([INTERESTS[0], INTERESTS[4]]);
	});

	it('sends Other as Google’s other option, with the text alongside, and nothing when empty', () => {
		const p = encode({ ...empty(), other: 'Make a game of it' });
		expect(all(p, `entry.${ENTRY.interests}`)).toEqual(['__other_option__']);
		expect(p.get(`entry.${ENTRY.interests}.other_option_response`)).toBe('Make a game of it');
		expect([...encode({ ...empty(), other: '  ' }).keys()]).toEqual([]);
	});

	it('leaves out empty answers, and the language unless Translate is ticked', () => {
		const p = encode({ ...empty(), name: ' Sam ', language: 'Thai', email: 'sam@example.org' });
		expect(p.get(`entry.${ENTRY.name}`)).toBe('Sam');
		expect(p.has(`entry.${ENTRY.language}`)).toBe(false);
		expect(p.has(`entry.${ENTRY.place}`)).toBe(false);
		const t = encode({ ...empty(), interests: [INTERESTS[0]], language: 'Thai' });
		expect(t.get(`entry.${ENTRY.language}`)).toBe('Thai');
	});

	it('sends the opt-in as its one option when ticked, and nothing when not', () => {
		expect(encode({ ...empty(), updates: true }).get(`entry.${ENTRY.updates}`)).toBe(
			UPDATES_OPTION
		);
		expect(encode(empty()).has(`entry.${ENTRY.updates}`)).toBe(false);
	});
});

describe('check', () => {
	it('needs an interest, or something else written, on step 1', () => {
		expect(check(1, empty())?.field).toBe('interests');
		expect(check(1, { ...empty(), interests: [INTERESTS[1]] })).toBeNull();
		expect(check(1, { ...empty(), other: 'A podcast' })).toBeNull();
	});

	it('asks nothing of step 2', () => {
		expect(check(2, empty())).toBeNull();
	});

	it('needs an email that looks like one on step 3', () => {
		expect(check(3, empty())?.field).toBe('email');
		expect(check(3, { ...empty(), email: 'not an email' })?.field).toBe('email');
		expect(check(3, { ...empty(), email: ' sam@example.org ' })).toBeNull();
	});
});
