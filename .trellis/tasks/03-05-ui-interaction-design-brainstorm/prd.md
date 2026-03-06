# brainstorm: 产品思维下的功能性设计

> [作废声明｜2026-03-06]
> 主人已明确驳回此前全部脑暴结论：视为无效，不进入后续决策与实现。
> 从本段开始，按“角色独立思考 + 子任务化 + 基于代码事实 + 可反驳”全新重建。

## Goal

从产品经理视角重新定义 Hapi Web 的功能方向：聚焦“任务完成”而非“界面优化”，形成可执行的功能设计方案（含优先级、验收标准、阶段路线），用于后续研发排期与迭代。

## What I already know

- 主人明确要求：忘记之前表达方式，重新基于产品角色与产品思维思考。
- 当前系统已具备：会话列表、会话创建、聊天、工具调用、权限确认、文件页、终端页、设置页、全局状态提示。
- 现阶段需要的是“功能级方案”，不是单纯视觉细节优化。

## Assumptions (temporary)

- 我们本轮输出应优先定义“用户价值链路 + 功能机制 + 指标”，而不是 UI polish。
- 优先推进能显著提升任务完成率和恢复能力的能力模块。

## Open Questions

- MVP 第一优先是：提升任务完成效率，还是提升故障恢复能力？

## Requirements (evolving)

- 用产品语言描述核心用户任务（JTBD）与目标指标。
- 产出 3~5 个功能模块级方案（每个含价值、成本、风险）。
- 提供 MVP 范围与阶段路线图（Quick Win / 中期 / 长期）。
- 明确可衡量的验收标准（行为与结果指标）。

## Acceptance Criteria (evolving)

- [ ] 有清晰的北极星目标与 2-3 个配套指标
- [ ] 有明确的 MVP 功能边界（包含/不包含）
- [ ] 每个建议都能映射到具体用户问题与价值
- [ ] 提供可执行的分阶段推进路线

## Definition of Done (team quality bar)

- 方案可直接转为工程任务（Epic/Story）
- 优先级明确（P0/P1/P2）
- 验收标准可被数据与行为验证

## Out of Scope (explicit)

- 直接开始编码实现
- 一次性重构全部交互架构
- 品牌视觉重设计

## Technical Notes

### 产品问题框架（初稿）

1. 用户不是在“发消息”，而是在“推进任务”。
2. 当前关键风险在于：
   - 会话多但缺乏任务导向（下一步不明确）
   - 失败恢复链路不统一（可恢复性不稳定）
   - 跨会话管理效率不足（检索/筛选/优先级）

### 候选功能方向（待收敛）

- 方向 A：任务驱动会话（目标、阶段、下一步动作）
- 方向 B：故障恢复中心（统一失败态 + 标准恢复动作）
- 方向 C：会话工作台（搜索/筛选/行动信号）
- 方向 D：输入建议产品化（场景推荐动作/命令）

## Research Notes

### What similar tools do

- 将“对话”包装为“工作流阶段”，降低用户决策成本。
- 强调失败可恢复与状态可见，避免用户在长链路中迷失。

### Constraints from our repo/project

- 已有会话、状态、工具反馈基础能力，可做增量演进。
- 当前适合分阶段交付，不适合一次性重构。

### Feasible approaches here

**Approach A: 任务效率优先（Recommended）**

- How it works:
  - 先做任务导向与会话工作台能力
  - 次级补强失败恢复
- Pros:
  - 对日常使用效率提升最直接
- Cons:
  - 故障体验改善节奏稍慢

**Approach B: 恢复可靠性优先**

- How it works:
  - 先统一失败态与恢复路径
  - 再做任务效率增强
- Pros:
  - 系统韧性提升快，降低挫败感
- Cons:
  - 对高频效率提升不如 A 直观

**Approach C: 双轨并行（小步）**

- How it works:
  - 每个迭代同时交付 1 个效率能力 + 1 个恢复能力
- Pros:
  - 体验提升更均衡
- Cons:
  - 产品与工程协同复杂度更高

## Multi-role Brainstorm Iterations (code-fact based)

### Round 1 - 角色并行发散

#### 角色A：产品经理
- 事实证据：
  - 权限审批闭环已存在（approve/deny 后 refresh）：`web/src/components/SessionChat.tsx:62-69`
  - 会话 inactive 有提示且允许继续发送：`web/src/components/SessionChat.tsx:264-282`
  - Chat / Files / Terminal 主链路已打通：`web/src/router.tsx:413-433`
- 机会结论：把“待审批处理 + 恢复状态”从隐式机制升级为显式任务流。

#### 角色B：创意产品经理
- 事实证据：
  - 列表已展示 pending/todo/progress：`web/src/components/SessionList.tsx:229-265`
  - 线程已支持 load-more、pending flush、重试：`web/src/components/AssistantChat/HappyThread.tsx`
  - 会话内已可跳 files/terminal：`web/src/components/SessionChat.tsx:230-243`
- 创意方向：
  1) 审批收件箱（按待审批聚焦）
  2) 会话恢复助手（离开后快速续跑）
  3) 会话驾驶舱（Chat/File/Terminal 三联动作）

#### 角色C：UI设计师
- 事实证据：
  - 会话页在小屏为列表/详情互斥：`web/src/router.tsx:117,167`
  - 列表默认折叠非活跃组：`web/src/components/SessionList.tsx:333-337`
  - 长按 500ms 才出现菜单：`web/src/components/SessionList.tsx:186-198`
- 交互痛点：移动端切换中断、恢复状态感知弱、操作可发现性不足。

#### 角色D：资深架构师
- 事实证据：
  - 技术栈明确：React + Router + Query：`web/src/main.tsx`
  - SessionChat 已有 runtime/attachment/voice 集成点：`web/src/components/SessionChat.tsx`
  - files/terminal/settings 路由稳定：`web/src/router.tsx:413-495`
- 架构结论：适合增量改造，不建议大重构；按 PR1/PR2/PR3 分层推进。

#### 角色E：用户代表
- 事实证据：
  - 任务链路可走通：列表定位 → 聊天执行 → 文件/终端验证
  - 阻塞点集中在恢复链路：inactive、权限等待、长会话历史加载
  - 恢复动作已有基础能力：resume/retry/load-more/approve-deny
- 用户表达：希望“受阻后能无缝继续”，而不是重新组织上下文。

### Round 2 - 交叉收敛（每角色二轮）

#### 产品经理（二轮）
- 收敛优先级：
  - P0：审批处理闭环可视化（发现→处理→回落）
  - P1：inactive 恢复过程态（恢复中/成功/失败）
  - P2：跨视图连续性（chat↔files↔terminal）

#### 创意产品经理（二轮）
- 创意收敛：
  - 方案1（优先）：审批收件箱
  - 方案2（次优先）：会话恢复条（离开期间新增消息/待处理）
- 风险兜底：动作后统一 refresh，优先保证状态一致性。

#### UI设计师（二轮）
- 关键流程草图：
  1) 移动端会话切换后保持定位与分组展开状态
  2) inactive 发送时过程态连续反馈
  3) 管理动作可发现但不破坏现有信息架构

#### 资深架构师（二轮）
- 实施切片：
  - PR1：路由与入口层（导航与任务入口）
  - PR2：会话中枢层（审批/恢复状态机）
  - PR3：垂直页面衔接（files/terminal 验证与指标）

#### 用户代表（二轮）
- 价值排序：
  - 必须：恢复与审批不阻断任务
  - 应该：列表可快速决策（pending/thinking/progress）
  - 可以：语音/自动补全做效率增强

## Candidate MVP (updated)

### P0（必须）
- 审批处理闭环可视化（会话列表聚焦待审批 + 会话内处理回落）
- inactive 恢复过程态（恢复中/成功/失败）

### P1（应该）
- 会话恢复助手（离开期间新增摘要 + 一键续跑）
- 跨视图任务连续性（chat→files/terminal→chat 无损返回）

### P2（可以）
- 会话驾驶舱（三联快捷动作）
- 更高阶批处理（审批批处理/规则化）

### KPI（草案）
- 任务完成率（24h 内完成目标任务）
- 失败恢复率（受阻后继续推进成功）
- 审批处理时延（从出现到完成）
- 跨视图往返后继续率（返回后继续发送/执行）

## Multi-role Brainstorm Iterations (Subtask Mode, Round-based)

> 规则对齐：每轮一个新子任务；角色乱序发言；每个角色至少 3 轮；每个角色至少 1 次反驳；全部发言基于代码事实。

### Round 3（发散轮）

#### Subtask R3-S1｜创意产品经理
- 主张：做「审批收件箱 + 会话内回落」，把 pending 从“标签信息”升级为“可执行入口”。
- 事实：会话项已展示 pending 数（`web/src/components/SessionList.tsx:240-243`）；会话内有 approve/deny 且动作后 refresh（`web/src/components/SessionChat.tsx:62-69`）。

#### Subtask R3-S2｜用户代表
- 主张：优先保证“受阻后不用重来”。
- 事实：inactive 会提示可自动恢复（`web/src/components/SessionChat.tsx:277-281`）；发送前会走 resumeSession（`web/src/router.tsx:210-216`）。

#### Subtask R3-S3｜资深架构师
- 主张：维持增量式，先路由入口再中枢状态。
- 事实：files/terminal 路由稳定挂在 session detail 下（`web/src/router.tsx:413-433`）；chat 内可直接跳 files/terminal（`web/src/components/SessionChat.tsx:231-243`）。

#### Subtask R3-S4｜逻辑分析导师
- 主张：先定义因果链指标，否则功能价值不可证。
- 事实：当前已有 pendingCount、todoProgress、thinking 三种行为信号（`web/src/components/SessionList.tsx:225-243`）。

#### Subtask R3-S5｜产品经理（反驳）
- 反驳对象：创意产品经理
- 观点：仅做收件箱不够，必须补“恢复过程态”，否则用户仍不确定系统状态。
- 事实：目前只有静态提示“will resume automatically”（`web/src/components/SessionChat.tsx:280`），缺少恢复中/成功/失败三态。

#### Subtask R3-S6｜UI 设计师
- 主张：移动端先解决“列表/详情互斥导致切换丢上下文”。
- 事实：sessions index 时显示列表、详情隐藏；进入会话后反过来（`web/src/router.tsx:117,167`）。

#### Subtask R3-S7｜产品经理
- 主张：MVP 北极星先定为“任务继续率”，不是“视觉满意度”。
- 事实：已有 flushPending 与 pendingCount 机制，可直接观察恢复后的继续行为（`web/src/router.tsx:200,203`）。

### Round 4（交叉反驳轮）

#### Subtask R4-S1｜资深架构师（反驳）
- 反驳对象：UI 设计师
- 观点：先不重做移动信息架构；优先加“状态桥接”而不是页面重排。
- 事实：现有结构依赖 tanstack 路由层级，改动信息架构影响面大（`web/src/router.tsx:483-495`）。

#### Subtask R4-S2｜用户代表（反驳）
- 反驳对象：资深架构师
- 观点：若不处理移动端可发现性，用户仍找不到关键动作，效率提升有限。
- 事实：会话管理菜单依赖长按 500ms，发现成本高（`web/src/components/SessionList.tsx:186-198`）。

#### Subtask R4-S3｜创意产品经理（反驳）
- 反驳对象：产品经理
- 观点：只看“继续率”会误导，应该同时看“审批处理时延”。
- 事实：pending 已是显性阻塞信号（`web/src/components/SessionList.tsx:240-243`），可直接作为流程时延切点。

#### Subtask R4-S4｜逻辑分析导师（反驳）
- 反驳对象：创意产品经理
- 观点：审批时延是过程指标，不能替代结果指标；要绑定任务完成率。
- 事实：会话有 thinking 与 todo 进度（`web/src/components/SessionList.tsx:225-237`），可构建“过程→结果”漏斗。

#### Subtask R4-S5｜UI 设计师（反驳）
- 反驳对象：资深架构师
- 观点：不一定重构，只需在现有列表与会话头部增加“恢复条/待办入口”即可。
- 事实：列表和会话头部均有可插入区域，不必变更路由（`web/src/router.tsx:120-141`, `web/src/components/SessionChat.tsx:269-276`）。

#### Subtask R4-S6｜产品经理
- 主张：定义 P0 为“审批闭环可见 + 恢复三态”，P1 才做跨页效率增强。
- 事实：approve/deny 后 refresh 机制已在位（`web/src/components/SessionChat.tsx:62-69`），可低成本落地 P0。

#### Subtask R4-S7｜资深架构师
- 主张：技术切片采用 PR1(入口)/PR2(状态)/PR3(指标)
- 事实：SessionPage 已集中聚合 useSession/useMessages/useSendMessage（`web/src/router.tsx:188-209`），适合分层切。

### Round 5（收敛轮）

#### Subtask R5-S1｜逻辑分析导师
- 主张：MVP 验收必须 Good/Base/Bad 三档。
- 事实：load more 失败已有错误日志分支（`web/src/components/AssistantChat/HappyThread.tsx:201-205`），可直接定义 Bad case。

#### Subtask R5-S2｜用户代表
- 主张：我要“一键回到可继续状态”，而不是自己判断下一步。
- 事实：已有 NewMessagesIndicator + pendingCount 可作为恢复入口信号（`web/src/components/AssistantChat/HappyThread.tsx:335`）。

#### Subtask R5-S3｜创意产品经理
- 主张：加“会话恢复助手卡片”：显示离开期间新增消息、待审批数、建议动作。
- 事实：系统已有 pendingCount、messagesVersion、onFlushPending（`web/src/components/SessionChat.tsx:295-306`）。

#### Subtask R5-S4｜UI 设计师
- 主张：恢复助手做成轻量条，不引入新主页面。
- 事实：当前 thread 顶部已有告警/加载区，适合作为插槽（`web/src/components/AssistantChat/HappyThread.tsx:289-297`）。

#### Subtask R5-S5｜产品经理（反驳）
- 反驳对象：创意产品经理
- 观点：恢复助手先不做“建议动作智能化”，MVP 只做确定性动作，避免过度设计。
- 原则：YAGNI，先验证恢复效率提升再扩展。

#### Subtask R5-S6｜资深架构师（反驳）
- 反驳对象：用户代表
- 观点：一键恢复可以做，但必须保留失败回退路径。
- 事实：resumeSession 已有失败 toast 分支（`web/src/router.tsx:217-224`），可作为回退标准。

#### Subtask R5-S7｜逻辑分析导师（反驳）
- 反驳对象：产品经理
- 观点：仅 YAGNI 不够，需加“最小可观测性”，否则无法判断是否有效。
- 结论：P0 至少埋点 4 个事件（进入待审批、审批完成、恢复触发、恢复失败）。

## Converged Valuable Requirements (from multi-role rounds)

### P0 (MVP)
- 审批闭环可见化：列表聚焦待审批 + 会话内处理后状态回落。
- inactive 恢复三态：恢复中 / 成功 / 失败（含失败回退动作）。
- 恢复入口轻量化：在现有 thread/list 插槽提供可继续入口，不新开主页面。
- 最小可观测性：恢复与审批 4 个关键事件埋点。

### P1
- 会话恢复助手卡片（新增摘要 + 建议下一步）。
- chat/files/terminal 往返连续性增强（返回即定位可继续点）。

### P2
- 审批批处理与规则化。
- 更高阶任务驾驶舱（跨会话调度）。

## Open Question (single, preference)
- 主人已确认：本轮不收敛 MVP，继续做拓展型头脑风暴。
- 下一步优先拓展哪一类交互方向？
  - A. 跨会话编排与任务调度（宏观效率）
  - B. 人机协作与可控自动化（执行体验）
  - C. 团队协同与可追溯性（协作质量）

## Multi-role Brainstorm Iterations (Round 6-8, unconstrained expansion)

> 说明：继续采用“每轮一个子任务、角色乱序、基于代码事实、含反驳”的方式，聚焦功能交互创新。

### Round 6（跨会话与系统级编排）

#### Subtask R6-S1｜逻辑分析导师
- 主张：从“单会话优化”升级到“任务网络管理”，建立跨会话依赖图。
- 事实：会话已按目录分组且可识别活动会话（`web/src/components/SessionList.tsx:28-51,333-337`）。
- 机会：把目录分组升级为“任务域”，支持阻塞链与优先级传播。

#### Subtask R6-S2｜资深架构师
- 主张：做“会话编排层”而非重写聊天层。
- 事实：路由已稳定分层（chat/files/terminal/settings）（`web/src/router.tsx:413-495`）。
- 方案：新增 orchestration state（轻状态层）挂在 SessionPage 上方。

#### Subtask R6-S3｜用户
- 主张：我要“今天要推进什么”而不是“选哪个会话”。
- 事实：列表已有 thinking/todoProgress/pending 信号（`web/src/components/SessionList.tsx:225-243`）。
- 需求：生成「今日推进面板」：Top 阻塞、Top 可完成、Top 风险。

#### Subtask R6-S4｜创意产品经理
- 主张：引入“任务导演模式”（Director Mode）。
- 事实：会话内可跳 files/terminal，具备执行验证链路（`web/src/components/SessionChat.tsx:231-243`）。
- 交互：用户给目标，系统自动分配到合适会话并给下一步动作建议。

#### Subtask R6-S5｜UI 设计师（反驳）
- 反驳对象：创意产品经理
- 观点：导演模式不能变成黑盒，必须可解释。
- 事实：当前已有可见状态提示与消息流基础（`web/src/components/AssistantChat/HappyThread.tsx:72-95,335`）。
- 要求：每次“自动分配”都显示依据（阻塞、上下文匹配、最近活动）。

#### Subtask R6-S6｜产品经理
- 主张：定义一个新北极星：跨会话任务吞吐量（每用户/日完成关键步骤数）。
- 事实：现有信号足够构建漏斗（pending→处理→继续→完成）。

#### Subtask R6-S7｜资深架构师（反驳）
- 反驳对象：产品经理
- 观点：吞吐量必须配套“返工率”，否则会激励错误行为。
- 事实：已有 load/retry/error 分支可统计返工（`web/src/components/AssistantChat/HappyThread.tsx:195-205`）。

### Round 7（人机协作与可控自动化）

#### Subtask R7-S1｜创意产品经理
- 主张：做“可回放执行剧本”（Playbook Replay）。
- 事实：存在明确动作节点：approve/deny、send、view files、open terminal。
- 交互：把一次成功推进链路保存为剧本，下次一键复用。

#### Subtask R7-S2｜产品经理
- 主张：自动化能力按风险分级：L0 建议、L1 半自动、L2 需双确认。
- 事实：权限确认机制已存在，可承载分级确认。
- 价值：减少确认疲劳，同时维持安全边界。

#### Subtask R7-S3｜逻辑分析导师（反驳）
- 反驳对象：产品经理
- 观点：风险分级必须绑定失败后果矩阵，不可只按动作类型。
- 事实：inactive resume 与 loadMore failure 已体现不同失败代价（`web/src/router.tsx:215-224`; `web/src/components/AssistantChat/HappyThread.tsx:195-205`）。
- 要求：按“可逆性、影响面、恢复成本”三维定级。

#### Subtask R7-S4｜用户
- 主张：我要“最后安全点”（Checkpoint），失败后回到可继续状态。
- 事实：现有恢复能力分散在 resume/retry/flush。
- 需求：统一「回到最近可继续点」按钮。

#### Subtask R7-S5｜UI 设计师
- 主张：引入“操作时间线 + 分叉点”交互。
- 事实：消息线程与状态更新天然可映射为时间线。
- 价值：用户可理解“为什么失败、从哪重试”。

#### Subtask R7-S6｜资深架构师（反驳）
- 反驳对象：UI 设计师
- 观点：时间线可做，但先做事件归一化，不然会出现语义漂移。
- 事实：当前事件来源分散在 SessionChat/router/HappyThread。
- 方案：先定义统一 event schema，再渲染时间线。

#### Subtask R7-S7｜产品经理
- 主张：把“建议动作”设计成可学习系统：接受/忽略/手动替代都回流规则。
- 事实：可利用现有行为信号（点击、发送、审批）构建反馈闭环。

### Round 8（协作、治理与体验张力）

#### Subtask R8-S1｜用户
- 主张：需要“会话交接卡”（handoff card），别人接手时 30 秒进入状态。
- 事实：已有目录分组、会话元数据、待处理信号。
- 内容：目标、当前阻塞、已验证证据、下一步建议。

#### Subtask R8-S2｜创意产品经理
- 主张：做“冲突雷达”：当两个会话可能对同一资源产生冲突时预警。
- 事实：会话已有 path 维度，可推断潜在冲突域（目录/文件范围）。

#### Subtask R8-S3｜资深架构师
- 主张：做“意图锁”而非硬锁文件。
- 事实：当前是会话层操作，不适合直接上底层锁。
- 方案：在 UI 层提示冲突风险并提供合并策略入口。

#### Subtask R8-S4｜UI 设计师（反驳）
- 反驳对象：资深架构师
- 观点：仅提示不够，必须给可执行的化解动作。
- 交互：提供“让步/合并/并行继续（记录风险）”三选一。

#### Subtask R8-S5｜逻辑分析导师
- 主张：加入“决策可追溯性评分”。
- 指标：是否有证据链接、是否有反方案记录、是否有回退方案。
- 价值：防止团队把即时效率换成长期混乱。

#### Subtask R8-S6｜产品经理（反驳）
- 反驳对象：逻辑分析导师
- 观点：评分不应增加输入负担，必须自动生成为主。
- 事实：现有行为与状态数据可自动提取多数证据项。

#### Subtask R8-S7｜创意产品经理
- 主张：加入“周回顾自动剪辑”（自动生成本周关键推进故事线）。
- 价值：把操作日志转成可汇报成果，增强产品价值感知。

## Expanded Feature Opportunity Map (unconstrained)

### 1) 任务网络与编排
- 跨会话依赖图（阻塞传播、优先级传导）
- 今日推进面板（阻塞/可完成/风险三栏）
- 导演模式（目标驱动自动分配会话）

### 2) 可控自动化与恢复
- 风险分级自动化（L0/L1/L2）
- 最后安全点（Checkpoint）
- 执行剧本回放（Playbook Replay）
- 操作时间线与分叉重试

### 3) 协作治理与可追溯
- 会话交接卡（handoff）
- 冲突雷达 + 冲突化解动作
- 决策可追溯评分（自动提取优先）
- 周回顾自动剪辑

## Potential Metrics (for later convergence)
- 跨会话任务吞吐量
- 返工率（失败后重复动作占比）
- 恢复耗时 P50/P90
- 冲突化解成功率
- 交接后 30 分钟有效推进率
- 建议动作采纳率（及后续成功率）

## Multi-role Brainstorm Iterations (Round 9-11, creative interaction deep dive)

### Round 9（反脆弱交互：失败越多越会恢复）

#### Subtask R9-S1｜逻辑分析导师
- 主张：把“失败”从异常变成训练信号，形成反脆弱恢复回路。
- 事实：历史加载失败与重试路径已存在（`web/src/components/AssistantChat/HappyThread.tsx:195-205`）。
- 交互：失败后自动出现“恢复策略卡”（重试/降级/跳过并记录）。

#### Subtask R9-S2｜用户
- 主张：我不想看错误堆栈，只想知道“下一步最稳妥操作”。
- 事实：当前已能显示 NewMessagesIndicator（`web/src/components/AssistantChat/HappyThread.tsx:335`）。
- 需求：把“新消息提示”升级为“新风险提示 + 一键处理”。

#### Subtask R9-S3｜产品经理
- 主张：新增“恢复预算（Recovery Budget）”概念：每次会话可消耗的失败重试额度。
- 价值：引导用户从无穷重试转为策略切换。
- 指标：预算耗尽率与任务完成率的相关性。

#### Subtask R9-S4｜资深架构师
- 主张：恢复预算不应绑定后端配额，先做前端引导层。
- 事实：现有前端已集中处理 resume 与错误 toast（`web/src/router.tsx:215-224`）。
- 方案：在 SessionPage 维护 lightweight failure ledger。

#### Subtask R9-S5｜UI 设计师（反驳）
- 反驳对象：产品经理
- 观点：直接展示“预算数字”会制造焦虑，应改为“恢复信心条”。
- 事实：列表已有多状态信号（thinking/todo/pending）（`web/src/components/SessionList.tsx:225-243`）。
- 交互：信心条分层显示“稳态/波动/高风险”。

#### Subtask R9-S6｜创意产品经理
- 主张：引入“失败纪念碑（Failure Monument）”微交互。
- 交互：每次从失败恢复成功后，生成一条可复用经验（下次自动推荐）。
- 价值：让失败产生长期资产。

#### Subtask R9-S7｜创意产品经理（反驳）
- 反驳对象：资深架构师
- 观点：仅前端引导不够，至少要定义可同步的数据结构，避免后续迁移成本。
- 方案：先定义前后端兼容 schema（sessionId、failureType、recoveryAction、outcome）。

### Round 10（博弈式协作：多会话冲突协商）

#### Subtask R10-S1｜资深架构师
- 主张：把冲突处理从“提示”升级为“协商协议”。
- 事实：当前会话按目录聚合（`web/src/components/SessionList.tsx:28-51`），具备冲突域基础。
- 方案：同目录并发操作时触发 Negotiation Sheet（让步/合并/冻结）。

#### Subtask R10-S2｜用户
- 主张：我需要知道“哪个会话更该被优先保留”。
- 事实：当前列表可识别 active 与更新时间（`web/src/components/SessionList.tsx:47-51`）。
- 需求：给出“保留建议分”并说明依据（最近活跃、阻塞级别、待审批数）。

#### Subtask R10-S3｜逻辑分析导师
- 主张：协商必须可审计，避免“拍脑袋”让步。
- 交互：每次冲突选择都记录原因模板（速度优先/稳定优先/证据优先）。
- 指标：冲突后二次返工率。

#### Subtask R10-S4｜产品经理（反驳）
- 反驳对象：逻辑分析导师
- 观点：强制填写原因会降低流畅性，应先默认自动推断原因。
- 事实：现有行为流中已有动作事件可推断偏好。
- 折中：默认自动填充，允许一键改写。

#### Subtask R10-S5｜UI 设计师
- 主张：协商界面采用“三栏对比”而不是弹窗文本。
- 交互：左栏会话A上下文，右栏会话B上下文，中栏系统建议与风险。
- 价值：降低理解成本，提升决策速度。

#### Subtask R10-S6｜创意产品经理（反驳）
- 反驳对象：UI 设计师
- 观点：三栏适合桌面端，移动端需改为卡片轮播+手势决策。
- 事实：小屏下列表/详情是互斥展示（`web/src/router.tsx:117,167`）。
- 方案：移动端 swipe 选择让步策略，保留同等信息密度。

#### Subtask R10-S7｜产品经理
- 主张：把“冲突协商”升级为增长功能：输出“团队协作风格画像”。
- 价值：帮助团队识别过度冒险或过度保守倾向。

### Round 11（自解释 AI：建议必须可审计）

#### Subtask R11-S1｜逻辑分析导师
- 主张：所有建议动作必须附带“证据三件套”：来源、约束、预期结果。
- 事实：当前已有多信号源（pending/todo/thinking/new messages）。
- 交互：建议卡默认折叠，展开看证据链。

#### Subtask R11-S2｜创意产品经理
- 主张：加入“反建议按钮”（Show Counter-Plan）。
- 交互：系统同时给主方案与保守方案，用户可一键切换。
- 价值：避免单一路径依赖。

#### Subtask R11-S3｜资深架构师
- 主张：反建议不应即席生成，需基于稳定模板。
- 事实：SessionChat 已有稳定动作入口（发送、文件、终端、语音）（`web/src/components/SessionChat.tsx:231-243,325-328`）。
- 方案：先做模板化 counter-plan（安全优先/速度优先/信息优先）。

#### Subtask R11-S4｜用户（反驳）
- 反驳对象：资深架构师
- 观点：模板太死板，我要“按当前卡点”动态给方案。
- 事实：当前会话存在 active/inactive 与 pendingCount 状态差异（`web/src/components/SessionChat.tsx:280,302`）。
- 需求：模板参数化，按实时状态填充。

#### Subtask R11-S5｜UI 设计师
- 主张：建议卡增加“信任刻度”（高/中/低），并显示影响范围。
- 交互：低信任建议默认需要额外确认；高信任可快捷执行。
- 价值：让用户形成稳定心智模型。

#### Subtask R11-S6｜产品经理（反驳）
- 反驳对象：UI 设计师
- 观点：信任刻度不能只靠模型置信度，必须叠加业务后果。
- 指标：建议执行后成功率 × 失败代价。
- 决策：先上二阶评分（可信度 + 后果权重）。

#### Subtask R11-S7｜用户
- 主张：我要“解释先行模式”：执行前先看 5 秒摘要。
- 交互：执行按钮长按预览建议理由，松开确认。
- 价值：降低误触与盲从。

## New Opportunity Epics (post R9-R11)

### Epic A｜反脆弱恢复系统
- 恢复策略卡（重试/降级/跳过）
- 恢复信心条（替代失败预算数字焦虑）
- 失败经验资产化（Failure Monument）

### Epic B｜冲突协商协议层
- Negotiation Sheet（让步/合并/冻结）
- 决策理由自动填充 + 可编辑
- 桌面三栏/移动轮播双形态

### Epic C｜可审计建议引擎
- 证据三件套建议卡
- Counter-Plan 双方案
- 二阶信任评分 + 解释先行交互

## Additional Metrics Candidates
- 恢复策略切换成功率
- 冲突协商平均决策时长
- 建议卡展开率（解释被消费程度）
- Counter-Plan 选择后成功率差值
- 误触执行率（上线解释先行前后对比）

---

## [Reset-2｜2026-03-06] 全部子任务重启

> 主人要求：重启所有子任务；后续子任务讨论中不包含“状态/失败处理”主题。
> 旧子任务仅作历史记录，不参与当前轮次决策。

## New Subtasks (Interaction-only, no status/failure topic)

### Round N1（独立发散）

#### Subtask N1-S1｜产品经理
- 主题：任务入口重构为“目标驱动”而非“会话驱动”。
- 代码事实：当前入口以会话列表选择为主（`web/src/router.tsx:154-158`）。
- 提案：新增“我要完成什么”入口（修复问题/实现功能/验证结果）。

#### Subtask N1-S2｜创意产品经理
- 主题：输入区升级为“意图工作台”。
- 代码事实：聊天发送与附件已在同一交互面（`web/src/components/SessionChat.tsx:245-263`）。
- 提案：在输入框上方提供意图模板芯片（拆解任务/生成计划/开始执行）。

#### Subtask N1-S3｜UI设计师
- 主题：移动端高频操作前置。
- 代码事实：当前小屏列表与详情互斥（`web/src/router.tsx:117,167`）。
- 提案：在详情头部加“最近3个会话快速切换条”。

#### Subtask N1-S4｜资深架构师
- 主题：跨页动作连贯性。
- 代码事实：chat 内可跳 files/terminal（`web/src/components/SessionChat.tsx:231-243`）。
- 提案：统一“返回聊天并继续上一步”入口，减少页面往返断层。

#### Subtask N1-S5｜用户
- 主题：减少操作记忆负担。
- 代码事实：列表有分组与数量信息（`web/src/components/SessionList.tsx:382-400`）。
- 提案：增加“我最近在做什么”卡片（最近目标+最近动作）。

#### Subtask N1-S6｜逻辑分析导师
- 主题：交互决策可解释但不冗长。
- 代码事实：已有待办/思考提示信号（`web/src/components/SessionList.tsx:225-237`）。
- 提案：每个推荐动作只显示一句“推荐理由”。

#### Subtask N1-S7｜创意产品经理（反驳）
- 反驳对象：逻辑分析导师
- 观点：一句理由太弱，创意任务需要可选“展开版理由”。
- 提案：默认一句，点击后展开三点依据。

### Round N2（独立深化）

#### Subtask N2-S1｜产品经理
- 主题：会话列表升级为“任务看板视图”。
- 代码事实：当前按目录分组（`web/src/components/SessionList.tsx:28-51`）。
- 提案：支持按任务阶段分栏（待规划/进行中/待验收）。

#### Subtask N2-S2｜UI设计师
- 主题：批量操作可发现性。
- 代码事实：现有单会话管理动作依赖菜单（`web/src/components/SessionList.tsx:176-206`）。
- 提案：列表顶栏加入“多选模式”入口，支持批量归档/重命名标签。

#### Subtask N2-S3｜资深架构师
- 主题：交互组件复用。
- 代码事实：Chat、Files、Terminal 分属不同路由（`web/src/router.tsx:413-433`）。
- 提案：抽象统一 ActionBar 组件，保证跨页操作一致。

#### Subtask N2-S4｜用户
- 主题：快速定位能力。
- 代码事实：当前已显示目录和会话数（`web/src/components/SessionList.tsx:396-400`）。
- 提案：增加“任务关键词筛选 + 最近命中过滤器”。

#### Subtask N2-S5｜逻辑分析导师（反驳）
- 反驳对象：产品经理
- 观点：任务看板若阶段过多会提升认知负担。
- 提案：先保留三栏，不超过三种阶段。

#### Subtask N2-S6｜创意产品经理
- 主题：会话命名自动建议。
- 代码事实：已有重命名流程（`web/src/components/SessionList.tsx:280-283`）。
- 提案：基于最近消息自动生成“动词+对象”名称，一键采用。

#### Subtask N2-S7｜资深架构师（反驳）
- 反驳对象：创意产品经理
- 观点：自动命名必须可控，避免频繁抖动。
- 提案：仅在新建会话和手动触发时建议，不自动覆盖。

### Round N3（交叉反驳）

#### Subtask N3-S1｜用户（反驳）
- 反驳对象：UI设计师
- 观点：多选模式入口不能藏太深，否则没人用。
- 提案：在列表标题右侧固定“批量”按钮。

#### Subtask N3-S2｜产品经理（反驳）
- 反驳对象：用户
- 观点：固定按钮会占据主操作注意力。
- 提案：仅当会话数超过阈值时显示批量入口。

#### Subtask N3-S3｜逻辑分析导师
- 主题：阈值应基于行为而非静态数字。
- 代码事实：已有会话总数可取（`web/src/components/SessionList.tsx:368`）。
- 提案：结合近7日使用频率决定是否常驻批量按钮。

#### Subtask N3-S4｜UI设计师（反驳）
- 反驳对象：逻辑分析导师
- 观点：动态出现/消失会造成界面不稳定感。
- 提案：按钮常驻但弱化显示，进入后强化。

#### Subtask N3-S5｜资深架构师
- 主题：跨端一致性。
- 代码事实：移动与桌面结构差异已存在（`web/src/router.tsx:117,167`）。
- 提案：保持同一信息结构，不同交互手势实现。

#### Subtask N3-S6｜创意产品经理（反驳）
- 反驳对象：资深架构师
- 观点：完全一致会牺牲移动效率。
- 提案：信息一致、路径不一致（移动优先一步直达）。



---

## [Reset-3｜2026-03-06] 全部作废并从 M1 重跑

> 主人指令：全部作废，立刻从 M1 开始重跑。
> 规则：每次只执行一个真实子任务；执行后回传 agentId 与原始结果；禁止空转总结。
> 约束：本轮不讨论“状态/失败处理”。
