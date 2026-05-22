# Home Search Center Guide Emphasis Test Result

## Commands
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test`
- `pnpm typecheck`

## Results
- `pnpm --filter @sfood/web typecheck`: Passed.
- `pnpm --filter @sfood/web test`: Passed, 9 files / 31 tests.
- `pnpm typecheck`: Passed across `packages/wiki-core`, `apps/web`, and `packages/serverless`.
- Playwright viewport `1280x800`: after the support frame widening, search box remained `672px`, recommendation frame became `896px`, blueprint became `896px`, and support section side margin reduced to about `87px` inside the main surface.
- Playwright viewport `1280x800`: search box `672px`, guide card `768px`, guide list `672px`, blueprint `768px`.
- Playwright viewport `800x513`: search box `672px`, guide card `718px`, guide list `672px`, blueprint `718px`.
- Playwright viewport `1280x800`: recommended guide section rendered 5 cards total, with 1 featured starting card and 4 regular cards in a balanced 2x2 grid.
- Playwright viewport `1280x800`: featured card title rendered as `시작 가이드`, and the card grid width increased to `734px` inside the `768px` recommendation frame.
- Playwright viewport `390x844`: no horizontal overflow, document scroll width remained `390px`.

## Skipped Checks
- None.

## Acceptance Criteria Coverage
- The Home search hero has wider vertical breathing room and reads as the primary Home action.
- The search box is narrower than the supporting recommendation and blueprint frames on tablet and desktop widths.
- The recommended guide header uses a distinct band treatment.
- The recommendation header emphasis has been reduced after card-section conversion.
- The recommended guide section renders as cards instead of list rows.
- The regular guide card grid uses an even count.
- The recommended guide block has tighter vertical spacing around it.
- The pinned starting guide is visually stronger than the other guide rows.
- Each recommended guide card includes an icon.
- The recommendation and blueprint support sections have less visible desktop side whitespace while the search box remains unchanged.

## Retest Notes
- No failed validation required retesting.
