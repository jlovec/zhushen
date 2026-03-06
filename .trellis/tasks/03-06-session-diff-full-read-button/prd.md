# brainstorm: 会话 diff 文件完整阅读按钮

## Goal

在会话中的工具调用展示里，当前 Edit/MultiEdit/CodexDiff 主要展示的是变更片段（diff），人工 review 时无法快速查看该文件完整内容。目标是在文件路径附近提供一个“完整阅读文件”入口，让用户能一键查看完整文件内容，提高 review 效率与准确性。

## What I already know

- 用户诉求：在文件路径上增加按钮，支持完整阅读该文件，而不是只看 Edit tool 参数里的 old/new diff。
- 当前 diff 预览/展示由 `DiffView` 负责：`web/src/components/DiffView.tsx:8`。
- `Edit` 工具输入渲染会调用 `DiffView` 并传 `filePath`：`web/src/components/ToolCard/ToolCard.tsx:122`。
- `MultiEdit` 工具也会为每个 edit 渲染 `DiffView`：`web/src/components/ToolCard/ToolCard.tsx:158`。
- `CodexDiff` 的 full/compact 视图同样通过 `DiffView` 承载并可带文件名：`web/src/components/ToolCard/views/CodexDiffView.tsx:57`。
- `Read` 工具结果已经有文件内容展示组件（`ReadResultView`），能展示文件内容 code block：`web/src/components/ToolCard/views/_results.tsx:342`。

## Assumptions (temporary)

- 可以通过新增 UI 交互触发一次 Read 工具（或复用已有后端读取接口）来拉取文件全文。
- 文件路径在当前会话上下文中可解析（相对路径 + metadata 或绝对路径）。
- 完整阅读能力仅面向本地可读文件，不涉及远端下载。

## Open Questions

- （当前无阻塞问题）

## Requirements (evolving)

- 在存在 `filePath` 的 diff 头部区域显示“完整阅读文件”入口。
- 点击后能看到该路径对应的完整文件文本。
- MVP 展示范围：**仅在 Diff 展开弹窗中**提供完整阅读（不做卡片内联预览）。
- 失败时给出明确错误提示（如文件不存在、权限不足、路径无效）。
- 不破坏现有 diff 预览与展开行为。

## Acceptance Criteria (evolving)

- [ ] Edit 卡片中，存在 `file_path` 时可点击“完整阅读文件”。
- [ ] MultiEdit 卡片中，每个 diff 可触发并查看同一路径文件全文。
- [ ] CodexDiff（含 full/compact）在可解析文件名时支持完整阅读。
- [ ] 文件读取失败时有可见错误文案。
- [ ] 现有 diff 展示（统计、展开弹窗、颜色）行为不回归。

## Definition of Done (team quality bar)

- Tests added/updated (unit/integration where appropriate)
- Lint / typecheck / CI green
- Docs/notes updated if behavior changes
- Rollout/rollback considered if risky

## Technical Approach

采用 **Approach A**：在 `DiffView` 文件路径头部增加“完整阅读文件”按钮；点击后在同一阅读容器中展示文件全文（避免跳转）。

实现思路（MVP 草案）：
- 在 `DiffView` 中增加全文读取入口与状态（idle/loading/success/error）。
- 基于 `filePath` 触发读取，并按 `filePath` 进行轻量缓存，减少重复读取。
- 在现有 diff 对话框内增加“Diff / Full File”切换（或等价的单容器切换交互）。
- 读取失败时在全文区域展示错误文案，不影响 diff 继续查看。

## Decision (ADR-lite)

**Context**: 当前 Edit/MultiEdit/CodexDiff 均以 diff 为主，人工 review 缺少同位的全文阅读能力。

**Decision**: 选择 Approach A，在共享的 `DiffView` 组件统一增加“完整阅读文件”入口。

**Consequences**:
- 正向：一次改动可覆盖 Edit/MultiEdit/CodexDiff，交互一致、复用高。
- 代价：`DiffView` 职责变重，需要控制边界（仅增加只读能力，不引入编辑能力）。
- 风险：路径解析失败与读取失败，需要稳定错误提示和回退行为。

- 候选改动点：
  - `web/src/components/DiffView.tsx`
  - `web/src/components/ToolCard/ToolCard.tsx`
  - `web/src/components/ToolCard/views/CodexDiffView.tsx`
  - `web/src/components/ToolCard/views/_results.tsx`（可复用 ReadResultView 的展示样式）
- 可能需要新增轻量数据流：从 UI 层触发读取并缓存每个 `filePath` 的内容（避免重复读取）。

## Research Notes

### What similar tools do

- 常见做法是“Diff + Open file/View full file”双入口：diff用于快速扫改动，全文用于上下文验证。
- 主入口通常放在文件路径旁，避免用户在工具卡片间来回跳转。

### Constraints from our repo/project

- 当前 `DiffView` 已是 Edit/MultiEdit/CodexDiff 的共享渲染核心，适合做统一入口。
- `ReadResultView` 已有现成全文渲染样式，可借鉴其显示策略。

### Feasible approaches here

**Approach A: 在 DiffView 文件头增加“完整阅读”按钮（Recommended）**

- How it works:
  - `DiffView` 接收可选回调或服务，用 `filePath` 触发读取。
  - 在同一个 Dialog 内新增 Tab/折叠区显示“Diff / Full File”。
- Pros:
  - 统一覆盖 Edit/MultiEdit/CodexDiff，复用率高。
  - 用户心智一致，入口位置固定。
- Cons:
  - `DiffView` 职责变重，需要注意组件边界。

**Approach B: 在 ToolCard 层针对 Edit/MultiEdit/CodexDiff 注入“阅读全文”按钮**

- How it works:
  - 保持 `DiffView` 纯展示，在 ToolCard 外层管理读取状态和弹窗。
- Pros:
  - 组件职责更清晰。
- Cons:
  - 逻辑分散，三类工具需要重复接线。

**Approach C: 点击后生成/跳转到 Read 工具结果视图**

- How it works:
  - 把“完整阅读”映射为一次 Read 操作，在结果区复用 `ReadResultView`。
- Pros:
  - 与现有 Read 结果体验一致。
- Cons:
  - 交互链路更长，用户可能在会话流中“跳位置”。
