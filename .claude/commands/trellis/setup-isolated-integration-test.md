# Isolated Integration Test Environment

Create and use an isolated local environment for integration testing without affecting existing local hapi runner processes.

## Steps

### 1. Verify required build artifacts
- Confirm these artifacts exist:
  - `hub/dist/index.js`
  - `web/dist/`
  - `cli/dist-exe-isolated/bun-windows-x64/hapi-isolated.exe` (or your chosen isolated CLI binary)
- If missing, build them first.

### 2. Prepare isolated runtime directories
Create (or reuse) a temp workspace under project root:
- `.tmp/isolated-run/hub-home`
- `.tmp/isolated-run/cli-home`
- `.tmp/isolated-run/claude-config`
- `.tmp/isolated-run/codex-home`

### 3. Start isolated Hub and Web
Start services on non-default ports (example):
- Hub: `127.0.0.1:3906`
- Web preview: `127.0.0.1:4174`

Use isolated env vars:
- `HAPI_HOME=.tmp/isolated-run/hub-home`
- `HAPI_LISTEN_HOST=127.0.0.1`
- `HAPI_LISTEN_PORT=3906`
- `HAPI_PUBLIC_URL=http://127.0.0.1:3906`
- `CORS_ORIGINS=http://127.0.0.1:4174`
- `CLI_API_TOKEN=<isolated-token>`

### 4. Start isolated runner
Start runner with isolated config (do not use global defaults):
- `HAPI_HOME=.tmp/isolated-run/cli-home`
- `HAPI_API_URL=http://127.0.0.1:3906`
- `CLI_API_TOKEN=<isolated-token>`
- `CLAUDE_CONFIG_DIR=.tmp/isolated-run/claude-config`
- `CODEX_HOME=.tmp/isolated-run/codex-home`

### 5. Login and configure Hub URL
In Web UI:
1. Open `http://127.0.0.1:4174`
2. Set Hub URL to `http://127.0.0.1:3906`
3. Login using the isolated token

### 6. Run integration verification
Create a fresh session in the target project directory and verify:
- Machine is visible and online
- Session spawn succeeds
- Slash command suggestions include project commands from `.claude/commands/**`
- Nested commands resolve as `folder:command` (e.g., `trellis:start`)

### 7. Teardown (safe cleanup)
Stop isolated services only:
- Isolated runner
- Isolated hub process
- Isolated web preview process

Do not stop or clean global/local non-isolated hapi processes.

## Output Format

## Isolated Test Report

### Environment
- Hub URL: <url>
- Web URL: <url>
- Isolated paths: <paths>

### Checks
- [ ] Machine registration
- [ ] Session spawn
- [ ] Slash command loading
- [ ] Nested command loading

### Result
- PASS / FAIL
- Notes: <issues and logs>
