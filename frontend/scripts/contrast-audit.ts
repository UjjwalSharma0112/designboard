// Dev-only contrast audit. Pulls the real token values from globals.css (kept
// in sync below), enumerates every text/background pair the app actually
// renders — per theme — computes the WCAG 2.x contrast ratio, prints a table,
// and exits non-zero if any pair fails its threshold (4.5 normal text, 3.0 for
// large >=24px/bold text and non-text UI such as borders).
//
// Run: node --experimental-strip-types scripts/contrast-audit.ts

type RGB = { r: number; g: number; b: number };

function hex(h: string): RGB {
  const v = h.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

// Composite a semi-transparent foreground color over an opaque background.
function over(fg: RGB, alpha: number, bg: RGB): RGB {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  };
}

function luminance({ r, g, b }: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function ratio(a: RGB, b: RGB): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- Token values (mirror globals.css) ------------------------------------

const PAPER = {
  bg: "#f4f1ea",
  surface: "#ece7db",
  raised: "#fbf9f4",
  line: "#d3ccbc",
  inkPrimary: "#15140f",
  inkSecondary: "#4e4b44",
  inkTertiary: "#5e5a51",
  accent: "#2f5d50",
  accentContrast: "#faf8f3",
  positive: "#2f5d50",
  warn: "#ae3318",
  accentSoft: { c: "#2f5d50", a: 0.12 },
};

const RUNNER = {
  bg: "#0e0e10",
  surface: "#161618",
  raised: "#1c1c20",
  line: "#2a2a2e",
  inkPrimary: "#f4f1ea",
  inkSecondary: "#b2ada0",
  inkTertiary: "#948f80",
  accent: "#79a892",
  accentContrast: "#0e0e10",
  positive: "#79a892",
  warn: "#ff8a6b",
  accentSoft: { c: "#79a892", a: 0.14 },
};

type Pair = { name: string; fg: RGB; bg: RGB; large: boolean };

function pairsFor(t: typeof PAPER, theme: string): Pair[] {
  const bg = hex(t.bg);
  const surface = hex(t.surface);
  const raised = hex(t.raised);
  const softOverBg = over(hex(t.accentSoft.c), t.accentSoft.a, bg);
  const L = true;
  const N = false;
  const P = (name: string, fg: string, b: RGB, large: boolean): Pair => ({
    name: `[${theme}] ${name}`,
    fg: hex(fg),
    bg: b,
    large,
  });
  return [
    // Headlines / display (large)
    P("heading (fg) on bg", t.inkPrimary, bg, L),
    P("question/display (fg) on bg", t.inkPrimary, bg, L),
    P("big score (fg) on bg", t.inkPrimary, bg, L),
    P("heading (fg) on surface card", t.inkPrimary, surface, L),
    // Body
    P("body (ink-secondary) on bg", t.inkSecondary, bg, N),
    P("body (ink-secondary) on surface", t.inkSecondary, surface, N),
    P("body (ink-secondary) on raised", t.inkSecondary, raised, N),
    // Tertiary mono labels / kickers / footnotes
    P("mono label (ink-tertiary) on bg", t.inkTertiary, bg, N),
    P("mono label (ink-tertiary) on surface", t.inkTertiary, surface, N),
    P("placeholder (ink-tertiary) on input surface", t.inkTertiary, surface, N),
    // Accent text: kickers, links, thinking cue, follow-up signal
    P("accent kicker/link on bg", t.accent, bg, N),
    P("accent on surface", t.accent, surface, N),
    P("accent active-chip text on accent-soft", t.accent, softOverBg, N),
    P("thinking cue (accent) on bg", t.accent, bg, N),
    // Semantic
    P("positive (held up) on bg", t.positive, bg, N),
    P("positive on surface", t.positive, surface, N),
    P("warn (cracked) on bg", t.warn, bg, N),
    P("warn (cracked) on surface", t.warn, surface, N),
    // Button text on accent fill
    P("button text (accent-contrast) on accent", t.accentContrast, hex(t.accent), N),
    // Non-text UI (3:1): chip border + focus ring legibility
    P("inactive chip border (ink-tertiary) vs bg", t.inkTertiary, bg, L),
    P("focus ring (accent) vs bg", t.accent, bg, L),
  ];
}

// Auth pages (/login, /signup) live on the paper theme. Inputs sit on the
// lighter "raised" fill; the selected account-type card uses the accent-soft
// wash. Enumerate those text pairs explicitly so the audit covers them.
function authPairs(): Pair[] {
  const t = PAPER;
  const bg = hex(t.bg);
  const raised = hex(t.raised);
  const softOverBg = over(hex(t.accentSoft.c), t.accentSoft.a, bg);
  const P = (name: string, fg: string, b: RGB, large: boolean): Pair => ({
    name: `[auth] ${name}`,
    fg: hex(fg),
    bg: b,
    large,
  });
  return [
    P("field label (ink-secondary) on bg", t.inkSecondary, bg, false),
    P("input text (fg) on input raised", t.inkPrimary, raised, false),
    P("placeholder (ink-tertiary) on input raised", t.inkTertiary, raised, false),
    P("terms/helper (ink-secondary) on bg", t.inkSecondary, bg, false),
    P("inline error (warn) on bg", t.warn, bg, false),
    P("account-type title (fg) on selected card", t.inkPrimary, softOverBg, false),
    P("account-type desc (ink-secondary) on selected card", t.inkSecondary, softOverBg, false),
    P("Google button text (fg) on raised", t.inkPrimary, raised, false),
    P("strength 'strong' (positive) on bg", t.positive, bg, false),
    P("strength 'weak' (warn) on bg", t.warn, bg, false),
    P("link/kicker (accent) on bg", t.accent, bg, false),
    P("primary button text (accent-contrast) on accent", t.accentContrast, hex(t.accent), false),
  ];
}

// Landing sections (paper theme). Most reuse fg/muted/faint/accent on bg or
// surface; the audience cards also lighten to "raised" on hover (accent link +
// fg title on raised), so those are enumerated explicitly.
function landingPairs(): Pair[] {
  const t = PAPER;
  const bg = hex(t.bg);
  const surface = hex(t.surface);
  const raised = hex(t.raised);
  const P = (name: string, fg: string, b: RGB, large: boolean): Pair => ({
    name: `[landing] ${name}`,
    fg: hex(fg),
    bg: b,
    large,
  });
  return [
    P("transcript interviewer (fg) on bg", t.inkPrimary, bg, true),
    P("transcript candidate (ink-secondary) on bg", t.inkSecondary, bg, false),
    P("'Following up' label (accent) on bg", t.accent, bg, false),
    P("role label (ink-tertiary) on bg", t.inkTertiary, bg, false),
    P("how-it-works title (fg) on surface", t.inkPrimary, surface, true),
    P("how-it-works desc (ink-secondary) on surface", t.inkSecondary, surface, false),
    P("how-it-works number (ink-tertiary) on surface", t.inkTertiary, surface, false),
    P("report score (fg) on surface", t.inkPrimary, surface, true),
    P("report competency (ink-secondary) on surface", t.inkSecondary, surface, false),
    P("report highlight item (fg) on surface", t.inkPrimary, surface, false),
    P("audience line (ink-secondary) on surface", t.inkSecondary, surface, false),
    P("audience 'Open' (ink-tertiary) on surface", t.inkTertiary, surface, false),
    P("audience hover title (fg) on raised", t.inkPrimary, raised, false),
    P("audience hover 'Open' (accent) on raised", t.accent, raised, false),
    P("closing heading (fg) on surface", t.inkPrimary, surface, true),
    P("closing secondary link (accent) on surface", t.accent, surface, false),
    P("footer link (ink-secondary) on bg", t.inkSecondary, bg, false),
    P("footer copyright (ink-tertiary) on bg", t.inkTertiary, bg, false),
  ];
}

const ALL = [
  ...pairsFor(PAPER, "paper"),
  ...pairsFor(RUNNER, "ink"),
  ...authPairs(),
  ...landingPairs(),
];

// ---- Report ---------------------------------------------------------------

let failures = 0;
const rows = ALL.map((p) => {
  const r = ratio(p.fg, p.bg);
  const threshold = p.large ? 3.0 : 4.5;
  const pass = r >= threshold;
  if (!pass) failures += 1;
  return { name: p.name, ratio: r, threshold, pass };
});

const nameW = Math.max(...rows.map((r) => r.name.length));
console.log(
  `${"PAIR".padEnd(nameW)}  ${"RATIO".padStart(7)}  ${"NEED".padStart(5)}  RESULT`,
);
console.log("-".repeat(nameW + 26));
for (const r of rows) {
  console.log(
    `${r.name.padEnd(nameW)}  ${r.ratio.toFixed(2).padStart(7)}  ${r.threshold
      .toFixed(1)
      .padStart(5)}  ${r.pass ? "PASS" : "**FAIL**"}`,
  );
}
console.log("-".repeat(nameW + 26));
console.log(
  `${rows.length} pairs · ${rows.length - failures} pass · ${failures} fail`,
);

if (failures > 0) {
  console.error(`\nCONTRAST AUDIT FAILED: ${failures} pair(s) below threshold.`);
  process.exit(1);
}
console.log("\nCONTRAST AUDIT PASSED: every pair meets WCAG AA.");
