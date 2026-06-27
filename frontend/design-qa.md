# Takhet+ Hero Design QA

- Source visual truth: `/Users/alanbaimukhan/Desktop/Screenshot 2026-06-28 at 00.28.58.png`
- Source implementation: `/Users/alanbaimukhan/Downloads/backgroundflow.zip`
- Implementation screenshot: `/tmp/takhet-hero-reference-viewport.png`
- Combined comparison: `/tmp/takhet-hero-comparison.png`
- Viewport: `1710x1107`
- State: Russian, landing route at scroll position 0

## Full-view comparison evidence

The combined comparison shows the source and implementation at the same CSS viewport. Header placement, centered wordmark, description width, 820x80 search control, two-row action layout, white canvas field, and navy/cobalt/periwinkle palette align with the source. The canvas wave phase differs between captures because both backgrounds animate continuously.

## Focused region comparison evidence

A separate crop was not required: at 1710x1107 the header labels, title, search controls, icons, and action labels are legible in the full-view comparison. Browser measurements additionally confirmed the 820x80 search geometry and the 100vh hero frame.

## Required fidelity surfaces

- Fonts and typography: Manrope 400-800 is loaded; title uses the reference 172px cap, 0.88 line-height, tight tracking, text stroke, and corrected horizontal optical scale.
- Spacing and layout rhythm: header, hero content, 34px/50px vertical gaps, search geometry, button rows, radii, and shadows match the supplied HTML.
- Colors and visual tokens: platform tokens now use `#0E1F44`, `#1D4ED8`, `#7C8EE0`, `#5D6B86`, and `#E7EBF4`.
- Image and asset fidelity: the hero has no raster assets; its nine animated lines are rendered by the supplied canvas algorithm and Lucide icons replace the source interface icons.
- Copy and content: hero copy, search placeholder, action labels, and Russian navigation match the source state.

## Findings

No actionable P0, P1, or P2 mismatches remain.

## Patches made

- Replaced the previous SVG wave with the nine-layer canvas flow from the supplied HTML.
- Added cursor-local swell/lag, scroll-speed response, search micro-parallax, reduced-motion handling, and offscreen pause.
- Rebuilt the responsive header with its scroll-driven glass capsule state.
- Applied the hero palette and Manrope typography across platform tokens, logos, shell cursors, and dashboard charts.
- Added a fingerprint contract proving the second landing section stayed unchanged.
- Corrected the title's horizontal optical scale after the first side-by-side comparison.

## Follow-up polish

- P3: animated wave phases cannot be pixel-identical between independently timed screenshots; structure, amplitude model, colors, and interaction behavior match the supplied algorithm.

final result: passed
