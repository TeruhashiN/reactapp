# TODO

## Implement “score should change only (replace high score), not add”

- [ ] Inspect `src/components/QuizMode.tsx` logic for updating best score and backend score.
- [ ] Identify where level score is computed and where `localStorage` best score per level is updated.
- [ ] Change logic so that level “best”/display score replaces with the new high score instead of accumulating (prevents 13 -> 34 -> 47).
- [ ] Ensure update happens only when the current attempt exceeds the previous high score by a meaningful threshold ("change score if the current score has been change to much more high score").
- [ ] Update any related UI text (level score / best score) to reflect corrected behavior.
- [ ] Run TypeScript build / quick sanity check.
