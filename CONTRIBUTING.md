# Contributing

Thank you for helping improve ApproveLens.

1. Open an issue that describes the display-fidelity problem or proposed behavior.
2. Keep the analyzer deterministic and free of runtime dependencies.
3. Add a test for each detection or comparison change.
4. Run `npm test` and `npm run check`.
5. Do not commit real secrets, private tool payloads, or personal data.

Changes to verdict rules must update `docs/SPEC.md`. Interface changes must remain keyboard-operable, preserve visible focus, and work at narrow widths and 400% zoom.
