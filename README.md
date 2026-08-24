# ApproveLens

[**Open the live app**](https://wedo911.github.io/approvelens/) · [Research](docs/RESEARCH.md) · [Specification](docs/SPEC.md)

ApproveLens checks whether an AI tool's approval view faithfully represents its raw payload. It runs entirely in the browser and helps expose data that a normal dialog can omit or render invisibly.

## What it detects

- Unicode TAG-block payloads, decoded into readable ASCII
- Bidirectional controls and terminal control characters
- Zero-width characters, unusual spaces, and variation selectors
- Primitive JSON values that are absent from the approval text
- A visible projection that labels suspicious characters
- A safe projection and downloadable machine-readable report

ApproveLens is a display-fidelity tool. A clean report does not prove that an action is safe, and the tool never authorizes an action.

## Privacy and security

There is no server-side component. The page makes no network requests after it loads, uses no analytics or storage, and processes pasted content only in the current browser tab. User-controlled content is rendered with DOM text nodes rather than HTML injection.

The site also sets a restrictive Content Security Policy and rejects inputs longer than one million characters. See [SECURITY.md](SECURITY.md) for the threat model and reporting process.

## Run locally

Any static web server works. For example:

```sh
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Test

Node.js 20 or later is required for the test suite. The application itself has no runtime dependencies.

```sh
npm test
npm run check
```

The deterministic analysis engine is in [`src/analyzer.js`](src/analyzer.js). Its JSON output uses the `approvelens.report.v1` schema.

## Why this exists

Research has demonstrated a fidelity gap between raw tool payloads and the text rendered for human approval, including invisible Unicode TAG-block content. Existing Unicode scanners are broad text utilities, while agent inspectors focus on protocol traffic. ApproveLens concentrates on the exact raw-payload-versus-approval-view comparison. The sources and product landscape are documented in [docs/RESEARCH.md](docs/RESEARCH.md).

## Contributing

Bug reports, test cases, accessibility improvements, and adapters for approval-log formats are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE)
