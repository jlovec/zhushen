# PR Autopilot（收尾到干净 PR）

在“代码已完成”后，自动将当前改动整理为干净 PR，并持续跟进评论直到无阻断问题。

## 适用场景

- 已完成编码，准备提交 commit 和 PR
- 需要自动整理 upstream/origin 分支关系
- 需要尽量保持 PR 为 1 个功能性 commit
- 需要持续跟进 CI / review / PIA 评论并迭代修复

## 强约束（必须遵守）

1. 默认 **dry-run**，先输出执行计划与风险。
2. 任何可能改写历史的操作（rebase/squash/close PR/reopen PR）都必须先确认。
3. 执行前必须创建 `backup/safety-*` 分支，禁止丢失 commit。
4. 仅处理“阻断合并”的评论；低价值建议先汇总，不自动盲改。
5. 若评论信息不足，先复现与定位，再给修复建议，不做无意义射击。

## 输入参数（建议）

- `base`：默认 `upstream/main`
- `head`：当前功能分支
- `squash`：`one|auto|keep`（默认 `auto`）
- `watch`：`on|off`（默认 `on`）
- `maxIterations`：默认 `8`
- `allowReopen`：`true|false`（默认 `true`）

## 执行步骤

### 1) Preflight 与安全锚点

- 检查：工作区状态、远端连通、分支拓扑、PR 目标仓库
- 创建备份：`backup/safety-<branch>-<date>`
- 输出：可执行计划（含将执行的 git/gh 操作）

### 2) 提交与分支清洗

- 自动按功能聚类改动，生成 commit 方案
- 如 `squash=one`，整理为单 commit（保留语义清晰 message）
- 从 `base` 派生干净分支，cherry-pick 目标提交，避免 merge 噪音

### 3) 创建 PR（中文）

- 生成并提交中文标题与描述：背景 / 变更 / 验证 / 风险
- 返回 PR URL 与首轮检查结果

### 4) 监听 PR 并迭代

循环直到满足退出条件：

- 拉取 CI 状态、review 评论、PIA 评论
- 分类：`blocking` / `non-blocking` / `noise`
- 对 `blocking` 生成“可复现 -> 修复 -> 验证”闭环
- 提交修复并推送，更新 PR

### 5) 特殊分支策略

当出现以下情况，建议关闭旧 PR 并重开：

- 历史污染严重（主题漂移、多次无关合并）
- 审查范围已无法收敛

在 `allowReopen=true` 且用户确认后执行：

- 关闭旧 PR（附替代 PR 链接）
- 从干净分支重开新 PR

## 退出条件

满足任一：

1. 无阻断评论 + 关键 CI 通过
2. 达到 `maxIterations`
3. 需要人工决策（冲突策略、产品取舍）

## 输出格式

```markdown
## PR Autopilot 报告

### PR
- URL: <url>
- Base/Head: <base> <- <head>

### 本轮状态
- CI: pass/fail
- Blocking 评论数: <n>
- Non-blocking 评论数: <n>

### 已完成动作
- [x] 安全锚点
- [x] 提交清洗
- [x] PR 创建/更新
- [x] 修复提交（如有）

### 下一步
- <明确下一动作或“可合并”>
```
