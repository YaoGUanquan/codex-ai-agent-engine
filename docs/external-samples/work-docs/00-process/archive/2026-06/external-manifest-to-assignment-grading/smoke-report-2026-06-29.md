# 外部 manifest 创建作业批改 — 本地冒烟报告（2026-06-29）

## 目标

验证 `POST /api/v1/exam-assignment-grading/external/create-from-manifest` 在 preset 路径与 `grading_mode` 修复后，能正确创建 manual manifest 并在 layout 中展开 ROI。

## 前置

- 本地服务已重启
- 测试 manifest：`jinhua-chinese-v4`
- 试卷池 PDF 已通过 flow state 或本地 pool 解析

## 步骤与结果

### 1. 创建任务

- 请求：`POST /api/v1/exam-assignment-grading/external/create-from-manifest`
- Body：`{"manifest_id":"jinhua-chinese-v4"}`
- 结果：成功
- 返回 manifestId：**`english_g12_20260629154602`**
- 返回 gradingId：queued 状态

### 2. 验证 create-from-manual 产物

- 第三方写入文件含 **`manual_roi_test_essay.json`**
- 说明 section preset 已被第三方接受

### 3. 验证 layout（必须用新 manifestId）

- 请求：`GET /api/v1/manifests/english_g12_20260629154602/layout`
- **错误做法**：用 `jinhua-chinese-v4` 查 layout → 8040 返回 **404**
- 结果：
  - `input.grading_mode = paired_standard`
  - `tasks[0].roi` 完整
  - ref：**1822 × 1287**
  - roi：**963 / 113 / 753 / 1091**
  - shrink：**8**
  - 与源 `layout_adjusted.json` 对应 region 一致

## 结论

- preset 放在 `sections[].preset` + `grading_mode=paired_standard` 修复有效
- layout 验证必须使用 create-from-manual 新 manifestId
- 冒烟通过；批改任务终态轮询未在本报告范围

## 相关

- API：`docs/04-api/2026-06-29-external-manifest-assignment-grading-api.md`
- 方案：`docs/ae/plans/2026-06-29-003-external-manifest-to-assignment-grading-plan.md`
