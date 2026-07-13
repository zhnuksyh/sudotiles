import { DIFFICULTIES, DEFAULT_DIFFICULTY } from "./constants";
import { solve } from "./sudoku";
import type { Puzzle } from "./freshState";

/* Puzzle sharing via URL. A shared link looks like:
 *   https://host/path?p=<81 digits, 0 = blank>&d=<difficulty label>
 * No server involved — the givens travel in the link and the solution is
 * recomputed (and uniqueness-checked) on load. */

export interface SharedPuzzle {
  puzzle: Puzzle;
  difficulty: string;
}

/* Build a share link from an 81-char givens string ('.' or '0' for blanks). */
export function shareUrlFor(givens: string, difficulty: string): string {
  const p = givens.replace(/\./g, "0");
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("p", p);
  url.searchParams.set("d", difficulty);
  return url.toString();
}

/* Read a shared puzzle from the current URL, if present and valid. The `p`
 * param must be 81 digits describing a uniquely solvable board; anything else
 * is ignored. When a valid puzzle is found the query string is removed from
 * the address bar so refresh/new-puzzle behave normally afterwards. */
export function readSharedPuzzle(): SharedPuzzle | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const p = params.get("p");
  if (!p || !/^[0-9]{81}$/.test(p)) return null;

  const givens = p.replace(/0/g, ".");
  let solution: string | false;
  let reverse: string | false;
  try {
    solution = solve(givens);
    reverse = solve(givens, true);
  } catch {
    return null;
  }
  // Reject unsolvable boards and boards with more than one solution.
  if (!solution || solution !== reverse) return null;

  const d = params.get("d");
  const difficulty = DIFFICULTIES.some((x) => x.label === d) ? (d as string) : DEFAULT_DIFFICULTY;

  const clean = new URL(window.location.href);
  clean.search = "";
  window.history.replaceState(null, "", clean.toString());

  return { puzzle: { givens, solution }, difficulty };
}

/* Share a link: native share sheet on devices that have one, otherwise copy
 * to the clipboard. Resolves to how the link was delivered. */
export async function deliverShareUrl(url: string): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "Sudotiles puzzle", url });
      return "shared";
    } catch (err) {
      // User dismissed the sheet — treat as done, not an error.
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
