/** Keys a number box would otherwise accept that can't appear in a whole number. */
const NON_INTEGER_KEYS = new Set([".", ",", "e", "E"]);

/** Keydown handler for boxes that only take whole numbers. */
export function blockNonIntegerKeys(e: KeyboardEvent) {
  if (NON_INTEGER_KEYS.has(e.key)) e.preventDefault();
}
