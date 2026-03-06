# 回退按钮触发 Claude Code Esc Esc（Brainstorm）

## Goal

在 Terminal 页面将顶部“回退按钮”改为发送 `Esc Esc`（`\u001b\u001b`）到 Claude Code 会话，用于快速取消/退出当前交互状态，并设计清晰、可恢复的页面交互，避免误触与“无法返回页面”。

## What I already know

- 用户已确认方案：**选项 1（回退按钮直接触发 Esc Esc）**。
- Terminal 顶部回退按钮当前绑定 `goBack`：`web/src/routes/sessions/terminal.tsx:414`。
- 终端输入链路已存在，快捷键通过 `handleQuickInput -> dispatchSequence -> write` 写入 PTY：`web/src/routes/sessions/terminal.tsx:369`、`web/src/routes/sessions/terminal.tsx:242`。
- 现有 quick input 已有单个 `Esc`，可复用同一输入路径扩展为双 Esc：`web/src/routes/sessions/terminal.tsx:94`。
- `quickInputDisabled = !session?.active || terminalState.status !== 'connected'` 已定义可交互状态：`web/src/routes/sessions/terminal.tsx:326`。
- `useAppGoBack` 负责页面路由回退，不适合承载终端控制语义：`web/src/hooks/useAppGoBack.ts:4`。

## Research Notes

### Claude Code / terminal 行为结论（基于仓库约束）

- HAPI 对 Claude Code 的终端控制是**字节透传**模型：Web 侧写入序列，后端/PTY 转发，不在 Web 层解释 Claude 内部状态。
- 仓库内没有“Esc Esc 专用协议”或“Claude 内部状态 API”；因此最稳妥做法是发送标准序列 `\u001b\u001b`。
- 交互质量应通过 UI 反馈与可恢复路径保障，而不是猜测 Claude 内部 mode。

### Feasible approaches here

**Approach A: 直接发送双 Esc + 轻反馈（Recommended）**
- How: 点击回退按钮即发送 `\u001b\u001b`，并短暂提示“Sent Esc Esc”。
- Pros: 实现简单、语义直接、与现有输入链路一致。
- Cons: 用户可能不清楚如何离开 terminal 页面（导航入口需补齐）。

**Approach B: 发送双 Esc + 长按才导航返回**
- How: 单击发送 `Esc Esc`，长按触发页面返回。
- Pros: 兼顾“回退=Esc Esc”与“可返回页面”。
- Cons: 学习成本略高，需要明确文案提示。

**Approach C: 发送双 Esc + 额外显式关闭入口**
- How: 回退按钮专注 `Esc Esc`；另放置明确“Close Terminal”按钮。
- Pros: 语义清晰，误触成本低。
- Cons: UI 占位增加，需设计视觉层级。

## Requirements (evolving)

- 顶部回退按钮点击发送 `Esc Esc` 到终端（不执行路由回退）。
- 发送路径复用 `dispatchSequence`，保证与 Ctrl/Alt 修饰态逻辑兼容。
- 在 `quickInputDisabled` 时禁用该行为，避免无效写入。
- 提供最小可感知反馈（例如短暂提示）说明已发送 `Esc Esc`。
- 必须保留“离开 terminal 页面”的可达入口（具体形式待确认）。

## Acceptance Criteria (evolving)

- [ ] `session.active=true` 且 `terminalState=connected` 时，点击顶部回退按钮可写入 `\u001b\u001b`。
- [ ] `quickInputDisabled=true` 时，不发送 `Esc Esc`，按钮状态与反馈符合设计。
- [ ] 用户在不依赖浏览器物理返回键的前提下，仍可从 terminal 页面返回上级页面。
- [ ] 新增/更新测试覆盖“点击回退按钮发送双 Esc”的关键路径。

## Definition of Done (team quality bar)

- Tests added/updated (unit/integration where appropriate)
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Decision (ADR-lite)

**Context**: 用户明确要求“支持回退按钮，底层调用 Claude Code 的 esc esc 功能”。

**Decision**: 采用“顶部回退按钮默认发送 `Esc Esc`”作为主行为（选项 1）。

**Consequences**:
- 正向：行为与用户目标完全一致，链路复用现有 terminal 输入机制。
- 风险：原本路由返回能力从该按钮移除，若无补充入口会影响页面可退出性。
- 后续：需要在本次设计中补充明确的页面退出交互。

## Out of Scope (explicit)

- 修改 CLI/Hub 协议层。
- 引入新的后端 API 来感知 Claude 内部 mode。
- 猜测或硬编码 Claude Code 的私有状态机。

## Technical Notes

- 相关文件：
  - `web/src/routes/sessions/terminal.tsx`
  - `web/src/hooks/useAppGoBack.ts`
  - `web/src/routes/sessions/terminal.test.tsx`
- 关键约束：
  - 当前 back 按钮被重定义后，必须补齐页面返回通道。
  - 交互需兼顾移动端（含触摸）与桌面端一致性。
