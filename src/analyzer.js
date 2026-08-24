const MAX_INPUT_LENGTH = 1_000_000;

const BIDI = new Map([
  [0x061c, "ARABIC LETTER MARK"],
  [0x200e, "LEFT-TO-RIGHT MARK"],
  [0x200f, "RIGHT-TO-LEFT MARK"],
  [0x202a, "LEFT-TO-RIGHT EMBEDDING"],
  [0x202b, "RIGHT-TO-LEFT EMBEDDING"],
  [0x202c, "POP DIRECTIONAL FORMATTING"],
  [0x202d, "LEFT-TO-RIGHT OVERRIDE"],
  [0x202e, "RIGHT-TO-LEFT OVERRIDE"],
  [0x2066, "LEFT-TO-RIGHT ISOLATE"],
  [0x2067, "RIGHT-TO-LEFT ISOLATE"],
  [0x2068, "FIRST STRONG ISOLATE"],
  [0x2069, "POP DIRECTIONAL ISOLATE"],
]);

const ZERO_WIDTH = new Map([
  [0x00ad, "SOFT HYPHEN"],
  [0x034f, "COMBINING GRAPHEME JOINER"],
  [0x180e, "MONGOLIAN VOWEL SEPARATOR"],
  [0x200b, "ZERO WIDTH SPACE"],
  [0x200c, "ZERO WIDTH NON-JOINER"],
  [0x200d, "ZERO WIDTH JOINER"],
  [0x2060, "WORD JOINER"],
  [0x2061, "FUNCTION APPLICATION"],
  [0x2062, "INVISIBLE TIMES"],
  [0x2063, "INVISIBLE SEPARATOR"],
  [0x2064, "INVISIBLE PLUS"],
  [0xfeff, "ZERO WIDTH NO-BREAK SPACE"],
]);

const UNUSUAL_SPACES = new Map([
  [0x00a0, "NO-BREAK SPACE"],
  [0x1680, "OGHAM SPACE MARK"],
  [0x2000, "EN QUAD"],
  [0x2001, "EM QUAD"],
  [0x2002, "EN SPACE"],
  [0x2003, "EM SPACE"],
  [0x2004, "THREE-PER-EM SPACE"],
  [0x2005, "FOUR-PER-EM SPACE"],
  [0x2006, "SIX-PER-EM SPACE"],
  [0x2007, "FIGURE SPACE"],
  [0x2008, "PUNCTUATION SPACE"],
  [0x2009, "THIN SPACE"],
  [0x200a, "HAIR SPACE"],
  [0x202f, "NARROW NO-BREAK SPACE"],
  [0x205f, "MEDIUM MATHEMATICAL SPACE"],
  [0x3000, "IDEOGRAPHIC SPACE"],
]);

function codeLabel(codePoint) {
  return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
}

function classify(codePoint) {
  if (codePoint >= 0xe0000 && codePoint <= 0xe007f) {
    const name = codePoint === 0xe007f
      ? "CANCEL TAG"
      : codePoint >= 0xe0020 && codePoint <= 0xe007e
        ? `TAG ${String.fromCodePoint(codePoint - 0xe0000)}`
        : "TAG CONTROL";
    return { category: "tag", severity: "critical", name };
  }
  if (BIDI.has(codePoint)) {
    return { category: "bidi", severity: "critical", name: BIDI.get(codePoint) };
  }
  if (ZERO_WIDTH.has(codePoint)) {
    return { category: "zero-width", severity: "warning", name: ZERO_WIDTH.get(codePoint) };
  }
  if (UNUSUAL_SPACES.has(codePoint)) {
    return { category: "unusual-space", severity: "notice", name: UNUSUAL_SPACES.get(codePoint) };
  }
  if ((codePoint < 0x20 && ![0x09, 0x0a, 0x0d].includes(codePoint)) ||
      (codePoint >= 0x7f && codePoint <= 0x9f)) {
    return { category: "control", severity: "critical", name: "CONTROL CHARACTER" };
  }
  if ((codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
      (codePoint >= 0xe0100 && codePoint <= 0xe01ef)) {
    return { category: "variation-selector", severity: "notice", name: "VARIATION SELECTOR" };
  }
  return null;
}

export function scanText(text, surface = "raw") {
  if (text.length > MAX_INPUT_LENGTH) {
    throw new RangeError(`${surface} input exceeds ${MAX_INPUT_LENGTH.toLocaleString("en-US")} characters`);
  }
  const findings = [];
  let offset = 0;
  let line = 1;
  let column = 1;
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    const match = classify(codePoint);
    if (match) {
      findings.push({
        surface,
        offset,
        line,
        column,
        codePoint: codeLabel(codePoint),
        character,
        ...match,
      });
    }
    offset += character.length;
    if (character === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  return findings;
}

export function decodeTagSequences(text) {
  const sequences = [];
  let decoded = "";
  let start = null;
  let offset = 0;

  const flush = (end) => {
    if (start !== null && decoded) {
      sequences.push({ start, end, decoded });
    }
    decoded = "";
    start = null;
  };

  for (const character of text) {
    const codePoint = character.codePointAt(0);
    if (codePoint >= 0xe0020 && codePoint <= 0xe007e) {
      if (start === null) start = offset;
      decoded += String.fromCodePoint(codePoint - 0xe0000);
    } else if (codePoint === 0xe007f) {
      flush(offset + character.length);
    } else {
      flush(offset);
    }
    offset += character.length;
  }
  flush(offset);
  return sequences;
}

function escapePointer(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function walkPrimitives(value, path, output) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPrimitives(item, `${path}/${index}`, output));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) =>
      walkPrimitives(item, `${path}/${escapePointer(key)}`, output));
  } else if (value !== null) {
    output.push({ path: path || "/", value: String(value), type: typeof value });
  }
}

export function extractPrimitiveValues(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    const values = [];
    walkPrimitives(parsed, "", values);
    return { inputType: "json", values };
  } catch {
    return {
      inputType: "text",
      values: rawText.trim() ? [{ path: "/", value: rawText, type: "string" }] : [],
    };
  }
}

function isRemovedForComparison(codePoint) {
  const match = classify(codePoint);
  return match && ["tag", "bidi", "zero-width", "control", "variation-selector"].includes(match.category);
}

export function safeProjection(text) {
  let output = "";
  for (const character of text) {
    if (!isRemovedForComparison(character.codePointAt(0))) output += character;
  }
  return output;
}

export function visibleProjection(text) {
  let output = "";
  for (const character of text) {
    const codePoint = character.codePointAt(0);
    const match = classify(codePoint);
    output += match
      ? `⟦${codeLabel(codePoint)} ${match.name}⟧`
      : character;
  }
  return output;
}

function normalizeForComparison(text) {
  return safeProjection(text)
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

export function compareApproval(rawText, approvalText) {
  const extracted = extractPrimitiveValues(rawText);
  const normalizedApproval = normalizeForComparison(approvalText);
  const coverage = extracted.values.map((item) => {
    const normalizedValue = normalizeForComparison(item.value);
    return {
      ...item,
      represented: normalizedValue.length === 0 || normalizedApproval.includes(normalizedValue),
    };
  });
  return {
    inputType: extracted.inputType,
    coverage,
    missing: coverage.filter((item) => !item.represented),
  };
}

function projectParsedStrings(value, projector) {
  if (Array.isArray(value)) {
    return value.map((item) => projectParsedStrings(item, projector));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, projectParsedStrings(item, projector)]),
    );
  }
  return typeof value === "string" ? projector(value) : value;
}

function projectRawInput(rawText, projector) {
  try {
    return JSON.stringify(projectParsedStrings(JSON.parse(rawText), projector), null, 2);
  } catch {
    return projector(rawText);
  }
}

export function analyze(rawText, approvalText) {
  const extracted = extractPrimitiveValues(rawText);
  const rawFindings = extracted.inputType === "json"
    ? extracted.values
      .filter((item) => item.type === "string")
      .flatMap((item) => scanText(item.value, "raw-value").map((finding) => ({ ...finding, path: item.path })))
    : scanText(rawText, "raw");
  const approvalFindings = scanText(approvalText, "approval");
  const tagSequences = [
    ...(extracted.inputType === "json"
      ? extracted.values
        .filter((item) => item.type === "string")
        .flatMap((value) => decodeTagSequences(value.value)
          .map((item) => ({ ...item, surface: "raw-value", path: value.path })))
      : decodeTagSequences(rawText).map((item) => ({ ...item, surface: "raw" }))),
    ...decodeTagSequences(approvalText).map((item) => ({ ...item, surface: "approval" })),
  ];
  const comparison = compareApproval(rawText, approvalText);
  const findings = [...rawFindings, ...approvalFindings];
  const hasCritical = findings.some((item) => item.severity === "critical");
  const hasWarning = findings.some((item) => item.severity === "warning");

  let verdict = "faithful";
  if (tagSequences.length > 0 || hasCritical) verdict = "hidden-payload";
  else if (comparison.missing.length > 0) verdict = "review-gap";
  else if (hasWarning) verdict = "caution";

  return {
    schema: "approvelens.report.v1",
    verdict,
    inputType: comparison.inputType,
    summary: {
      rawCharacters: [...rawText].length,
      approvalCharacters: [...approvalText].length,
      findings: findings.length,
      decodedTagSequences: tagSequences.length,
      valuesChecked: comparison.coverage.length,
      valuesMissing: comparison.missing.length,
    },
    findings,
    tagSequences,
    coverage: comparison.coverage,
    projections: {
      rawVisible: projectRawInput(rawText, visibleProjection),
      approvalVisible: visibleProjection(approvalText),
      rawSafe: projectRawInput(rawText, safeProjection),
    },
    disclaimer: "Display-fidelity analysis only. This report does not authorize the action.",
  };
}

export { MAX_INPUT_LENGTH };
