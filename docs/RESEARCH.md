# ApproveLens research note

Research date: 2026-08-25

## Problem

Human approval is only useful when the approval view faithfully represents the
bytes an AI agent or tool receives. A July 2026 preprint reports an
approval-view fidelity gap in Model Context Protocol tooling: Unicode TAG-block
characters can carry content that has no visible glyph in mainstream approval
surfaces while remaining present in the model-facing text.

The broader risk is recognized in current security guidance. Unicode security
documents warn that invisible and bidirectional controls can change how text is
displayed, while recent MCP security guidance names hidden instructions and
tool-metadata manipulation as relevant threats.

## Landscape search

The scoped search found:

- General hidden-Unicode scanners and cleaners.
- MCP inspectors that expose raw JSON and rendered app views separately.
- Approval gates and policy middleware.
- Middleware that blocks hidden Unicode.

It did not find a small browser tool focused on comparing a raw tool payload
with the exact text shown to a human approver, decoding TAG-block sequences,
and producing a deterministic fidelity report. This is evidence for a useful
MVP, not proof that no similar tool exists.

## Product decision

ApproveLens is a local-only static site. A reviewer pastes:

1. The raw JSON or text sent by a tool or agent.
2. The text shown in the approval dialog.

The app extracts primitive JSON values, scans both surfaces for presentation
controls, decodes Unicode TAG payloads, measures which raw values are absent
from the approval text, and produces a review report. It does not connect to an
MCP server and does not claim that a faithful display makes an action safe.

## Sources

- Rashidi, *Unicode TAG-Block Concealment of Tool-Metadata Payloads in the
  Model Context Protocol* (2026): https://arxiv.org/abs/2607.05744
- Unicode Technical Standard #39, *Unicode Security Mechanisms*:
  https://www.unicode.org/reports/tr39/
- Unicode Technical Report #36, *Unicode Security Considerations*:
  https://www.unicode.org/reports/tr36/
- NSA, *Cybersecurity Information: Model Context Protocol Security* (2026):
  https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/4437390/
- Model Context Protocol Inspector:
  https://github.com/modelcontextprotocol/inspector

