// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {}
	/** Google Analytics, from the tag in app.html. */
	function gtag(...args: unknown[]): void;
}

export {};
