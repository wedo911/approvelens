# Security policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Threat model

ApproveLens treats both input fields as untrusted. Its main security boundaries are:

- no backend, telemetry, cookies, local storage, or outbound application requests;
- user-controlled strings enter the document only through `textContent`, `value`, or text-node APIs;
- a restrictive Content Security Policy blocks connections, plugins, frames, inline scripts, and inline styles;
- each input is limited to one million characters;
- report downloads happen only after an explicit user action;
- analysis is deterministic and does not execute payload content.

The project checks display fidelity only. It does not validate tool permissions, authenticate a caller, inspect network traffic, or decide whether an operation is safe.

## Report a vulnerability

Do not include sensitive payloads in a public issue. Use GitHub's private vulnerability reporting for this repository. Include the affected version, a minimal sanitized proof of concept, and the expected impact.
