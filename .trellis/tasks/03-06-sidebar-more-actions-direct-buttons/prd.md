# brainstorm: 侧边栏更多操作直达按钮方案

## Goal

将当前只能通过长按/右键触发的侧边栏“更多操作”，升级为在会话列表项可直接点击的显式操作入口，提升可发现性与操作效率；并保持现有菜单入口兼容。

## What I already know

- 用户痛点：侧边栏更多操作需要长按/右键，发现成本高。
- 用户目标：在侧边列表直接支持“归档 / 重命名 / 删除”等按钮。
- 当前代码现状：
  - 会话列表项通过 `useLongPress` 同时支持长按与右键打开菜单：`web/src/components/SessionList.tsx:186`、`web/src/hooks/useLongPress.ts:22`
  - 现有更多菜单组件为 `SessionActionMenu`，目前实际渲染项为：重命名、归档（仅 active）、删除（仅 inactive）：`web/src/components/SessionActionMenu.tsx:93`
  - 动作 API 统一在 `useSessionActions`：`archiveSession / renameSession / deleteSession`，并含 `abort/switch/setPermissionMode/setModelMode`：`web/src/hooks/mutations/useSessionActions.ts:9`
  - 顶部 SessionHeader 也复用同一菜单：`web/src/components/SessionHeader.tsx:177`
  - i18n 中存在 `session.action.copy`，但当前菜单未使用：`web/src/lib/locales/zh-CN.ts:66`

## Assumptions (temporary)

- “更多操作”应保持单一动作源，避免列表直达按钮和菜单逻辑分叉。
- 长按/右键作为补充入口保留，避免打断现有触屏与桌面习惯。
- 删除与归档属于危险动作，需要继续使用确认弹窗。

## Open Questions

- 暂无（已完成当前 MVP 关键偏好确认）。

## Requirements (evolving)

- 在侧边栏列表项新增“直达操作区”，默认支持且仅支持 3 个高频动作：重命名、归档、删除（归档/删除按会话状态互斥显示）。
- 直达按钮采用“始终显示”策略（桌面与触屏一致），不依赖 hover 或选中态。
- 直达按钮形态为“仅图标”，并与项目现有图标风格一致（24x24 viewBox、stroke=currentColor、round linecap/linejoin、统一 strokeWidth）。
- 保持长按/右键菜单可用，且动作行为一致。
- 动作能力分层：
  - L1 高频直达：重命名、归档/删除（按状态切换）
  - L2 次级菜单：低频或易误触动作
  - L3 危险动作：二次确认后执行
- 保持桌面与触屏可用性：
  - 桌面支持键盘焦点可触达
  - 触屏可直接点击，不依赖长按
- 保持可访问性：键盘可触达、aria 标签、focus ring。

## Acceptance Criteria (evolving)

- [ ] 用户无需长按/右键，可直接触发归档/重命名/删除。
- [ ] 长按/右键菜单仍可打开，且与直达按钮动作一致。
- [ ] active 会话不显示“删除直达”，inactive 会话不显示“归档直达”（与当前业务一致）。
- [ ] 删除/归档仍需确认弹窗。
- [ ] 桌面鼠标与触屏交互均可完成核心操作。

## Definition of Done (team quality bar)

- 流程级测试覆盖：重命名、归档、删除、菜单兼容。
- Lint / typecheck / CI 通过。
- 文案与交互说明更新。
- 误触风险有防护（显隐策略 + 确认弹窗）。

## Research Notes

### What similar tools do

- 侧边栏高频动作一般采用“行内轻量按钮 + 更多菜单”双层结构。
- 危险操作通常放在末位、红色样式、并强制二次确认。
- 触屏端常通过“选中后显示操作条”降低误触。

### Constraints from our repo/project

- 当前已有统一动作 hook，可复用，避免业务重复。
- 当前已有确认弹窗与重命名弹窗，无需新增后端契约。
- 会话列表项信息密度已经较高，需要控制新增按钮数量。

### Feasible approaches here

**Approach A: 行内固定 2~3 个图标按钮 + 保留更多菜单（Recommended）**

- How it works: 列表项右侧新增操作按钮（重命名、归档/删除），其余动作留在更多菜单。
- Pros: 可发现性最高，学习成本低，改造范围可控。
- Cons: 视觉密度增加，需要处理窄屏折叠。

**Approach B: 仅显示一个“…”按钮（非右键），点击弹出菜单**

- How it works: 不展示多个直达按钮，只提供显式更多按钮。
- Pros: UI 改动小，误触低。
- Cons: 仍是二级操作，不完全满足“直接按钮”诉求。

**Approach C: 滑动/选中后显示底部操作条（触屏优先）**

- How it works: 选中条目后出现操作条。
- Pros: 触屏体验好，误触低。
- Cons: 桌面一致性较弱，实现和教育成本更高。

## Technical Approach

- 抽象 `SessionPrimaryActions`（新组件）承载直达按钮，只负责触发已有 action 回调。
- `SessionList` 负责控制显隐策略和状态条件（active/inactive）。
- `SessionActionMenu` 保留为完整动作兜底入口，并与直达按钮共享同一回调。
- 第一阶段不新增后端接口，仅复用现有 `useSessionActions`。

## Decision (ADR-lite)

**Context**: 目标是提升可发现性且不破坏既有交互。
**Decision**: 先采用 Approach A（行内直达 + 更多菜单并存）作为 MVP。
**Consequences**:
- 正向：高频操作一步到位，用户学习成本最低。
- 代价：列表项空间更紧，需要响应式与可访问性细化。
- 后续：可按数据反馈再演进为“自定义动作/可配置显隐”。

## Out of Scope

- 重做整套侧边栏视觉语言。
- 一次性开放全部低频高级动作到列表直达。
- 修改后端会话 API。

## Technical Notes

- 关键文件：
  - `web/src/components/SessionList.tsx`
  - `web/src/components/SessionActionMenu.tsx`
  - `web/src/hooks/useLongPress.ts`
  - `web/src/hooks/mutations/useSessionActions.ts`
  - `web/src/lib/locales/en.ts`
  - `web/src/lib/locales/zh-CN.ts`
- 兼容策略：保留长按/右键；新增显式入口仅增强不替代。
