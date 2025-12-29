# EventNoti - 事件通知管理平台

一个用于管理事件通知并通过企业微信 Webhook 发送提醒的 Web 应用。

## 功能特性

- **事件管理**: 创建、编辑、删除事件，支持分组管理
- **智能提醒**: 支持设置提前 1-30 天开始提醒，每天发送直到目标日期
- **企业微信集成**: 通过 Webhook 发送通知到企业微信群
- **多用户支持**: 管理员可创建和管理用户账户
- **通知历史**: 查看通知发送记录和状态
- **响应式设计**: 支持桌面和移动端访问

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- React Query (TanStack Query)
- Zustand (状态管理)
- React Router v6
- Lucide React (图标)

### 后端
- Node.js 20+
- Express 5
- better-sqlite3 (SQLite)
- node-cron (定时任务)
- JWT (身份认证)
- Zod (数据验证)

## 快速开始

### 使用 Docker (推荐)

1. 克隆项目
```bash
git clone <repository-url>
cd event-noti
```

2. 创建环境配置
```bash
cp .env.example .env
# 编辑 .env 文件，设置 JWT_SECRET
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 打开浏览器访问 http://localhost:3000
- 默认管理员账户: `admin` / `admin123`

### 本地开发

1. 安装依赖
```bash
# 需要 Node.js 20+ 和 pnpm 8+
pnpm install
```

2. 创建环境配置
```bash
cp .env.example packages/server/.env
# 编辑 .env 文件
```

3. 启动开发服务器
```bash
# 同时启动前端和后端
pnpm dev

# 或分别启动
pnpm dev:web    # 前端 (http://localhost:5173)
pnpm dev:server # 后端 (http://localhost:3000)
```

4. 构建生产版本
```bash
pnpm build
```

## 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_PATH` | 数据库文件路径 | `./data/event_noti.db` |
| `JWT_SECRET` | JWT 签名密钥 | (必须设置) |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `7d` |
| `FRONTEND_URL` | 前端 URL (开发环境 CORS) | `http://localhost:5173` |

## 项目结构

```
event-noti/
├── packages/
│   ├── web/              # 前端 React 应用
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── hooks/       # React Query hooks
│   │   │   ├── layouts/     # 页面布局
│   │   │   ├── pages/       # 页面组件
│   │   │   ├── services/    # API 服务
│   │   │   └── stores/      # Zustand stores
│   │   └── ...
│   ├── server/           # 后端 Express 应用
│   │   ├── src/
│   │   │   ├── controllers/ # 控制器
│   │   │   ├── db/          # 数据库配置
│   │   │   ├── middlewares/ # 中间件
│   │   │   ├── models/      # 数据模型
│   │   │   ├── routes/      # API 路由
│   │   │   ├── scheduler/   # 定时任务
│   │   │   └── services/    # 业务服务
│   │   └── ...
│   └── shared/           # 共享类型和常量
├── docker-compose.yml    # Docker 编排配置
├── Dockerfile           # 多阶段构建配置
└── ...
```

## API 文档

### 认证

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |

### 事件

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/events` | GET | 获取事件列表 |
| `/api/events` | POST | 创建事件 |
| `/api/events/:id` | GET | 获取单个事件 |
| `/api/events/:id` | PUT | 更新事件 |
| `/api/events/:id` | DELETE | 删除事件 |

### 分组

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/groups` | GET | 获取分组列表 |
| `/api/groups` | POST | 创建分组 |
| `/api/groups/:id` | PUT | 更新分组 |
| `/api/groups/:id` | DELETE | 删除分组 |

### Webhook (管理员)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/webhooks` | GET | 获取 Webhook 列表 |
| `/api/webhooks` | POST | 创建 Webhook |
| `/api/webhooks/:id` | PUT | 更新 Webhook |
| `/api/webhooks/:id` | DELETE | 删除 Webhook |
| `/api/webhooks/:id/test` | POST | 测试 Webhook |

### 用户 (管理员)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/users` | GET | 获取用户列表 |
| `/api/users` | POST | 创建用户 |
| `/api/users/:id` | PUT | 更新用户 |
| `/api/users/:id` | DELETE | 删除用户 |

### 通知

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/notifications` | GET | 获取通知历史 |
| `/api/notifications/stats` | GET | 获取通知统计 |
| `/api/notifications/:id/retry` | POST | 重试失败通知 |

## 定时任务

- **通知发送**: 每天 09:00 检查并发送当日通知
- **事件过期**: 每天 10:00 标记过期事件
- **失败重试**: 失败的通知会自动重试最多 3 次

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm lint
pnpm lint:fix

# 格式化代码
pnpm format
```

## 许可证

MIT License
