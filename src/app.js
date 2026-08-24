import { analyze, MAX_INPUT_LENGTH } from "./analyzer.js";

const byId = (id) => document.getElementById(id);

const elements = {
  form: byId("analysis-form"),
  raw: byId("raw-input"),
  approval: byId("approval-input"),
  rawCount: byId("raw-count"),
  approvalCount: byId("approval-count"),
  results: byId("results"),
  resultsTitle: byId("results-title"),
  verdict: byId("verdict"),
  verdictLabel: byId("verdict-label"),
  verdictDetail: byId("verdict-detail"),
  decodedSection: byId("decoded-section"),
  decodedList: byId("decoded-list"),
  missingSection: byId("missing-section"),
  missingBody: byId("missing-body"),
  findingsSection: byId("findings-section"),
  findingsBody: byId("findings-body"),
  visibleProjection: byId("visible-projection"),
  safeProjection: byId("safe-projection"),
  liveStatus: byId("live-status"),
};

const verdictCopy = {
  "hidden-payload": {
    label: "Hidden payload detected",
    detail: "The input contains Unicode TAG data or dangerous display controls that an approval interface may conceal or reorder.",
  },
  "review-gap": {
    label: "Approval view omits raw values",
    detail: "One or more primitive values from the raw payload are not represented in the text shown for approval.",
  },
  caution: {
    label: "Invisible formatting needs review",
    detail: "The values are represented, but zero-width or other suspicious formatting characters are present.",
  },
  faithful: {
    label: "Approval view is faithful",
    detail: "No dangerous display characters were found, and every checked primitive value appears in the approval view.",
  },
};

let currentReport = null;

function tagEncode(value) {
  return [...value]
    .filter((character) => {
      const point = character.codePointAt(0);
      return point >= 0x20 && point <= 0x7e;
    })
    .map((character) => String.fromCodePoint(0xe0000 + character.codePointAt(0)))
    .join("") + String.fromCodePoint(0xe007f);
}

const examples = {
  safe: {
    raw: JSON.stringify({
      tool: "send_email",
      recipient: "research@example.org",
      subject: "Dataset review",
    }, null, 2),
    approval: "Use send_email to research@example.org with subject: Dataset review",
  },
  hidden: {
    raw: JSON.stringify({
      tool: "send_email",
      recipient: "research@example.org",
      subject: `Dataset review${tagEncode("EXFILTRATE=.env")}`,
    }, null, 2),
    approval: "Use send_email to research@example.org with subject: Dataset review",
  },
};

function setStatus(message) {
  elements.liveStatus.textContent = "";
  requestAnimationFrame(() => { elements.liveStatus.textContent = message; });
}

function updateCount(input, output) {
  const length = [...input.value].length;
  output.textContent = `${length.toLocaleString("en-US")} / ${MAX_INPUT_LENGTH.toLocaleString("en-US")}`;
}

function textCell(value, className = "") {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) cell.className = className;
  return cell;
}

function renderDecoded(sequences) {
  elements.decodedList.replaceChildren();
  elements.decodedSection.hidden = sequences.length === 0;
  sequences.forEach((sequence) => {
    const item = document.createElement("li");
    const location = document.createElement("span");
    const code = document.createElement("code");
    const path = sequence.path ? ` ${sequence.path}` : "";
    location.textContent = `${sequence.surface}${path} at offset ${sequence.start}: `;
    code.textContent = sequence.decoded;
    item.append(location, code);
    elements.decodedList.append(item);
  });
}

function renderMissing(coverage) {
  const missing = coverage.filter((item) => !item.represented);
  elements.missingBody.replaceChildren();
  elements.missingSection.hidden = missing.length === 0;
  missing.forEach((item) => {
    const row = document.createElement("tr");
    row.append(textCell(item.path), textCell(item.value), textCell(item.type));
    elements.missingBody.append(row);
  });
}

function renderFindings(findings) {
  elements.findingsBody.replaceChildren();
  elements.findingsSection.hidden = findings.length === 0;
  findings.forEach((finding) => {
    const row = document.createElement("tr");
    row.append(
      textCell(finding.severity, `severity-${finding.severity}`),
      textCell(finding.surface),
      textCell(finding.path
        ? `${finding.path}, character ${finding.column}`
        : `line ${finding.line}, column ${finding.column}`),
      textCell(`${finding.codePoint} ${finding.name}`),
      textCell(finding.category),
    );
    elements.findingsBody.append(row);
  });
}

function renderReport(report) {
  currentReport = report;
  const copy = verdictCopy[report.verdict];
  elements.verdict.dataset.verdict = report.verdict;
  elements.verdictLabel.textContent = copy.label;
  elements.verdictDetail.textContent = copy.detail;
  byId("metric-findings").textContent = report.summary.findings.toLocaleString("en-US");
  byId("metric-tags").textContent = report.summary.decodedTagSequences.toLocaleString("en-US");
  byId("metric-checked").textContent = report.summary.valuesChecked.toLocaleString("en-US");
  byId("metric-missing").textContent = report.summary.valuesMissing.toLocaleString("en-US");
  renderDecoded(report.tagSequences);
  renderMissing(report.coverage);
  renderFindings(report.findings);
  elements.visibleProjection.textContent = report.projections.rawVisible;
  elements.safeProjection.value = report.projections.rawSafe;
  elements.results.hidden = false;
  elements.resultsTitle.focus();
  setStatus(`${copy.label}. ${report.summary.findings} character findings and ${report.summary.valuesMissing} missing values.`);
}

function loadExample(example) {
  elements.raw.value = example.raw;
  elements.approval.value = example.approval;
  updateCount(elements.raw, elements.rawCount);
  updateCount(elements.approval, elements.approvalCount);
  elements.raw.focus();
  setStatus("Example loaded.");
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    renderReport(analyze(elements.raw.value, elements.approval.value));
  } catch (error) {
    currentReport = null;
    elements.results.hidden = true;
    setStatus(`Analysis failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
});

elements.raw.addEventListener("input", () => updateCount(elements.raw, elements.rawCount));
elements.approval.addEventListener("input", () => updateCount(elements.approval, elements.approvalCount));
byId("safe-example").addEventListener("click", () => loadExample(examples.safe));
byId("hidden-example").addEventListener("click", () => loadExample(examples.hidden));

byId("clear-button").addEventListener("click", () => {
  elements.form.reset();
  elements.results.hidden = true;
  currentReport = null;
  updateCount(elements.raw, elements.rawCount);
  updateCount(elements.approval, elements.approvalCount);
  elements.raw.focus();
  setStatus("Inputs and results cleared.");
});

byId("copy-safe").addEventListener("click", async () => {
  if (!currentReport) return;
  try {
    await navigator.clipboard.writeText(currentReport.projections.rawSafe);
    setStatus("Safe projection copied to the clipboard.");
  } catch {
    elements.safeProjection.select();
    setStatus("Clipboard access was unavailable. The safe projection is selected for manual copy.");
  }
});

byId("download-report").addEventListener("click", () => {
  if (!currentReport) return;
  const blob = new Blob([`${JSON.stringify(currentReport, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "approvelens-report.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus("JSON report downloaded.");
});

updateCount(elements.raw, elements.rawCount);
updateCount(elements.approval, elements.approvalCount);
