# Docker 镜像与 Hub/CLI 部署方案（Brainstorm Final）

## Goal

为 HAPI 提供可自动构建与可复用的容器化方案：
- Hub 可独立部署
- CLI 可独立部署（具备 Claude Code 运行条件）
- Hub/CLI 可通过统一配置接入（Hub 地址 + CLI_API_TOKEN）
- 提供本地一键启动路径，并可扩展到 CI 多架构镜像发布

## Requirements

- 提供 `hapi-hub` 镜像（独立运行 Hub）。
- 提供 `hapi-cli` 镜像（独立运行 CLI，内置 Claude Code 可执行）。
- 统一配置注入：
  - `HAPI_API_URL`（CLI 连接 Hub）
  - `CLI_API_TOKEN`（Hub/CLI 一致）
- 配置可在不重建镜像情况下切换（env / volume）。
- CLI 默认容器模式可用于 Docker 常驻启动。
- 提供 `docker-compose` 作为 MVP 编排入口。
- 镜像发布支持：
  - 必须：`linux/amd64`
  - 条件支持：`linux/arm64`（若 GitHub Actions 构建链路可稳定支持则启用）

## Acceptance Criteria

- [ ] `docker compose up -d hub` 可成功启动 Hub，端口可访问。
- [ ] `docker compose run --rm cli-runner` 可作为前台常驻服务启动（`hapi runner start-sync`）。
- [ ] CLI 容器可通过 `HAPI_API_URL` + `CLI_API_TOKEN` 成功连 Hub 并创建会话。
- [ ] CLI 容器内 `claude --version` 可执行。
- [ ] 修改 `.env` 中 Hub 地址和 token 后，无需重建镜像即可生效。
- [ ] CI 至少可产出 `linux/amd64` 镜像；如 arm 构建稳定则同步产出 `linux/arm64`。

## Definition of Done

- 两个 Dockerfile 与 compose 资产可复现构建。
- 基础运行验证通过（Hub 启动、CLI 连通、runner 常驻）。
- 文档覆盖关键变量、默认值、配置示例、启动方式。
- 安全要求明确：真实 token 不进入镜像层。

## Technical Approach

### 1) 镜像分层

- `hapi-hub`：仅运行 `hapi hub`。
- `hapi-cli`：默认运行 `hapi runner start-sync`，同时允许覆盖 command 进入交互模式（`hapi`）。

### 2) 配置与持久化

- Hub：`HAPI_LISTEN_HOST/HAPI_LISTEN_PORT/HAPI_PUBLIC_URL/CLI_API_TOKEN/HAPI_HOME`
- CLI：`HAPI_API_URL/CLI_API_TOKEN/HAPI_HOME/HAPI_CLAUDE_PATH`
- 推荐通过 `.env` 注入连接参数，通过 volume 挂载持久化目录。

### 3) Claude Code 凭据策略

- 采用“目录挂载优先”方案（已确认）：
  - 挂载 Claude 登录态目录
  - 挂载 `~/.hapi`（或容器内 `HAPI_HOME`）
- 不将 Claude 凭据与 token bake 到镜像层。

### 4) Compose 服务形态

- `hub`：常驻
- `cli-runner`：常驻（默认）
- `cli`（可选 profile）：临时交互命令容器

### 5) CI 构建策略

- 使用 buildx 构建并推送镜像。
- 先保底 `linux/amd64`，再按可行性开启 `linux/arm64`。
- tag 策略：`<sha>` + `latest/main`。

## Decision (ADR-lite)

**Context**: 需要在“hub 可独立部署 + cli 可独立部署 + 配置便捷 + 可自动构建”之间取得平衡，并尽快交付可验证 MVP。
**Decision**: 选择 Approach A（双镜像 + Compose 编排）作为 MVP 基线；CLI 默认容器模式为 `runner start-sync`，并保留交互模式覆盖入口。
**Consequences**:
- 正向：职责清晰、部署边界明确、开箱即用，适合本地与测试环境。
- 代价：需要维护两份 Dockerfile + compose + CI 多平台构建逻辑。
- 后续：保留 K8s/多架构扩展位，但不纳入本次 MVP 范围。

## Out of Scope

- 一次性覆盖全部编排平台（K8s Helm、Terraform 等）。
- 生产级可观测性体系（Prometheus/Grafana/告警平台）。
- 自动化证书与公网网关完整方案。

## Technical Notes

### Repo facts (code-based)

- Hub 配置优先级与持久化：`hub/src/configuration.ts`
- Hub 入口：`hub/src/index.ts`
- CLI 连接变量：`cli/src/configuration.ts`
- Runner 前台模式可用：`cli/src/commands/runner.ts`（`start-sync`）
- Runner 信号处理（适配容器优雅退出）：`cli/src/runner/run.ts`
- 多平台发布线索：`.github/workflows/release.yml`, `cli/package.json`

## Implementation Plan (small PRs)

- **PR1: Docker 基础资产**
  - 新增 `Dockerfile.hub`、`Dockerfile.cli`、`.dockerignore`、`.env.example`
- **PR2: Compose 编排**
  - 新增 `docker-compose.yml`
  - Hub + cli-runner + 可选 cli 交互服务
- **PR3: CI 镜像构建**
  - 新增/更新 GitHub Actions：buildx 推送 `amd64`，条件开启 `arm64`
- **PR4: 文档与验收脚本**
  - 部署文档、环境变量说明、最小 smoke test 步骤
