---
name: sfood-design
description: Apply the SFOOD visual design system to web UI, documents, reports, slides, dashboards, diagrams, and design reviews. Use when creating or reviewing layouts, UI components, presentation pages, report pages, visual guides, or brand-consistent design output for SFOOD/AX services.
when_to_use: Use this skill whenever the user asks for design, UI, UX, landing pages, admin screens, dashboards, reports, PowerPoint, Word-style documents, visual documentation, diagrams, design QA, or style refactoring that should follow the SFOOD brand. Trigger phrases include "SFOOD 디자인", "sfood style", "design system", "화면 디자인", "보고서 디자인", "슬라이드 디자인", "UI 개선", "브랜드 스타일", "디자인 검토".
argument-hint: "[target artifact or design task]"
---

# SFOOD Design Skill

## Mission

Apply the SFOOD-inspired design system consistently across UI screens, reports, slides, dashboards, and visual documentation.

The design must feel like a clean consulting paper: white canvas, concise message hierarchy, restrained brand accents, readable typography, structured cards, tables, charts, and generous spacing.

When the user provides a specific target artifact, apply this system directly to that artifact. If the request is broad, produce a practical design direction, layout specification, component rules, or implementation-ready guide.

## Core design direction

- Use a pure white base surface: `#ffffff`.
- Use SFOOD Red `#e4002B` as a restrained brand accent, not as a large background color.
- Prefer warm near-black text: `#54585A`.
- Use pure black `#000000` only where stronger print/readability contrast is required.
- Keep the visual voice concise, structured, confident, and warm.
- Prefer information clarity over decoration.
- Use cards, tables, charts, diagrams, and badges only when they improve comprehension.
- Avoid excessive shadows, gradients, decorative effects, or saturated secondary colors.
- For public-facing documents, use a formal Korean business style unless the user asks otherwise.

## Color tokens

### Brand

```css
--sfood-red: #e4002B;
--sfood-red-deep: #e00b41;
--sfood-white: #ffffff;
--sfood-text-primary: #54585A;
--sfood-text-strong: #000000;
--sfood-text-focused: #3f3f3f;
--sfood-text-secondary: #6a6a6a;
--sfood-text-disabled: rgba(0,0,0,0.24);
--sfood-link-disabled: #929292;
--sfood-button-soft: #f2f2f2;
```

### Usage

- `#ffffff`: page background, card background, document canvas.
- `#e4002B`: logo/brand mark, section accent, key line, important badge, highlight sentence, active state.
- `#54585A`: default body text and warm primary text.
- `#000000`: high-contrast headings, print-critical labels, chart data labels when needed.
- `#6a6a6a`: secondary descriptions, help text, metadata.
- `rgba(0,0,0,0.24)`: disabled state.
- `#f2f2f2`: soft button/circular control background.

## Typography

### Font family

Use:

```css
font-family: "맑은 고딕", "Malgun Gothic", Pretendard, Circular, -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
```

### Hierarchy

| Role | Size | Weight | Line height | Letter spacing |
|---|---:|---:|---:|---:|
| Section heading | 28px | 700 | 1.43 | normal |
| Card heading | 22px | 600 | 1.18 | -0.44px |
| Card heading medium | 22px | 500 | 1.18 | -0.44px |
| Sub-heading | 21px | 700 | 1.43 | normal |
| Feature title | 20px | 600 | 1.20 | -0.18px |
| UI medium | 16px | 500 | 1.25 | normal |
| UI semibold | 16px | 600 | 1.25 | normal |
| Button | 16px | 500 | 1.25 | normal |
| Body/link | 14px | 400 | 1.43 | normal |
| Body medium | 14px | 500 | 1.29 | normal |
| Small description | 13px | 400 | 1.23 | normal |
| Tag | 12px | 400–700 | 1.33 | normal |
| Badge | 11px | 600 | 1.18 | normal |
| Micro uppercase | 8px | 700 | 1.25 | 0.32px |

### Typography rules

- Use weight `500–700` for headings and important UI text.
- Do not use thin heading weights such as `300` or weak `400` headings.
- Apply slight negative tracking to headings when space is limited or a warmer tone is needed:
  - `-0.18px` for 20px feature titles.
  - `-0.44px` for 22px card headings.
- Use line-height `1.3–1.5` for readable report/document paragraphs.
- When text is placed inside shapes, keep enough internal padding so text does not touch borders.
- Use `font-feature-settings: "salt";` only for small badges/caption elements when the environment supports it.

## Radius system

```css
--radius-subtle: 4px;
--radius-button: 8px;
--radius-badge: 14px;
--radius-card: 20px;
--radius-large: 32px;
--radius-circle: 50%;
```

Use:

- `4px`: small inline links or minimal labels.
- `8px`: buttons, tabs, search inputs.
- `14px`: badges, compact labels.
- `20px`: cards, feature blocks, large buttons.
- `32px`: hero blocks, large containers.
- `50%`: circular navigation controls, avatars, icon buttons.

## Elevation

Use the SFOOD three-layer shadow for elevated cards and UI surfaces:

```css
box-shadow:
  rgba(0,0,0,0.02) 0px 0px 0px 1px,
  rgba(0,0,0,0.04) 0px 2px 6px,
  rgba(0,0,0,0.10) 0px 4px 8px;
```

Rules:

- Use no shadow for plain document sections and text-heavy report blocks.
- Use the three-layer shadow for cards, search bars, key dashboard panels, and listing cards.
- Do not use heavy shadows above `0.10` opacity as the main layer.
- Prefer subtle border rings and warm lift over dramatic elevation.
- In Word/Excel-like outputs, avoid shadow effects and use light borders instead.
- In PowerPoint, subtle shadows are acceptable for cards and blocks, but avoid text shadows.

## Spacing

Base unit: `8px`.

Preferred spacing scale:

```text
2px, 3px, 4px, 6px, 8px, 10px, 11px, 12px, 15px, 16px, 22px, 24px, 32px
```

Rules:

- Use 24–32px outer spacing for major sections.
- Use 16–24px card padding.
- Use 8–12px compact spacing inside badges, labels, and controls.
- Keep grids aligned and avoid arbitrary spacing values unless necessary.
- Give charts and tables enough breathing room so labels remain legible.

## Components

### Primary button

```css
.sfood-button-primary {
  background: #222222;
  color: #ffffff;
  padding: 0 24px;
  min-height: 40px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.25;
}
```

Interaction:

- Hover may shift toward `#e4002B` only for primary brand emphasis.
- Focus should use a visible ring and slight scale feedback.
- Do not use large red buttons unless the action is brand-critical or high emphasis.

### Soft circular control

```css
.sfood-circle-control {
  background: #f2f2f2;
  color: #222222;
  border-radius: 50%;
  box-shadow: none;
}
```

Use for carousel navigation, icon controls, step navigation, or small directional actions.

### Card

```css
.sfood-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow:
    rgba(0,0,0,0.02) 0px 0px 0px 1px,
    rgba(0,0,0,0.04) 0px 2px 6px,
    rgba(0,0,0,0.10) 0px 4px 8px;
  padding: 24px;
}
```

Rules:

- Use white card surfaces.
- Prefer one clear purpose per card.
- Title: 20–22px, weight 600.
- Description: 13–14px, `#54585A` or `#6a6a6a`.
- Avoid stuffing more than 3–5 key points in one card.

### Badge

```css
.sfood-badge {
  border-radius: 14px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.18;
}
```

Rules:

- Use red badges only for highlight or status emphasis.
- Use gray/white badges for neutral metadata.
- Keep badge labels short.

### Table

Rules:

- Use light borders.
- Header row should have clear hierarchy but not heavy color fill.
- Use 13–14px body text.
- Keep cell padding comfortable.
- Align numbers right.
- Avoid zebra striping unless the table is dense.
- For Word/PowerPoint reports, use subtle borders rather than shadows.

### Chart

Rules:

- Always show data labels when the chart communicates quantitative comparison.
- Axis and legend text should be smaller than body text.
- Use accurate proportions.
- Use SFOOD Red only for the key series or highlight.
- Do not overuse multiple saturated colors.
- Prefer simple bar, line, or stacked charts over decorative chart types.
- Add a concise chart insight sentence near the chart.

## Layout patterns

### Report page

Use this structure:

1. Clear title area
2. One-sentence key message
3. Structured body using cards, table, chart, or diagram
4. Final implication or next action

Do not overload one page. A report page should be scannable within a few seconds.

### Dashboard/admin screen

Use this structure:

- Top header with page title and primary action.
- Optional filter/search row.
- Summary KPI cards.
- Main content table or list.
- Detail panel or status card only when useful.

Rules:

- Use red for active state, alert emphasis, or brand moment.
- Keep operational screens mostly white/gray.
- Use consistent card radius and spacing.
- Make status and approval flows immediately recognizable.

### Web landing/portal page

Use this structure:

- White hero section with strong headline.
- Red accent line, icon, or small badge.
- Feature cards with 20px radius.
- Clear CTA button using near-black surface or red accent.
- Footer with structured link columns.

### PowerPoint slide

Rules:

- Use white background.
- Use red as section marker or key highlight.
- Place page number at the bottom-right except on the first and last slide.
- On the first slide, include author/team and date in small text.
- Avoid text effects.
- Use subtle shadows only for cards/blocks.
- Use charts with visible data labels.
- Keep one dominant message per slide.

### Word/report document

Rules:

- Use light borders for tables.
- Avoid shadows and decorative effects.
- Use line-height `1.3–1.5`.
- Use clear heading hierarchy.
- Keep red accents small and intentional.
- If the document may be printed, verify contrast and spacing.

### Diagram

Rules:

- Use white background.
- Use red only for the current focus, critical path, or selected node.
- Use rounded rectangles with 8–20px radius.
- Use thin gray connector lines.
- Keep labels short.
- For process diagrams, use left-to-right or top-to-bottom flow.
- For architecture diagrams, separate user, frontend, backend, data, and external systems clearly.

## Output behavior

When generating a design artifact:

- Start with the user’s requested format.
- Apply the SFOOD design rules without asking for unnecessary confirmation.
- If code is requested, provide implementation-ready CSS/Tailwind/component code.
- If a document or slide is requested, provide layout sections and design specifications.
- If reviewing an existing design, classify issues into:
  - Brand consistency
  - Typography
  - Layout/spacing
  - Components
  - Readability
  - Implementation changes
- When refactoring existing UI, preserve behavior and improve structure only.
- For business documents, do not number main titles unless the user explicitly asks.
- Use formal Korean wording for external/public documents.

## Implementation shortcuts

### CSS variables

```css
:root {
  --sfood-red: #e4002B;
  --sfood-red-deep: #e00b41;
  --sfood-white: #ffffff;
  --sfood-text-primary: #54585A;
  --sfood-text-strong: #000000;
  --sfood-text-focused: #3f3f3f;
  --sfood-text-secondary: #6a6a6a;
  --sfood-text-disabled: rgba(0,0,0,0.24);
  --sfood-button-soft: #f2f2f2;

  --sfood-radius-button: 8px;
  --sfood-radius-badge: 14px;
  --sfood-radius-card: 20px;
  --sfood-radius-large: 32px;

  --sfood-shadow-card:
    rgba(0,0,0,0.02) 0px 0px 0px 1px,
    rgba(0,0,0,0.04) 0px 2px 6px,
    rgba(0,0,0,0.10) 0px 4px 8px;

  --sfood-font:
    "맑은 고딕", "Malgun Gothic", Pretendard, Circular,
    -apple-system, BlinkMacSystemFont, system-ui, Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
```

### Tailwind-friendly mapping

Use this mapping when implementing with Tailwind:

- Background: `bg-white`
- Text: custom `text-[#54585A]`, strong `text-black`
- Accent: `text-[#e4002B]`, `border-[#e4002B]`, small `bg-[#e4002B]`
- Soft control: `bg-[#f2f2f2]`
- Card radius: `rounded-[20px]`
- Large radius: `rounded-[32px]`
- Button radius: `rounded-lg`
- Shadow: custom arbitrary shadow:
  `shadow-[rgba(0,0,0,0.02)_0px_0px_0px_1px,rgba(0,0,0,0.04)_0px_2px_6px,rgba(0,0,0,0.10)_0px_4px_8px]`

## Review checklist

Before finalizing, verify:

- The page is mostly white and uncluttered.
- SFOOD Red is used as an accent, not a large surface.
- Heading weights are 500–700.
- Cards use 20px radius and the three-layer shadow where elevation is needed.
- Tables use light borders and comfortable padding.
- Charts include data labels and readable axis/legend text.
- Spacing follows the 8px-based scale.
- Important text does not touch borders or shape edges.
- PowerPoint page numbers are omitted on the first and last slide.
- Business documents use formal wording and avoid unnecessary title numbering.
