# ApproveLens MVP specification

Status: accepted for implementation on 2026-08-25.

## Goal

Help a human determine whether an AI tool approval view omits or visually hides
material present in the raw payload.

## First vertical slice

Given raw JSON or text and approval-view text, the browser app must:

1. Parse JSON when possible and extract every primitive value with a JSON
   Pointer path.
2. Detect Unicode TAG characters, bidirectional controls, zero-width
   formatters, terminal controls, unusual spaces, and variation selectors.
3. Decode contiguous TAG-block payloads into readable ASCII.
4. Compare normalized raw primitive values with the approval view.
5. Assign a deterministic verdict and explain every finding.
6. Produce a safe projection and a downloadable JSON report.

## Locked decisions

- Static HTML, CSS, and JavaScript modules; no runtime dependencies.
- All processing stays in the browser. No analytics, storage, cookies, or
  network requests.
- User-controlled text enters the DOM only through `textContent` or form
  values, never `innerHTML`.
- Maximum one million characters per input.
- MIT license and GitHub Pages hosting.
- English interface for the first version; the analysis handles all Unicode.

## Verdicts

- `hidden-payload`: TAG-block content or dangerous display controls exist.
- `review-gap`: material raw values are absent from the approval view.
- `caution`: suspicious invisible formatting exists without a decoded payload.
- `faithful`: no suspicious characters were found and all material values are
  represented.

Verdicts describe display fidelity only. They do not authorize an action.

## Accessibility acceptance

- Complete keyboard operation with native controls.
- Visible focus and minimum 24-by-24 CSS-pixel targets.
- Results announced through a polite live region and focused summary heading.
- No color-only status; every severity has text.
- Reflow at 400% zoom and a single-column narrow layout.
- Tables include captions and remain horizontally scrollable.

