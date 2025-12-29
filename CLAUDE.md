# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EventNoti 是一个事件通知管理平台，支持通过企业微信 Webhook 发送事件提醒。

### 技术栈

- **前端**: React 18 + Vite 5 + Tailwind CSS 3 + TypeScript
- **后端**: Node.js 20+ + Express 5 + better-sqlite3
- **状态管理**: Zustand + React Query
- **认证**: JWT (httpOnly cookie)
- **定时任务**: node-cron

### 项目结构

```
packages/
├── web/      # React 前端应用
├── server/   # Express 后端服务
└── shared/   # 共享类型和常量
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式 (同时启动前端和后端)
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint
pnpm lint:fix
```

## 开发规范

- 所有 API 返回格式: `{ data, success: true }` 或 `{ error: { code, message }, success: false }`
- 使用 Zod 进行请求参数验证
- 使用 React Query 进行数据获取和缓存
- 使用 Zustand 管理全局状态 (authStore, uiStore)

## Spec Workflow System

This project uses **Spec Workflow** - a structured document-driven development methodology.

### Directory Structure

- `.spec-workflow/specs/` - Feature specification documents (requirements, design, tasks)
- `.spec-workflow/steering/` - Project-level steering documents (product.md, tech.md, structure.md)
- `.spec-workflow/approvals/` - Documents pending approval
- `.spec-workflow/archive/` - Completed/archived specifications
- `.spec-workflow/templates/` - Default document templates
- `.spec-workflow/user-templates/` - Custom templates (override defaults)

### Document Types

**Steering Documents** (in `steering/`):
- `product.md` - Product vision, target users, business objectives
- `tech.md` - Technology stack, dependencies, architecture decisions
- `structure.md` - Project directory organization, naming conventions

**Specification Documents** (in `specs/<feature-name>/`):
- `requirements.md` - User stories, acceptance criteria, non-functional requirements
- `design.md` - Architecture, components, data models, testing strategy
- `tasks.md` - Implementation tasks with prompts and dependencies

### Workflow

1. Create steering documents first to establish project direction
2. For each feature, create a spec folder with requirements → design → tasks
3. Tasks reference requirements and leverage existing code/components
4. Complete specifications go to `approvals/` for review, then `archive/` when done

### Template Variables

Templates support placeholders: `{{projectName}}`, `{{featureName}}`, `{{date}}`, `{{author}}`

### Custom Templates

Place custom templates in `user-templates/` with same filename as default to override.
