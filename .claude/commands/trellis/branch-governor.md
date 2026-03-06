# Branch Governor（分支治理与功能归位）

梳理本地与远端所有分支，确保不丢 commit，并按功能归位提交与 PR。

## 适用场景

- 分支多、PR 多，历史与功能线容易混杂
- 需要确保 commit 安全保留
- 需要按功能拆分 PR，而不是混合提交

## 强约束（必须遵守）

1. 默认 **audit 模式**，先报告再改动。
2. 所有重排前必须创建 `backup/safety-*` 锚点。
3. 不删除含未提交改动的 worktree/分支（除非明确确认 force）。
4. 不做与功能无关的自动改写，避免无意义操作。

## 输入参数（建议）

- `mode`：`audit|fix`（默认 `audit`）
- `base`：默认 `upstream/main`
- `protect`：默认 `product/main,contrib/upstream-main`
- `route`：`path+message+diff`（提交归属规则）
- `splitPR`：`true|false`（默认 `true`）

## 执行步骤

### 1) 全量盘点

- 收集：本地分支、远端分支、worktree、追踪关系
- 构建：分支-提交拓扑与差异视图

### 2) 安全锚点

- 为关键分支建立备份引用
- 标记可能丢失风险的孤立提交

### 3) 一致性审计

识别并分级：

- `contrib/*` 混入私有提交
- `main` 偏离 `upstream/main`
- 已被替代但未清理的旧 PR 分支
- 残留 worktree 分支

### 4) 提交归位建议

对每个提交给出目标归属：

- `contrib/*`：可上游功能提交
- `product/main`：私有/本地流程沉淀
- `backup/*`：历史保留，不参与新 PR

### 5) 按功能拆分 PR（可选）

在 `splitPR=true` 且用户确认后：

- 从 `base` 创建干净功能分支
- 只拣选对应功能提交
- 生成 PR 草案（中文）

### 6) 清理建议

输出三类清单：

- 可直接清理
- 需确认后清理（force）
- 必须保留

## 输出格式

```markdown
## Branch Governor 报告

### 关键分支健康度
- product/main: <ok/warn>
- contrib/upstream-main: <ok/warn>
- main vs upstream/main: <ok/warn>

### 提交归位建议
- <commit> -> <target-branch>（原因）

### PR 拆分建议
- 功能A: <branch/pr>
- 功能B: <branch/pr>

### 清理计划
- 可删: ...
- 需确认: ...
- 保留: ...
```
