import { describe, expect, it } from 'vitest';
import { ACTS, actsLabel, CAST, castUrl } from './cast';

describe('CAST', () => {
	it('gives everyone a unique id that is safe in a link', () => {
		const ids = CAST.map((c) => c.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]*$/);
	});

	it('gives everyone one sentence, short enough for a card', () => {
		for (const c of CAST) {
			expect(c.line, c.name).toMatch(/[.!]$/);
			expect(c.line.split(/\s+/).length, c.name).toBeLessThan(30);
			expect(c.line.slice(0, -1), c.name).not.toMatch(/[.!?] [A-Z]/);
		}
	});

	it('names each portrait after its id and describes it', () => {
		for (const c of CAST) {
			expect(c.portrait).toBe(`/cast/${c.id}.webp`);
			expect(c.alt.length, c.name).toBeGreaterThan(10);
		}
	});

	it('lists the acts in book order, and the cast in order of first appearance', () => {
		for (const c of CAST) {
			const at = c.acts.map((a) => ACTS.indexOf(a));
			expect(at, c.name).toEqual([...at].sort((a, b) => a - b));
		}
		const first = CAST.map((c) => ACTS.indexOf(c.acts[0]));
		expect(first).toEqual([...first].sort((a, b) => a - b));
	});
});

describe('castUrl', () => {
	it('links to a character, or to the page', () => {
		expect(castUrl('https://riverbanks.lol', 'taro')).toBe('https://riverbanks.lol/cast#taro');
		expect(castUrl('https://riverbanks.lol')).toBe('https://riverbanks.lol/cast');
	});
});

describe('actsLabel', () => {
	it('runs acts together, and keeps the Prologue and Epilogue apart', () => {
		expect(actsLabel(['Act One', 'Act Two', 'Act Three', 'Act Four', 'Epilogue'])).toBe(
			'Acts One–Four · Epilogue'
		);
		expect(actsLabel(['Act Four', 'Act Five', 'Epilogue'])).toBe('Acts Four & Five · Epilogue');
		expect(actsLabel(['Prologue', 'Act Three'])).toBe('Prologue · Act Three');
		expect(actsLabel(['Act Two'])).toBe('Act Two');
	});
});
