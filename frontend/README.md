<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Takhet+ Frontend

This folder contains the Vite + React frontend for Takhet+.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Start dev server:
   `npm run dev`
4. Build production bundle:
   `npm run build`

## Git workflow note

`frontend/` is **not** a separate git repository. Git metadata is stored at the project root (`Takhet-v2.0/.git`).

- If `git status` from `frontend/` says `not a git repository`, verify you are inside the cloned root tree.
- You can always run git commands from root:
  - `cd ..`
  - `git status`
