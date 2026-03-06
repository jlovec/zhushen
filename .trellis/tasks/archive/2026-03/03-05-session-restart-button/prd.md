# brainstorm: 会话页面支持重启会话按钮

## Goal

在会话页面增加“重启会话”能力，帮助用户在会话离线、异常或需要重新拉起 Agent 时，显式执行恢复/重连流程，并保证前后端状态一致、用户感知清晰。

## What I already know

- 旧任务 `02-27-cc-custom-command-completion` 已归档到 `.trellis/tasks/archive/2026-03/02-27-cc-custom-command-completion`。
- 现有前端已具备“自动恢复”能力：在会话 inactive 时发送消息会先调用 `resumeSession`。
- 会话核心状态由后端 `SessionCache` 维护，主要字段包括：`active`、`thinking`、`activeAt`、`updatedAt`、`agentState`、`permissionMode`、`modelMode`。
- SSE 会将 `session-updated/session-added/session-removed` 推送到前端，前端会做 query invalidation 与局部 patch。

## Current Session State Management (code reading summary)

### 1) 后端状态源与生命周期

- 会话持久化字段定义：`hub/src/store/types.ts`
  - `StoredSession.active/activeAt/updatedAt/agentState...`
- 运行态缓存与状态流转：`hub/src/sync/sessionCache.ts`
  - `handleSessionAlive`：将会话置为 active，更新 thinking/mode 并按节流发 `session-updated`。
  - `handleSessionEnd`：将 active/thinking 置 false，发 `session-updated`。
  - `expireInactive`：超时（30s）未活跃自动置 inactive。
- 对外编排：`hub/src/sync/syncEngine.ts`
  - `resumeSession(sessionId, namespace)`：
    1. 鉴权与存在性检查
    2. inactive 时基于 metadata 找 machine 与 resumeToken
    3. spawn 并等待 active
    4. 必要时 merge old/new session

### 2) 后端 API 能力

- 路由：`hub/src/web/routes/sessions.ts`
  - `POST /sessions/:id/resume`
  - `POST /sessions/:id/abort`
  - `POST /sessions/:id/archive`
  - 其中 `resume` 对 inactive 会话可用，返回 `sessionId`（可能变化）。

### 3) 前端会话数据与实时更新

- 类型：`web/src/types/api.ts`（`Session` 来自 protocol）
- 查询：
  - `useSession`：`web/src/hooks/queries/useSession.ts`
  - `useSessions`：`web/src/hooks/queries/useSessions.ts`
- SSE：`web/src/hooks/useSSE.ts`
  - 接收 `session-updated` 等事件后 patch/invalidate，会驱动 UI 状态刷新。

### 4) 前端会话页面行为

- 页面入口：`web/src/router.tsx` 的 `SessionPage`
- 发送消息逻辑：`web/src/hooks/mutations/useSendMessage.ts`
  - 当会话 inactive 时，先 `resolveSessionId -> api.resumeSession`，再发送。
- 聊天页面提示：`web/src/components/SessionChat.tsx`
  - inactive 时显示 “Session is inactive. Sending will resume it automatically.”
- 顶部菜单：`web/src/components/SessionHeader.tsx` + `SessionActionMenu.tsx`
  - 当前有 rename/archive/delete，无“重启会话”。

## Assumptions (temporary)

- “重启会话按钮”优先复用现有 `POST /sessions/:id/resume`。
- 已确认采用“智能策略”：
  - inactive：直接执行 resume
  - active：先执行 abort，再执行 resume
- 已确认本次范围提升为：会话列表操作体系全面重排（快捷栏 + 分组菜单 + 权限/状态态）。

## Open Questions

- 快捷栏在桌面端采用“hover 显示”还是“常驻显示（至少选中行常驻）”？

## Requirements (evolving)

- 在会话页面提供可点击的“重启会话”入口（位置待定）。
- 支持在会话列表中触发重启，减少依赖右键/长按菜单操作成本。
- 采用智能策略：inactive 直接 resume；active 先 abort 再 resume。
- 在 active 且存在进行中任务（thinking / pending permission）时，点击重启先弹出二次确认。
- 点击后触发统一恢复流程，并处理成功/失败反馈。
- 若返回新 `sessionId`，前端应正确导航与缓存迁移。
- 与现有自动恢复逻辑保持一致，不引入冲突。
## Acceptance Criteria (evolving)

- [ ] 用户在会话页可见“重启会话”操作入口。
- [ ] 用户在会话列表可通过低摩擦交互触发“重启会话”（无需右键/长按）。
- [ ] 点击后会话恢复成功时，UI 状态从 offline/inactive 切到 active。
- [ ] 恢复失败时，用户可见明确错误提示（含不可恢复场景）。
- [ ] 若 `resume` 返回新 sessionId，页面自动跳转且消息窗口状态一致。

## Definition of Done (team quality bar)

- Tests added/updated (unit/integration where appropriate)
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Out of Scope (explicit)

- 不做“全新会话模板化重启流程设计”（如复制上下文新开会话）。
- 不做多端协同冲突解决（仅保证本端行为正确）。
- 不改动底层 SSE 协议结构。

## Technical Notes

- 关键文件（已阅读）：
  - `hub/src/sync/sessionCache.ts`
  - `hub/src/sync/syncEngine.ts`
  - `hub/src/web/routes/sessions.ts`
  - `web/src/router.tsx`
  - `web/src/components/SessionChat.tsx`
  - `web/src/components/SessionHeader.tsx`
  - `web/src/components/SessionActionMenu.tsx`
  - `web/src/hooks/mutations/useSendMessage.ts`
  - `web/src/hooks/mutations/useSessionActions.ts`
  - `web/src/hooks/useSSE.ts`
  - `web/src/api/client.ts`
