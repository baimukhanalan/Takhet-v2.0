# Local macOS Setup

This checkout was restored on macOS from a Windows/Telegram transfer. The project is usable, but the working tree is intentionally dirty and must not be committed or deployed as one broad batch.

## Local Node

Node.js is installed locally for this Mac:

```bash
~/.local/nodejs/node-v24.18.0-darwin-arm64/bin/node
~/.local/nodejs/node-v24.18.0-darwin-arm64/bin/npm
```

`~/.zshrc` adds it to `PATH`:

```bash
export PATH="$HOME/.local/nodejs/node-v24.18.0-darwin-arm64/bin:$PATH"
```

Open a new terminal or run:

```bash
source ~/.zshrc
node -v
npm -v
```

Expected:

```bash
v24.18.0
11.16.0
```

## Verify The Project

Frontend:

```bash
cd frontend
npm run lint
npm run build
npm exec tsx tests/academy-dynamic-contract.test.ts
npm exec tsx tests/academy-integration-contract.test.ts
npm exec tsx tests/academy-import-admin-contract.test.ts
npm exec tsx tests/critical-workflows-contract.test.ts
npm exec tsx tests/portal-workflow-completion-contract.test.ts
```

Backend:

```bash
cd backend
npm run lint
npm run build
npm exec tsx tests/academy-dynamic-contract.test.ts
npm exec tsx tests/academy-import-contract.test.ts
npm exec tsx tests/critical-workflows-contract.test.ts
```

## Transfer Fixes Already Applied

- Removed Telegram quarantine attributes from working project files.
- Restored owner write permission on project working directories and Obsidian memory.
- Added `.gitattributes` to normalize text files across Windows/macOS.
- Added backend `tsx` as a dev dependency so backend contract tests do not depend on temporary `npm exec` downloads.

## Known Follow-Ups

- `npm audit` in `backend` reports high findings through `@nestjs/platform-express`/`multer` and `@nestjs/cli`/`lodash`.
- Do not run `npm audit fix --force` blindly: npm proposes major-version rollback paths that can break Nest 11.
- Treat the audit as a separate dependency/security task.
- Split the dirty tree into reviewable groups before any commit or deploy:
  - dynamic Academy and Academy import pipeline;
  - critical workflow repair;
  - PWA icons;
  - i18n/service copy;
  - macOS portability docs/config.
