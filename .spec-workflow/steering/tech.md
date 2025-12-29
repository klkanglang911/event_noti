# Technology Stack

## Project Type

Web 应用 + 可选 Tauri 桌面客户端。主要作为 Docker 部署的 Web 服务运行，提供事件通知管理功能。

## Core Technologies

### Primary Language(s)
- **Frontend**: TypeScript 5.x
- **Backend**: Node.js 20 LTS + TypeScript
- **Runtime**: Node.js（后端）、浏览器（前端）

### Key Dependencies/Libraries

**Frontend**:
- **React 18**: UI 框架
- **Vite 5**: 构建工具，快速开发体验
- **Tailwind CSS 3**: 原子化 CSS 框架
- **Lucide React**: 图标库
- **React Router 6**: 路由管理
- **Zustand**: 轻量状态管理
- **React Query (TanStack Query)**: 服务端状态管理、数据缓存
- **dayjs**: 日期处理
- **Tauri 2** (可选): 桌面应用打包

**Backend**:
- **Express 4**: Web 框架
- **better-sqlite3**: SQLite 数据库驱动
- **node-cron**: 定时任务调度
- **bcrypt**: 密码加密
- **jsonwebtoken**: JWT 认证
- **axios**: HTTP 客户端（发送 Webhook）
- **zod**: 数据验证

### Application Architecture

前后端分离架构：
- **Frontend**: SPA 单页应用，响应式设计
- **Backend**: RESTful API 服务
- **Database**: SQLite 单文件数据库
- **Scheduler**: 后台定时任务服务

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│  Express API    │────▶│    SQLite DB    │
│  (React + Vite) │     │   (Node.js)     │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Scheduler     │────▶│  WeChat Webhook │
                        │  (node-cron)    │     │                 │
                        └─────────────────┘     └─────────────────┘
```

### Data Storage
- **Primary storage**: SQLite（单文件，便于备份和迁移）
- **Data formats**: JSON（API 通信）
- **File storage**: Docker volume 挂载 `/data` 目录

### External Integrations
- **APIs**: 企业微信机器人 Webhook API
- **Protocols**: HTTPS/REST
- **Authentication**: JWT Token（内部认证）

## Development Environment

### Build & Development Tools
- **Build System**: Vite（前端）、tsc（后端）
- **Package Management**: pnpm（monorepo 管理）
- **Development workflow**:
  - 前端热重载（Vite HMR）
  - 后端热重载（nodemon）
  - 并行开发（concurrently）

### Code Quality Tools
- **Static Analysis**: ESLint + TypeScript
- **Formatting**: Prettier
- **Testing Framework**: Vitest（单元测试）
- **API Testing**: Thunder Client / Postman

### Version Control & Collaboration
- **VCS**: Git
- **Branching Strategy**: GitHub Flow（main + feature branches）

## Deployment & Distribution

- **Target Platform(s)**: Linux VPS（Docker）
- **Distribution Method**: Docker 镜像
- **Installation Requirements**: Docker + Docker Compose
- **Update Mechanism**: Docker 镜像版本更新

### Docker 配置
```yaml
# 单容器部署
services:
  event-noti:
    image: event-noti:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - JWT_SECRET=xxx
```

## Technical Requirements & Constraints

### Performance Requirements
- API 响应时间 < 200ms
- 定时任务执行精度 ±1 分钟
- 支持 1000+ 通知事项

### Compatibility Requirements
- **Platform Support**: 现代浏览器（Chrome 90+, Firefox 90+, Safari 14+, Edge 90+）
- **Mobile**: iOS Safari, Android Chrome
- **Node.js**: 20 LTS

### Security & Compliance
- **Authentication**: JWT Token + HttpOnly Cookie
- **Password**: bcrypt 哈希存储
- **API Security**: 请求速率限制、输入验证

## Technical Decisions & Rationale

### Decision Log
1. **SQLite vs PostgreSQL**: 选择 SQLite，因为单用户/小团队场景足够，部署简单无需额外服务
2. **Express vs Fastify**: 选择 Express，生态成熟，学习资源丰富
3. **Zustand vs Redux**: 选择 Zustand，API 简洁，适合中小型应用
4. **pnpm Monorepo**: 前后端代码统一管理，共享类型定义

## Known Limitations

- **SQLite 并发**: 写入并发有限，适合中小规模使用
- **单容器部署**: 不支持水平扩展，需升级架构才能支持高可用
- **Webhook 依赖**: 依赖企业微信服务可用性
