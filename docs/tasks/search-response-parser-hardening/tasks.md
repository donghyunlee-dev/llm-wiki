# search-response-parser-hardening Tasks

## Implementation Tasks
- [x] Identify the failing parser pattern.
- [x] Extract parsing into a dedicated helper.
- [x] Add labeled-fragment recovery for malformed mixed-format output.
- [x] Wire the new helper into the dev search API.

## Test Tasks
- [x] Add parser unit coverage for labeled schema leakage.
- [x] Run targeted web tests.
- [x] Run workspace typecheck.
- [x] Revalidate with the reproduced local Claude CLI query.

## Documentation Tasks
- [x] Record the parser-hardening task.
- [x] Record the validation result and remaining gap.

## Progress Notes
- Parser hardening fixed the degraded empty-field fallback path.
- The one-line setup answer can still occur independently after parsing succeeds.

## Review Notes
- The remaining issue after this task is generation quality, not parsing.
