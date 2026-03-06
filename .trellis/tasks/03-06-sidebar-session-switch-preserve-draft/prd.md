# brainstorm: 侧边栏切换保留输入草稿

## Goal

在会话列表（侧边栏）切换不同 session 时，保留每个 session 对应的输入框未发送内容，避免用户切换查看后草稿丢失，提升多会话并行沟通体验。

## What I already know

- 当前会话切换通过路由参数驱动：`/sessions/$sessionId`，点击侧边栏条目会直接 `navigate` 到目标会话（`web/src/router.tsx`）。
- 聊天页组件 `SessionPage` 会根据当前 `sessionId` 加载 `SessionChat`（`web/src/router.tsx`）。
- 输入框在 `HappyComposer` 中，实际文本来源是 assistant-ui 的 `composer.text`（`web/src/components/AssistantChat/HappyComposer.tsx`）。
- `SessionChat` 当前没有为 composer 建立按 session 分桶的 draft 恢复逻辑。
- 切换 session 时 `HappyThread` 使用了 `key={props.session.id}`，线程区域会按 session 重新挂载；composer 没有显式 key，但其状态来源的 runtime 会随会话变化。

## Assumptions (temporary)

- 目标是“会话级草稿保留”（A 会话输入不影响 B 会话）。
- MVP 已确认：草稿仅在当前页面生命周期内保留（不跨刷新持久化）。
- 仅文本草稿为 MVP 范围，附件草稿可后续扩展。

## Open Questions

- 暂无（MVP 范围已确认）。

## Requirements (evolving)

- 切换 session 后，返回原 session 时恢复该 session 未发送文本。
- 草稿隔离：每个 session 独立维护草稿。
- 发送成功后清空对应 session 草稿。
- 不改变现有消息发送、重试、权限控制行为。

## Acceptance Criteria (evolving)

- [ ] 在 A 会话输入文本但不发送，切到 B 再切回 A，文本仍存在。
- [ ] A/B 草稿互不串线。
- [ ] 在 A 发送消息后，A 的草稿清空。
- [ ] 不影响现有发送流程与输入补全行为。

## Definition of Done (team quality bar)

- Tests added/updated (unit/integration where appropriate)
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Out of Scope (explicit)

- 跨浏览器刷新/重启的永久草稿持久化（可作为后续增强）
- 附件草稿持久化
- 跨设备同步草稿

## Technical Notes

- 会话切换入口：`web/src/router.tsx`（`SessionList` 的 `onSelect -> navigate('/sessions/$sessionId')`）。
- 当前会话页：`web/src/router.tsx` 的 `SessionPage`，渲染 `SessionChat`。
- 输入组件：`web/src/components/AssistantChat/HappyComposer.tsx`，通过 `api.composer().setText` 与 `composerText` 同步。
- 推荐实现点：在 `SessionChat` 或更上层维护 `Map<sessionId, draftText>`，在 `session.id` 切换时执行“保存旧草稿 + 恢复新草稿”。

## Research Notes

### What similar tools do

- 多会话聊天产品通常采用“会话级草稿缓存”：每个 conversation/thread 一份未发送草稿。
- 切换会话时不自动清空输入，仅发送成功后清空，减少误丢失。
- MVP 常以内存 Map 实现，后续再接 localStorage。

### Constraints from our repo/project

- 现有输入受 assistant-ui runtime 管理，直接改受控输入层需谨慎，避免与 `composerText` 双向同步冲突。
- 路由驱动会话切换，天然有 `sessionId` 可作为草稿 key。

### Feasible approaches here

**Approach A: SessionPage/SessionChat 层维护 sessionDraftMap（Recommended）**

- How it works:
  - 在路由页（或 SessionChat）维护 `Map<string, string>`。
  - 监听 `session.id` 切换：离开前保存当前 `composer.text` 到旧 session；进入后读取新 session 草稿并 `api.composer().setText`。
  - 发送成功后清理当前 session 的 draft。
- Pros:
  - 与业务语义一致（按 session 管理）。
  - 对 `HappyComposer` 改动小，复用现有 `setText` 同步机制。
  - 便于后续扩展 storage 持久化。
- Cons:
  - 需要梳理“发送成功”时机与草稿清理触发点。

**Approach B: 在 HappyComposer 内引入基于 sessionId 的本地状态桶**

- How it works:
  - 传入 `sessionId`，composer 内部维护 `draftBySessionId`。
- Pros:
  - 输入逻辑集中在组件内部。
- Cons:
  - 组件职责膨胀；与 assistant-ui composer 状态可能出现双源一致性复杂度。

**Approach C: 仅通过 localStorage 做全局 draft 恢复**

- How it works:
  - 每次输入都写 storage，切换会话按 key 读取。
- Pros:
  - 顺带支持刷新恢复。
- Cons:
  - MVP 复杂度高（节流、版本、清理策略）；潜在隐私与过期管理问题。

## Decision (ADR-lite)

**Context**: 需要在最小改动下实现“切会话不丢草稿”，同时避免与现有 assistant-ui 输入状态冲突。

**Decision**: 采用 Approach A（会话容器层维护 session 草稿 Map）作为 MVP。

**Consequences**:
- 正向：实现路径短、语义清晰、风险可控。
- 代价：先不覆盖刷新持久化与附件草稿。
- 后续：可在 A 基础上扩展 localStorage 层（可配置开关与过期策略）。
