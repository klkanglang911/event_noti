# Tasks Document - EventNoti

本文档定义了 EventNoti 项目的实现任务，按开发顺序排列。每个任务包含 AI 提示词，用于 vibe coding。

---

## Phase 1: 项目初始化

- [x] 1.1 初始化 monorepo 项目结构
  - 创建 pnpm workspace 配置
  - 初始化 packages/web、packages/server、packages/shared
  - 配置 TypeScript 基础配置
  - 配置 ESLint + Prettier
  - _Requirements: 项目结构_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Full-stack Developer with expertise in monorepo architecture and TypeScript configuration | Task: Initialize pnpm monorepo with three packages (web, server, shared). Configure TypeScript path aliases (@/, @shared/), ESLint with TypeScript support, and Prettier. Create tsconfig.base.json for shared compiler options. | Restrictions: Use pnpm workspace, not yarn or npm workspaces. Do not install any application dependencies yet, only dev tooling. | Success: Running `pnpm install` works, TypeScript compiles without errors, ESLint and Prettier are configured. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 1.2 配置前端项目 (packages/web)
  - 使用 Vite + React + TypeScript 模板
  - 安装配置 Tailwind CSS
  - 安装 Lucide React 图标库
  - 配置路径别名 @/
  - _Leverage: packages/shared_
  - _Requirements: 技术栈_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer specializing in React and Vite | Task: Set up packages/web with Vite React TypeScript template. Install and configure Tailwind CSS 3 with custom color palette (primary: blue-600). Install lucide-react for icons. Configure vite.config.ts with path alias @/ pointing to src/. | Restrictions: Use React 18, Vite 5. Do not create any pages or components yet. Keep dependencies minimal. | Success: `pnpm --filter web dev` starts dev server, Tailwind classes work, imports like `@/utils` resolve correctly. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 1.3 配置后端项目 (packages/server)
  - 初始化 Express + TypeScript 项目
  - 安装核心依赖 (better-sqlite3, node-cron, bcrypt, jsonwebtoken, zod)
  - 配置 nodemon 热重载
  - 配置路径别名 @/
  - _Leverage: packages/shared_
  - _Requirements: 技术栈_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer specializing in Node.js and Express | Task: Set up packages/server with Express and TypeScript. Install dependencies: express, better-sqlite3, node-cron, bcrypt, jsonwebtoken, zod, axios, cors, helmet. Configure tsconfig.json with path alias @/. Set up nodemon.json for hot reload. Create basic src/index.ts entry point that starts Express on port 3000. | Restrictions: Use CommonJS for better SQLite compatibility. Do not implement any routes yet. | Success: `pnpm --filter server dev` starts server with hot reload, TypeScript compiles. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 1.4 配置共享包 (packages/shared)
  - 创建共享类型定义
  - 创建共享常量
  - 配置包导出
  - _Requirements: 数据模型_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: TypeScript Developer | Task: Set up packages/shared with TypeScript types. Create src/types/index.ts exporting User, Event, Group, Webhook, Notification interfaces as defined in design.md. Create src/constants/index.ts with USER_ROLES, EVENT_STATUS, NOTIFICATION_STATUS constants. Configure package.json exports for both ESM and CJS. | Restrictions: No runtime dependencies, types only. Must work in both web and server packages. | Success: Both web and server can import `import { User } from '@shared/types'`. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 2: 数据库与模型层

- [x] 2.1 创建数据库 schema 和初始化
  - File: packages/server/src/db/schema.sql
  - File: packages/server/src/db/index.ts
  - 创建所有表结构
  - 实现数据库连接和初始化
  - _Requirements: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with database expertise | Task: Create SQLite database schema as defined in design.md (users, webhooks, groups, events, notifications tables with all indexes). Implement db/index.ts that initializes database connection using better-sqlite3, runs schema.sql if tables don't exist, and exports db instance. Add seed data: admin user (username: admin, password: admin123). | Restrictions: Use synchronous better-sqlite3 API. Store database file at data/event-noti.db. Do not use ORM. | Success: Running server creates database with all tables, admin user exists. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 2.2 实现数据模型层
  - File: packages/server/src/models/userModel.ts
  - File: packages/server/src/models/eventModel.ts
  - File: packages/server/src/models/groupModel.ts
  - File: packages/server/src/models/webhookModel.ts
  - File: packages/server/src/models/notificationModel.ts
  - 实现各模型的 CRUD 操作
  - _Leverage: packages/server/src/db/index.ts, packages/shared/src/types_
  - _Requirements: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with data modeling expertise | Task: Create model files for User, Event, Group, Webhook, Notification. Each model should export functions: findAll, findById, create, update, delete (soft delete for users). Use better-sqlite3 prepared statements. UserModel should include findByUsername. EventModel should include findByUserId with optional groupId filter. NotificationModel should include findPendingByDate. | Restrictions: Return plain objects matching shared types. Use parameterized queries for security. No business logic in models, only data access. | Success: All models export working CRUD functions. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 3: 认证系统

- [x] 3.1 实现认证服务和中间件
  - File: packages/server/src/services/authService.ts
  - File: packages/server/src/middlewares/auth.ts
  - JWT token 生成和验证
  - 密码哈希和比对
  - 认证中间件
  - _Leverage: packages/server/src/models/userModel.ts_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Security Engineer specializing in authentication | Task: Create authService.ts with login(username, password) that verifies password with bcrypt and returns JWT token (7 day expiry). Create auth.ts middleware that extracts JWT from Authorization header or cookie, verifies it, and attaches user to req.user. Create requireAdmin middleware that checks req.user.role === 'admin'. | Restrictions: Use bcrypt with 12 salt rounds. JWT secret from env variable JWT_SECRET. Do not store tokens in database. | Success: Auth middleware correctly protects routes, admin middleware restricts to admins. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 3.2 实现认证 API 路由
  - File: packages/server/src/routes/auth.routes.ts
  - File: packages/server/src/controllers/auth.controller.ts
  - POST /api/auth/login
  - POST /api/auth/logout
  - GET /api/auth/me
  - _Leverage: packages/server/src/services/authService.ts, packages/server/src/middlewares/auth.ts_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with REST API expertise | Task: Create auth routes and controller. POST /login validates credentials with zod, calls authService.login, returns token and user. POST /logout clears cookie. GET /me requires auth middleware, returns current user from req.user. Set JWT in httpOnly cookie named 'token'. | Restrictions: Use zod for request validation. Return consistent response format { data, success } or { error, success }. | Success: Login returns token, /me returns user info when authenticated. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 4: 核心业务 API

- [x] 4.1 实现用户管理 API (管理员)
  - File: packages/server/src/routes/user.routes.ts
  - File: packages/server/src/controllers/user.controller.ts
  - File: packages/server/src/services/userService.ts
  - CRUD endpoints for users
  - _Leverage: packages/server/src/models/userModel.ts, packages/server/src/middlewares/auth.ts_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with REST API expertise | Task: Create user management routes (admin only). GET /api/users lists all users. POST /api/users creates user (hash password with bcrypt). PUT /api/users/:id updates user. DELETE /api/users/:id soft deletes (sets is_active = 0). All routes require requireAdmin middleware. | Restrictions: Validate all inputs with zod. Do not allow deleting own account. Do not return password_hash in responses. | Success: Admin can CRUD users, non-admins get 403. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 4.2 实现事件管理 API
  - File: packages/server/src/routes/event.routes.ts
  - File: packages/server/src/controllers/event.controller.ts
  - File: packages/server/src/services/eventService.ts
  - CRUD endpoints for events
  - 创建事件时自动生成通知计划
  - _Leverage: packages/server/src/models/eventModel.ts, packages/server/src/models/notificationModel.ts_
  - _Requirements: REQ-2, REQ-5_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with business logic expertise | Task: Create event routes. GET /api/events returns user's events (support ?groupId filter). POST /api/events creates event and generates notification records for each day from (targetDate - remindDays) to targetDate. PUT /api/events/:id updates event and regenerates notifications. DELETE /api/events/:id deletes event (cascade deletes notifications). Include daysRemaining calculation in response. | Restrictions: Users can only access their own events. Validate targetDate is in future for new events. Use transaction for create/update to ensure notification consistency. | Success: Creating event with remindDays=3 creates 4 notification records. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 4.3 实现分组管理 API
  - File: packages/server/src/routes/group.routes.ts
  - File: packages/server/src/controllers/group.controller.ts
  - File: packages/server/src/services/groupService.ts
  - CRUD endpoints for groups
  - _Leverage: packages/server/src/models/groupModel.ts_
  - _Requirements: REQ-3_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Create group routes. GET /api/groups returns user's groups with webhook info. POST /api/groups creates group (name, color, webhookId optional). PUT /api/groups/:id updates group. DELETE /api/groups/:id deletes group and sets events.group_id to NULL for affected events. | Restrictions: Users can only access their own groups. Validate color is valid hex. webhookId must reference existing webhook. | Success: Groups can be created with webhook binding, deletion orphans events. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 4.4 实现 Webhook 管理 API (管理员)
  - File: packages/server/src/routes/webhook.routes.ts
  - File: packages/server/src/controllers/webhook.controller.ts
  - File: packages/server/src/services/webhookService.ts
  - CRUD endpoints for webhooks
  - Webhook 测试功能
  - _Leverage: packages/server/src/models/webhookModel.ts_
  - _Requirements: REQ-4_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with API integration expertise | Task: Create webhook routes (admin only). GET /api/webhooks lists all webhooks. POST /api/webhooks creates webhook (validate URL format). PUT /api/webhooks/:id updates webhook. DELETE /api/webhooks/:id deletes if not bound to groups (or confirm). POST /api/webhooks/:id/test sends test message to webhook URL using axios, returns success/failure. | Restrictions: Validate URL matches enterprise WeChat webhook pattern. Test message should be markdown format. Set 10s timeout for test request. | Success: Webhook test sends message to WeChat group. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 4.5 实现通知历史 API
  - File: packages/server/src/routes/notification.routes.ts
  - File: packages/server/src/controllers/notification.controller.ts
  - 查询通知历史
  - _Leverage: packages/server/src/models/notificationModel.ts_
  - _Requirements: REQ-5_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Create notification routes. GET /api/notifications/history returns user's notification history with pagination (?page=1&limit=20). Include related event data (title). Support ?status filter (sent/failed/pending). Order by scheduled_date DESC. | Restrictions: Users can only see notifications for their own events. Use JOIN to include event title. | Success: Returns paginated notification history with event info. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 4.6 整合路由和 Express 配置
  - File: packages/server/src/app.ts
  - File: packages/server/src/routes/index.ts
  - 配置所有中间件
  - 注册所有路由
  - 错误处理中间件
  - _Leverage: 所有 routes 文件_
  - _Requirements: All_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with Express expertise | Task: Create app.ts that configures Express: helmet for security, cors for cross-origin, express.json for body parsing, cookie-parser for cookies. Create routes/index.ts that mounts all route modules under /api prefix. Add global error handler middleware that catches errors and returns { error: { code, message }, success: false }. Add 404 handler. | Restrictions: Use helmet with sensible defaults. CORS should allow credentials. Error handler should log errors but not expose stack traces in production. | Success: All API endpoints accessible under /api, errors return consistent format. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 5: 通知调度系统

- [x] 5.1 实现通知调度服务
  - File: packages/server/src/scheduler/index.ts
  - File: packages/server/src/services/notificationService.ts
  - 定时任务配置
  - 通知发送逻辑
  - 重试机制
  - _Leverage: packages/server/src/models/notificationModel.ts, packages/server/src/services/webhookService.ts_
  - _Requirements: REQ-5, REQ-6_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer with scheduler expertise | Task: Create notificationService.ts with sendNotification(notification) that formats message (title, daysRemaining, content) and sends to webhook. Handle days=0 as "今天", negative as "已过期N天". Create scheduler/index.ts using node-cron to run daily at 09:00 (configurable via env). Query pending notifications for today, send each, update status. Implement retry: on failure, increment retry_count, retry up to 3 times with 5 min delay. | Restrictions: Use markdown format for WeChat. Log all send attempts. Do not block scheduler on single failure. | Success: Scheduler runs daily, sends notifications, handles failures with retry. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 5.2 实现过期事件处理
  - File: packages/server/src/scheduler/expireEvents.ts
  - 自动标记过期事件
  - _Leverage: packages/server/src/models/eventModel.ts_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Create expireEvents.ts scheduler job that runs daily (after notification job). Find all events with status='active' and target_date < today, update status to 'expired'. Log count of expired events. | Restrictions: Run after notification job to ensure final notifications are sent. Use transaction for bulk update. | Success: Events automatically marked expired after target date passes. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 6: 前端基础架构

- [x] 6.1 实现前端路由和布局
  - File: packages/web/src/App.tsx
  - File: packages/web/src/layouts/MainLayout.tsx
  - File: packages/web/src/layouts/AuthLayout.tsx
  - 配置 React Router
  - 响应式布局骨架
  - _Requirements: REQ-7_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer with React Router expertise | Task: Set up React Router in App.tsx with routes as defined in design.md. Create MainLayout with responsive sidebar (hidden on mobile, shown on desktop), header with user menu, and main content area. Create AuthLayout for login page (centered card). Use Tailwind for responsive breakpoints (md:768px). | Restrictions: Use React Router v6. Layouts should use Outlet for nested routes. Mobile sidebar should be toggleable via hamburger menu. | Success: Routes work, layout is responsive on mobile and desktop. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 6.2 实现状态管理和 API 服务
  - File: packages/web/src/stores/authStore.ts
  - File: packages/web/src/stores/uiStore.ts
  - File: packages/web/src/services/api.ts
  - File: packages/web/src/services/authService.ts
  - Zustand stores
  - API 客户端配置
  - _Leverage: packages/shared/src/types_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer with state management expertise | Task: Create api.ts with axios instance (baseURL /api, withCredentials true). Add response interceptor for 401 to redirect to login. Create authStore with user state, login/logout actions, isAuthenticated computed. Create uiStore with sidebarOpen state for mobile toggle. Create authService.ts with login, logout, getCurrentUser functions using api client. | Restrictions: Use zustand without middleware for simplicity. Handle loading and error states. Store user in localStorage for persistence. | Success: Auth state persists across refresh, API calls include credentials. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 6.3 实现基础 UI 组件
  - File: packages/web/src/components/ui/Button.tsx
  - File: packages/web/src/components/ui/Input.tsx
  - File: packages/web/src/components/ui/Select.tsx
  - File: packages/web/src/components/ui/Modal.tsx
  - File: packages/web/src/components/ui/Toast.tsx
  - File: packages/web/src/components/ui/Card.tsx
  - File: packages/web/src/components/ui/Badge.tsx
  - _Requirements: REQ-7_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer with component design expertise | Task: Create reusable UI components using Tailwind CSS. Button: variants (primary, secondary, danger), sizes (sm, md, lg), loading state. Input: label, error message, disabled state. Select: options array, placeholder. Modal: title, children, onClose, open state. Toast: use react-hot-toast or simple implementation with success/error variants. Card: padding, hover effects. Badge: color variants for status. | Restrictions: Use Tailwind only, no CSS-in-JS. Components should be accessible (proper labels, focus states). Use Lucide icons where appropriate. | Success: All components render correctly with all variants. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 7: 前端业务页面

- [x] 7.1 实现登录页面
  - File: packages/web/src/pages/LoginPage.tsx
  - _Leverage: packages/web/src/components/ui, packages/web/src/stores/authStore.ts_
  - _Requirements: REQ-1_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer | Task: Create LoginPage with centered card layout. Form with username and password inputs, login button. Show loading state during login. Display error toast on failure. Redirect to / on success. Use authStore for login action. | Restrictions: Validate form before submit (required fields). Disable button during loading. | Success: User can login and is redirected to dashboard. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 7.2 实现仪表板首页
  - File: packages/web/src/pages/DashboardPage.tsx
  - File: packages/web/src/components/business/EventCard.tsx
  - File: packages/web/src/components/business/CountdownBadge.tsx
  - _Leverage: packages/web/src/components/ui_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer | Task: Create DashboardPage showing overview. Display stats: total events, today's notifications, upcoming (7 days). List next 5 upcoming events as EventCard components. EventCard shows title, target date, CountdownBadge (days remaining with color: red <=3, yellow <=7, green >7). Create CountdownBadge component. | Restrictions: Use React Query for data fetching. Show loading skeleton. Handle empty state. | Success: Dashboard shows stats and upcoming events. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 7.3 实现事件列表和表单页面
  - File: packages/web/src/pages/EventListPage.tsx
  - File: packages/web/src/pages/EventFormPage.tsx
  - File: packages/web/src/components/business/EventForm.tsx
  - File: packages/web/src/services/eventService.ts
  - File: packages/web/src/hooks/useEvents.ts
  - _Leverage: packages/web/src/components/ui, packages/web/src/components/business_
  - _Requirements: REQ-2, REQ-3_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer with forms expertise | Task: Create EventListPage with filterable event list. Add group filter dropdown. Display events as cards or table (toggle view). Add create button linking to /events/new. Create EventFormPage for create/edit (detect from route :id). EventForm with fields: title, content (textarea), targetDate (date picker), remindDays (number 1-30), groupId (select). Create eventService.ts with CRUD functions. Create useEvents hook using React Query for list/mutations. | Restrictions: Validate form fields. Show confirmation on delete. Handle optimistic updates. Date picker should not allow past dates for new events. | Success: User can create, edit, delete events. Filter by group works. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 7.4 实现分组管理页面
  - File: packages/web/src/pages/GroupListPage.tsx
  - File: packages/web/src/components/business/GroupTag.tsx
  - File: packages/web/src/services/groupService.ts
  - File: packages/web/src/hooks/useGroups.ts
  - _Leverage: packages/web/src/components/ui_
  - _Requirements: REQ-3_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer | Task: Create GroupListPage showing user's groups as cards. Each card shows name, color swatch, linked webhook name, event count. Add/edit via modal form (name, color picker, webhook select). GroupTag component for displaying group with color. Create groupService.ts and useGroups hook. | Restrictions: Color picker can be simple preset colors. Show warning on delete if group has events. | Success: User can manage groups with webhook binding. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 7.5 实现管理员页面 (Webhook 和用户管理)
  - File: packages/web/src/pages/WebhookListPage.tsx
  - File: packages/web/src/pages/UserListPage.tsx
  - File: packages/web/src/components/business/WebhookTestButton.tsx
  - File: packages/web/src/services/webhookService.ts
  - File: packages/web/src/services/userService.ts
  - _Leverage: packages/web/src/components/ui_
  - _Requirements: REQ-1, REQ-4_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer | Task: Create WebhookListPage (admin only) with table: name, URL (truncated), test button, actions. WebhookTestButton sends test and shows result toast. Add/edit via modal. Create UserListPage (admin only) with table: username, display name, role badge, status, actions. Add user via modal (username, password, displayName, role select). Edit excludes password. Create services and verify admin access (redirect if not admin). | Restrictions: Hide admin routes from non-admin sidebar. Mask webhook URL partially for security. Cannot delete self. | Success: Admin can manage webhooks and users. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 7.6 实现通知历史页面
  - File: packages/web/src/pages/NotificationHistoryPage.tsx
  - File: packages/web/src/components/business/NotificationItem.tsx
  - File: packages/web/src/services/notificationService.ts
  - _Leverage: packages/web/src/components/ui_
  - _Requirements: REQ-5_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Frontend Developer | Task: Create NotificationHistoryPage with paginated list. Filter by status (all, sent, failed, pending). NotificationItem shows: event title, scheduled date, sent time, status badge (green=sent, red=failed, yellow=pending), error message if failed. Implement infinite scroll or pagination buttons. Create notificationService.ts. | Restrictions: Sort by scheduled_date descending. Show relative time for recent items. | Success: User can view notification history with filtering. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 8: Docker 部署

- [x] 8.1 创建 Dockerfile 和构建配置
  - File: docker/Dockerfile
  - File: docker/docker-compose.yml
  - File: docker/.env.example
  - 多阶段构建
  - 生产环境配置
  - _Requirements: 部署_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: DevOps Engineer with Docker expertise | Task: Create multi-stage Dockerfile. Stage 1 (builder): install deps, build web (vite build) and server (tsc). Stage 2 (production): copy built files, install production deps only, use node:20-alpine. Serve static files from Express. Create docker-compose.yml with service, port 3000, volume for /app/data. Create .env.example with JWT_SECRET, NODE_ENV, NOTIFICATION_TIME (cron format). | Restrictions: Final image should be <200MB. Use non-root user. Ensure data directory is writable. | Success: `docker-compose up` starts application, data persists across restarts. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 8.2 添加生产环境静态文件服务
  - File: packages/server/src/index.ts (修改)
  - 配置 Express 服务静态文件
  - _Leverage: packages/server/src/app.ts_
  - _Requirements: 部署_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Backend Developer | Task: Modify server entry point to serve static files in production. If NODE_ENV=production, serve packages/web/dist as static files with express.static. Add catch-all route that returns index.html for SPA routing (exclude /api). | Restrictions: Only serve static files in production, not development. Set appropriate cache headers. | Success: Single container serves both API and frontend. Mark task in-progress before starting, log implementation after completion, then mark complete._

---

## Phase 9: 测试和完善

- [ ] 9.1 添加后端 API 测试
  - File: packages/server/src/__tests__/auth.test.ts
  - File: packages/server/src/__tests__/events.test.ts
  - 使用 Vitest + supertest
  - _Leverage: packages/server/src/routes_
  - _Requirements: All_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer with API testing expertise | Task: Set up Vitest for server package. Create auth.test.ts testing: login success, login failure, /me with valid token, /me without token. Create events.test.ts testing: list events, create event, update event, delete event. Use supertest for HTTP assertions. Set up test database (in-memory or separate file). | Restrictions: Clean database between tests. Mock external services (webhook). | Success: Tests pass, cover main API flows. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [ ] 9.2 添加前端组件测试
  - File: packages/web/src/__tests__/EventForm.test.tsx
  - 使用 Vitest + React Testing Library
  - _Leverage: packages/web/src/components_
  - _Requirements: REQ-2_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: QA Engineer with React testing expertise | Task: Set up Vitest for web package with jsdom environment. Create EventForm.test.tsx testing: renders form fields, validates required fields, submits with correct data, shows loading state. Mock API calls. | Restrictions: Use React Testing Library best practices (query by role/label). | Success: Component tests pass, verify user interactions. Mark task in-progress before starting, log implementation after completion, then mark complete._

- [x] 9.3 最终集成和文档
  - File: README.md
  - File: .env.example
  - 更新 CLAUDE.md
  - _Requirements: All_
  - _Prompt: Implement the task for spec event-noti, first run spec-workflow-guide to get the workflow guide then implement the task: Role: Technical Writer | Task: Create comprehensive README.md with: project description, features list, tech stack, quick start (Docker), development setup, environment variables, API documentation summary. Create root .env.example. Update CLAUDE.md with actual build/test commands and project structure. | Restrictions: Include both Docker and local development instructions. Add screenshots placeholders. | Success: New developer can set up project following README. Mark task in-progress before starting, log implementation after completion, then mark complete._
