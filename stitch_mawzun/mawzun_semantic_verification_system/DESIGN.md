---
name: Mawzūn Semantic System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45474c'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#00190e'
  on-tertiary: '#ffffff'
  tertiary-container: '#00301f'
  on-tertiary-container: '#24a375'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-density, forensic verification workspace engineered for rigorous scientific and doctrinal auditing. The interface is clinical, objective, and authoritative—prioritizing absolute data legibility, structured comparison, and institutional accountability over consumer ornamentation. It eschews generic theological clichés (e.g., decorative arabesques, gilded accents, or calligraphic filigree) in favor of high-precision computational ergonomics, drawing visual tenets from critical infrastructure dashboards, regulatory compliance portals, and analytical laboratory instrumentation.

The design movement combines **Contemporary Functional Minimalism** with **Systematic Monospace Data Architecture**. The experience evokes uncompromised trust, methodological rigor, and analytical calm under complex multilingual scrutiny. Every screen element functions as an auditable data node, where strict structural borders, dual-direction typographical parity (Arabic RTL and Latin LTR), and deterministic semantic states guide researchers, auditors, and safety engineers through verification pipelines.

## Colors

The palette is engineered around high-density neutral grays and deterministic tripartite status accents. Structural neutrality governs 90% of the canvas, ensuring that status classifications command instantaneous, unambiguous triage.

### Core Canvas & Structure
- **Canvas Base**: `#FFFFFF` for default data density; `#F8FAFC` (Slate 50) for workspace backing; `#0B0F17` for dedicated audit-log surfaces or high-contrast cryptographic panels.
- **Surface Elevation**: `#FFFFFF` for cards and panels, layered over `#F1F5F9` (Slate 100) inset containers.
- **Structural Dividers & Outlines**: Hairline boundaries set to `#E2E8F0` (Slate 200) in light mode and `#1E293B` (Slate 800) in dark structural nodes.
- **Primary Text**: `#0F172A` (Slate 900) for uncompromised typographic contrast.
- **Muted Text / Metadata**: `#475569` (Slate 600) and `#64748B` (Slate 500).

### Semantic Tripartite Engine
1. **Verified / Matched (Consensus & Attested Ground Truth)**:
   - Primary: `#059669` (Emerald 600)
   - Surface Tint: `#ECFDF5` (Emerald 50)
   - Border / Rule: `#A7F3D0` (Emerald 200)
   - Deep Accent / Ink: `#064E3B` (Emerald 900)
2. **Needs Revision / Inconclusive (Drift, Ambiguity, Nuance Required)**:
   - Primary: `#D97706` (Amber 600)
   - Surface Tint: `#FFFBEB` (Amber 50)
   - Border / Rule: `#FDE68A` (Amber 200)
   - Deep Accent / Ink: `#78350F` (Amber 900)
3. **Stop & Escalate (Critical Violation, Doctrinal Corruption, Hallucination)**:
   - Primary: `#DC2626` (Rose 600)
   - Surface Tint: `#FEF2F2` (Rose 50)
   - Border / Rule: `#FECACA` (Rose 200)
   - Deep Accent / Ink: `#7F1D1D` (Rose 900)

### Primary System Accents
- **System Authority (Primary)**: `#1E293B` (Deep Slate) for command bars, active workflows, and authoritative seals.
- **Execution & Telemetry (Secondary)**: `#3B82F6` (Electric Slate-Blue) for focal execution states, pipeline nodes, and active cursors.

## Typography

The typography architecture uses a bidirectional configuration designed for parity between Latin technical metadata and high-fidelity Arabic scripture and academic prose.

### Typeface Roles & Parity
- **Primary Latin Interface**: `Inter` handles all navigation, table structures, and analytical metrics. Its neutral aperture preserves scan-speed in dense grids.
- **Arabic Script Partner**: Parallel layouts map directly to `IBM Plex Sans Arabic`. When rendering scholarly textual corpuses or diff views in Arabic, line-height automatically expands by `25-30%` relative to Latin body text to accommodate traditional diacritics (tashkīl) and vertical character stacking without clipping.
- **Cryptographic & Telemetry Layer**: `JetBrains Mono` governs all Run IDs, verification fingerprints, SHA-256 commit hashes, rule taxonomies, and numerical delta markers.

### Typographic Discipline
- **Tabular Figures**: All data grids, timestamp fields, and verification scores must mandate font feature settings `tnum` (tabular numbers) and `cv05` / `cv08` for structural clarity.
- **Strict Hierarchy**: Avoid heavy display weights. Font weights cap out at `600` (Semi-bold), maintaining a technical, ledger-like precision across all screens.

## Layout & Spacing

The system implements an ultra-dense, 12-column fixed-gutter computational grid optimized for large analytical displays (minimum target 1440px wide). Spatial distribution prioritizes simultaneous cross-referencing over responsive vertical stacking.

### Layout Topology
- **Dual-Pane Audit View**: The workspace centers on a 50/50 split (or 45/55 context-weighted) split viewport. The left (LTR) or contextual primary pane renders the submitted AI-generated artifact; the companion pane locks parallel alignment to the cryptographically verified knowledge package.
- **Vertical Tooling Rails**: Fixed 56px collapsed / 240px expanded global system rails flank the viewport, housing the deterministic audit state machine and telemetry feeds.
- **Breakpoints**:
  - `Desktop Forensic (≥1440px)`: Full dual-pane view with side-by-side token diffs, persistent right-hand ledger panel (360px), and top workflow stepper.
  - `Desktop Standard (1024px - 1439px)`: Dual-pane maintained with collapsible ledger into an overlay slide-out.
  - `Inspection Reflow (<1024px)`: Tab-toggled dual view with absolute status badge bar locked to the bottom viewport.

## Elevation & Depth

Visual hierarchy is communicated strictly via **Tonal Planar Layering and Low-Contrast Structural Rules**, completely rejecting blurry, ambient skeuomorphic drop shadows. Depth in this design system indicates logical verification hierarchy rather than physical elevation.

### Structural Depth Architecture
- **Base Canvas (Level 0)**: `#0B0F17` (telemetry/monitors) or `#F8FAFC` (workspace canvas).
- **Surface Panels (Level 1)**: Flat `#FFFFFF` panels defined by a persistent `1px` solid border (`#E2E8F0`). Zero drop-shadow.
- **Inset Verification Traces (Level -1)**: Recessed content areas (e.g., raw text dumps, diff blocks) use an inset fill of `#F1F5F9` with a crisp `1px` interior perimeter (`#CBD5E1`).
- **Focus & Flyout Overlays (Level 2)**: Rule inspector flyouts and verification detail cards utilize a sharp offset rim: `0 0 0 1px #0F172A, 0 4px 12px rgba(15, 23, 42, 0.08)`. This maintains structural legibility when hovering complex diff tags.
- **Active Selection Tiers**: Active diff segments never float; they illuminate using high-contrast token backdrops (e.g., `#ECFDF5` for authenticated segments, `#FEF2F2` for violations) encased within a sharp `1px` high-chroma border.

## Shapes

The interface embraces a precise, calibrated **Soft Precision (`1`)** language. High corner roundings are prohibited to prevent visual dilution of tabular datasets and continuous monospace code blocks.

### Corner Radius System
- **Micro Tokens & Inline Tags**: `2px` border radius (`rounded-xs`) for inline code pills, token diff highlights, and confidence badges.
- **Standard Controls & Components**: `4px` border radius (`rounded-sm` / `0.25rem`) for buttons, inputs, segmented controls, and workflow step pills.
- **Data Panels & Structural Cards**: `6px` to `8px` (`rounded-md` to `rounded-lg`) for major pane containers and audit table bounds.
- **Pills**: Disallowed for operational tools; restricted purely to binary system telemetry indicators (e.g., active server ping, live ledger stream).

## Components

### Workflow Stepper (Dense Enterprise Pipeline)
A high-density numbered horizontal tracking bar positioned at the global viewport header:
`01 Input -> 02 Constraints -> 03 Verification -> 04 Decision -> 05 Certificate & Audit`.
- **States**: `Pending` (ghosted border, `#94A3B8`), `Active` (solid `#1E293B` background with `#FFFFFF` label and blue execution dot), and `Resolved` (emerald check icon with completion hash tooltip).
- **Format**: Step numbers rendered in `JetBrains Mono` with uppercase tracking labels.

### Dual-Pane Text Diff & Alignment View
Synchronized scrolling split-screen component comparing raw input against verified knowledge packages.
- **Matched Spans**: Background `#ECFDF5`, bottom border `1px solid #10B981`.
- **Drifted / Questioned Spans**: Background `#FFFBEB`, wavy bottom border `1.5px solid #F59E0B`.
- **Disputed / Rejected Spans**: Background `#FEF2F2`, strike-through with `1px solid #EF4444`.
- **Gutter Markers**: Left of each line number, single-letter monospace glyphs denote line status: `[M]` Matched, `[?]` Nuance, `[X]` Violation.

### Constraint Badges
Compact metadata badges identifying verification bounds.
- **Approved Knowledge Package**: Tagged with `#064E3B` text over `#ECFDF5` background, framed in `1px solid #A7F3D0` accompanied by an attestation lock icon.
- **AI-Generated Untrusted**: Monospaced `#475569` text over `#F1F5F9`, framed in `1px dashed #94A3B8`.

### Tripartite Verification Matrix
A 3-column scorecard summarizing rule classifications:
- Headers utilize small-caps `JetBrains Mono` labels with running totals (`142 VALIDATED`, `3 SUSPECT`, `0 BREACHES`).
- Interactive rows reveal algorithmic certainty scores, matching ontologies, and direct citation links to source corpora.

### Decision Callouts
Structured resolution blocks inserted post-audit:
- Composed of four discrete sub-fields: `Reason` (authoritative explanation), `Location` (exact character index and line offset), `Evidence` (canonical excerpt from source package), and `Diff Correction` (suggested semantic replacement).
- Color-coded left anchor border (3px) matched directly to the semantic status (Emerald, Amber, or Rose).

### Cryptographic Audit Ledger
A dense terminal-like tabular component anchoring the bottom panel:
- Lists immutable sequence logs: `Timestamp (UTC)`, `Operation`, `Package SHA-256`, `Validator Sign-Off`, and `HMAC Seal`.
- Actions include one-click cryptographic hash export, verification certificate download (JSON-LD / PDF-A), and raw vector distance telemetry.