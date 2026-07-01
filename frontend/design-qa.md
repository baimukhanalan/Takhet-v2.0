# Takhet+ Journey Media Design QA

- Source visual truth:
  - `/Users/alanbaimukhan/Downloads/ChatGPT Image 28 июн. 2026 г., 22_00_11.png` -> stage 01
  - `/Users/alanbaimukhan/Downloads/ChatGPT Image 28 июн. 2026 г., 21_59_59.png` -> stage 02
  - `/Users/alanbaimukhan/Downloads/ChatGPT Image 28 июн. 2026 г., 21_59_52.png` -> stage 03
  - `/Users/alanbaimukhan/Downloads/ChatGPT Image 28 июн. 2026 г., 22_00_05.png` -> stage 04
  - `/Users/alanbaimukhan/Downloads/Screen_Recording_2026-06-28_at_185231_202606282159.mp4` -> stage 05
- Implementation screenshot: `/tmp/takhet-journey-media-stage-4.jpg`
- Combined comparison: `/tmp/takhet-journey-media-comparison.jpg`
- Viewport/state: desktop Chrome, public landing, journey stages 01-05

## Full-view comparison evidence

All four source photos were checked in their assigned stage. Each source fills the pinned viewport with `object-fit: cover`, keeps its central product/device subject visible, and transitions without exposing the navy base between stages.

## Focused region comparison evidence

The stage 04 source and implementation were normalized side by side. The phone remains the dominant center subject while the left article and right stage rail stay readable over the solid navy overlay. No asset substitution, distortion, or incorrect mapping is visible.

## Required fidelity surfaces

- Fonts and typography: existing Manrope hierarchy, wrapping and centered column geometry are unchanged.
- Spacing and layout rhythm: media is isolated behind the existing frame; no foreground position changed.
- Colors and visual tokens: a solid `rgba(4, 14, 36, 0.62)` overlay preserves the navy system and text contrast without hiding the supplied media.
- Image quality and asset fidelity: all supplied photos were converted losslessly in dimensions to quality-86 WebP; combined image size is about 243 KB. The original H.264 MP4 is preserved.
- Copy and content: all five stage texts and subsection lists are unchanged.

## Interaction evidence

- Stage buttons 01-05 were exercised in Chrome and each displayed the requested source.
- The stage 05 video produced different frames one second apart, confirming playback.
- Video playback starts only on stage 05 and pauses after leaving the stage.
- The video is muted, plays inline once, stops on its final frame and preloads metadata only.

## Findings

No actionable P0, P1 or P2 visual, mapping, readability or interaction issue remains.

## Patches made

- Added four optimized WebP backgrounds and one MP4 background.
- Added cross-fade and subtle media scale settling.
- Added solid navy readability overlay.
- Added active-stage video play/pause lifecycle and contract coverage.

final result: passed

---

# Takhet+ Testimonials Carousel Design QA

- Source visual truth: `/Users/alanbaimukhan/Desktop/Screenshot 2026-06-28 at 23.34.02.png` through `Screenshot 2026-06-28 at 23.34.29.png`
- Supplied content truth: `/var/folders/26/8__h2vm556l0r1fy5mscbqj40000gn/T/media-preview-0D68CE69-707A-4790-9BE1-325A06EC60C5/3e7641994b7d519edb0804f6e293fe31fa22245eebeae108b3d053cd1c45ac4c.png`
- Implementation screenshot: `/tmp/takhet-testimonials-desktop.png`
- Mobile screenshot: `/tmp/takhet-testimonials-mobile.png`
- Combined comparison: `/tmp/takhet-testimonials-comparison.png`
- Viewports: 1280x720 and 390x844

## Fidelity and behavior

- The section sits between the sixth control section and seventh philosophy section.
- Five horizontally snapping stories use the supplied identities, ages, copy and portraits.
- The active story is fully visible while adjacent stories remain partially faded.
- Five clickable progress segments and the `n / 5` counter stay synchronized with swipe, trackpad and button navigation.
- Desktop shows the active wide story and neighboring context; mobile shows one primary story with the next edge visible.
- RU, KK and EN copy is available through the existing language state.
- Reduced-motion users receive instant navigation without animated transitions.

## Verification

- TypeScript, protected second-section contract, testimonials contract and production build pass.
- Desktop segment 03 and mobile segment 01 were activated in the browser and reported the expected `aria-current` state.
- Browser console contained no relevant warnings or errors.
- No overlap, clipping, missing media or framework error overlay was observed.

final result: passed

## 2026-06-29 correction

- Removed the duplicated use of the couple photo. All five supplied source photos now appear exactly once.
- Restored the omitted South Asian portrait as the second testimonial image.
- Desktop uses a five-viewport sticky scene: vertical progress maps continuously to the full horizontal track range.
- Browser evidence confirmed `1 / 5` at entry, `3 / 5` at midpoint and `5 / 5` at the end, with no console errors.
- Mobile keeps native horizontal snap and disables the five-screen sticky height.

correction result: passed

## 2026-07-01 Yandex Browser compatibility

- Added legacy `vh` before every modern `svh` height used by landing scroll scenes.
- Production JavaScript now targets ES2019 and Chromium 87+ explicitly.
- Removed two unsupported newer built-in method calls.
- Landing hero and journey rendered normally after the compatibility build with no console errors.

compatibility result: passed
