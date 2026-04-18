# Catalst v8 — Reference Material

These files are **CANDIDATES FOR MERGE**, not drop-in replacements.

## Files

### `industries-CANDIDATES.ts`
- 150 industry entries organized into 11 tabs (Play, Build, Money, Health, Learn, Work, Move, Earth, Life, Frontier, Bharat).
- Parent → child industry taxonomy.
- Full TypeScript types.

### `ideas-PART1-CANDIDATES.ts`
- ~80 startup ideas in Play + Build sections only (file was incomplete).
- Real-world analogs, essence weights, motive, house assignments.
- NOT comprehensive — use as source material, not a finished set.

## Merge instructions for Claude Code

See the main prompt for the full procedure. Summary:

1. **Read** `content/industries.ts` and `content/ideas.ts` from the repo first.
2. **Enumerate** existing ids, titles, and domain slugs.
3. **Diff** against these candidate files — for every candidate, check:
   - Is the id already taken? → rename with suffix or skip.
   - Is the title already taken? → skip (even if id differs).
   - Does the domain slug exist in `industries.ts`? → if not, either add the industry from candidates OR skip the idea.
   - Do the essence keys match the repo's existing type? → find-replace to canonical names.
4. **Preserve** all existing ideas unchanged unless explicitly requested.
5. **Produce a diff report** before writing: N new industries added, M new ideas added, K candidates skipped (with reasons).
6. **Only then write** the final merged `industries.ts` and `ideas.ts`.

## Do not

- Overwrite the existing files without reading them.
- Trust the type names in these candidate files — match whatever the repo uses.
- Assume domain slugs match — the repo's ids win.
- Ship without running `npm run build` and the matching algo sanity check.
