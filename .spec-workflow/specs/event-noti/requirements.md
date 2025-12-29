# Requirements Document - EventNoti

## Introduction

EventNoti 是一个事件通知管理平台，用户可通过 Web 界面设置重要事项的提醒通知。系统支持倒计时提醒模式（到期前 N 天开始每日提醒），并通过企业微信机器人 Webhook 推送通知消息。

## Alignment with Product Vision

本需求文档支撑 product.md 中定义的核心目标：
- 提供简洁高效的事件提醒解决方案
- 支持企业微信生态集成
- 实现响应式设计，PC 和移动端均可使用
- Docker 轻量化部署

---

## Requirements

### REQ-1: 用户认证与管理

**User Story:** 作为管理员，我希望能够创建和管理用户账号，以便团队成员可以使用系统。

#### Acceptance Criteria

1. WHEN 管理员访问用户管理页面 THEN 系统 SHALL 显示所有用户列表
2. WHEN 管理员填写用户信息并提交 THEN 系统 SHALL 创建新用户账号
3. WHEN 管理员修改用户信息 THEN 系统 SHALL 更新用户数据
4. WHEN 管理员删除用户 THEN 系统 SHALL 软删除用户并保留历史数据
5. WHEN 用户输入正确的用户名密码 THEN 系统 SHALL 颁发认证 Token 并跳转至首页
6. WHEN 用户点击登出 THEN 系统 SHALL 清除 Token 并跳转至登录页

---

### REQ-2: 通知事件管理

**User Story:** 作为用户，我希望能够创建和管理通知事件，以便系统在指定时间提醒我。

#### Acceptance Criteria

1. WHEN 用户访问事件列表页 THEN 系统 SHALL 显示该用户的所有事件
2. WHEN 用户创建事件时 THEN 系统 SHALL 要求填写：事件名称、通知内容、目标日期、提前提醒天数
3. WHEN 用户设置「提前 N 天提醒」THEN 系统 SHALL 从目标日期前 N 天开始每日发送通知
4. WHEN 用户编辑事件 THEN 系统 SHALL 更新事件信息并重新计算通知计划
5. WHEN 用户删除事件 THEN 系统 SHALL 移除事件及其待发送通知
6. WHEN 事件目标日期已过 THEN 系统 SHALL 将事件标记为「已过期」

---

### REQ-3: 事件分组管理

**User Story:** 作为用户，我希望能够将事件分组管理，以便更好地组织和查看不同类型的提醒。

#### Acceptance Criteria

1. WHEN 用户访问分组列表 THEN 系统 SHALL 显示用户创建的所有分组
2. WHEN 用户创建分组时 THEN 系统 SHALL 要求填写：分组名称、颜色标识、绑定的 Webhook
3. WHEN 用户创建事件时 THEN 系统 SHALL 允许选择一个分组（可选）
4. WHEN 用户筛选某分组 THEN 系统 SHALL 仅显示该分组下的事件
5. WHEN 用户删除分组 THEN 系统 SHALL 将该分组下的事件移至「未分组」

---

### REQ-4: Webhook 配置管理

**User Story:** 作为管理员，我希望能够配置企业微信 Webhook，以便系统能够发送通知消息。

#### Acceptance Criteria

1. WHEN 管理员访问 Webhook 管理页 THEN 系统 SHALL 显示所有已配置的 Webhook
2. WHEN 管理员添加 Webhook THEN 系统 SHALL 要求填写：名称、Webhook URL
3. WHEN 管理员点击「测试」THEN 系统 SHALL 发送测试消息并显示结果
4. WHEN 管理员编辑 Webhook THEN 系统 SHALL 更新配置信息
5. WHEN 管理员删除 Webhook THEN 系统 SHALL 检查是否有分组绑定，若有则提示确认
6. IF Webhook URL 格式不正确 THEN 系统 SHALL 显示格式错误提示

---

### REQ-5: 通知调度与发送

**User Story:** 作为用户，我希望系统能够按时发送通知，以便我不会错过重要事项。

#### Acceptance Criteria

1. WHEN 系统启动时 THEN 调度器 SHALL 加载所有待发送的通知任务
2. WHEN 到达通知发送时间（每日固定时间）THEN 系统 SHALL 查询当日需发送的通知
3. WHEN 发送通知时 THEN 系统 SHALL 调用事件绑定分组的 Webhook（无分组则用默认 Webhook）
4. WHEN 通知发送成功 THEN 系统 SHALL 记录发送时间和状态
5. WHEN 通知发送失败 THEN 系统 SHALL 记录错误信息并重试（最多 3 次）
6. WHEN 用户查看通知历史 THEN 系统 SHALL 显示所有已发送通知及其状态

---

### REQ-6: 通知消息格式

**User Story:** 作为用户，我希望通知消息格式清晰易读，包含关键信息。

#### Acceptance Criteria

1. WHEN 发送通知时 THEN 消息 SHALL 包含：事件名称、剩余天数、事件内容
2. WHEN 剩余天数为 0 THEN 消息 SHALL 显示「今天」而非「0 天」
3. WHEN 事件已过期 THEN 消息 SHALL 显示「已过期 N 天」
4. IF 用户自定义了通知内容 THEN 系统 SHALL 使用自定义内容发送

---

### REQ-7: 响应式界面

**User Story:** 作为用户，我希望在手机和电脑上都能方便地使用系统。

#### Acceptance Criteria

1. WHEN 用户在移动端访问 THEN 系统 SHALL 显示适配移动端的布局
2. WHEN 用户在桌面端访问 THEN 系统 SHALL 显示适配桌面端的布局
3. WHEN 屏幕宽度 < 768px THEN 系统 SHALL 切换为移动端布局
4. WHEN 用户操作表单 THEN 系统 SHALL 确保输入控件在移动端可正常使用

---

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: 前后端代码按功能模块拆分
- **Modular Design**: 组件、服务、工具函数独立可复用
- **Dependency Management**: 使用 pnpm workspace 管理 monorepo
- **Clear Interfaces**: API 使用 RESTful 规范，类型使用 TypeScript

### Performance
- API 响应时间 < 200ms
- 首屏加载 < 3s（生产环境）
- 支持 1000+ 事件存储

### Security
- 密码使用 bcrypt 哈希存储
- API 请求使用 JWT 认证
- 敏感操作需要管理员权限
- 输入验证防止 SQL 注入和 XSS

### Reliability
- 通知发送失败自动重试
- 数据库定期备份（Docker volume）
- 错误日志记录

### Usability
- 3 步内完成事件创建
- 清晰的错误提示
- 支持中文界面
