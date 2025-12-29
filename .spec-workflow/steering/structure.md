# Project Structure

## Directory Organization

```
event-noti/
├── packages/
│   ├── web/                    # 前端 React 应用
│   │   ├── src/
│   │   │   ├── components/     # 可复用组件
│   │   │   │   ├── ui/         # 基础 UI 组件
│   │   │   │   └── business/   # 业务组件
│   │   │   ├── pages/          # 页面组件
│   │   │   ├── hooks/          # 自定义 Hooks
│   │   │   ├── stores/         # Zustand 状态管理
│   │   │   ├── services/       # API 请求服务
│   │   │   ├── types/          # TypeScript 类型定义
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── styles/         # 全局样式
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   ├── server/                 # 后端 Express 应用
│   │   ├── src/
│   │   │   ├── controllers/    # 请求处理器
│   │   │   ├── services/       # 业务逻辑层
│   │   │   ├── models/         # 数据模型
│   │   │   ├── middlewares/    # 中间件
│   │   │   ├── routes/         # 路由定义
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── types/          # TypeScript 类型定义
│   │   │   ├── scheduler/      # 定时任务
│   │   │   ├── db/             # 数据库相关
│   │   │   │   ├── schema.sql  # 表结构
│   │   │   │   └── index.ts    # 数据库连接
│   │   │   ├── app.ts          # Express 应用配置
│   │   │   └── index.ts        # 入口文件
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                 # 共享代码
│       ├── src/
│       │   ├── types/          # 共享类型定义
│       │   └── constants/      # 共享常量
│       └── package.json
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── data/                       # 数据目录（gitignore）
│   └── event-noti.db
│
├── .spec-workflow/             # 规范工作流文档
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .gitignore
├── .env.example
└── README.md
```

## Naming Conventions

### Files
- **Components**: `PascalCase.tsx`（如 `EventCard.tsx`）
- **Pages**: `PascalCase.tsx`（如 `Dashboard.tsx`）
- **Hooks**: `camelCase.ts`，以 `use` 开头（如 `useEvents.ts`）
- **Services**: `camelCase.ts`（如 `eventService.ts`）
- **Utils**: `camelCase.ts`（如 `dateUtils.ts`）
- **Types**: `camelCase.ts`（如 `event.ts`）
- **Controllers**: `camelCase.controller.ts`（如 `event.controller.ts`）
- **Routes**: `camelCase.routes.ts`（如 `event.routes.ts`）

### Code
- **Classes/Types/Interfaces**: `PascalCase`（如 `EventItem`, `UserRole`）
- **Functions/Methods**: `camelCase`（如 `createEvent`, `sendNotification`）
- **Constants**: `UPPER_SNAKE_CASE`（如 `MAX_RETRY_COUNT`）
- **Variables**: `camelCase`（如 `eventList`, `isLoading`）
- **Database Tables**: `snake_case`（如 `event_items`, `webhook_configs`）
- **API Endpoints**: `kebab-case`（如 `/api/events`, `/api/webhook-configs`）

## Import Patterns

### Import Order
```typescript
// 1. Node.js 内置模块
import path from 'path';

// 2. 外部依赖
import express from 'express';
import { z } from 'zod';

// 3. 内部模块（绝对路径）
import { EventService } from '@/services/eventService';
import { Event } from '@shared/types';

// 4. 相对导入
import { formatDate } from './utils';

// 5. 样式导入（前端）
import './styles.css';
```

### Module/Package Organization
- 使用 TypeScript Path Aliases：
  - `@/*` → `packages/web/src/*` 或 `packages/server/src/*`
  - `@shared/*` → `packages/shared/src/*`

## Code Structure Patterns

### React Component Structure
```typescript
// 1. 导入
import { useState } from 'react';

// 2. 类型定义
interface Props {
  event: Event;
}

// 3. 组件定义
export function EventCard({ event }: Props) {
  // 3.1 Hooks
  const [isOpen, setIsOpen] = useState(false);

  // 3.2 事件处理函数
  const handleClick = () => {};

  // 3.3 渲染
  return <div>...</div>;
}
```

### Express Controller Structure
```typescript
// 1. 导入
import { Request, Response } from 'express';
import { eventService } from '@/services/eventService';

// 2. 控制器函数
export async function getEvents(req: Request, res: Response) {
  // 2.1 参数提取与验证
  const { groupId } = req.query;

  // 2.2 业务逻辑调用
  const events = await eventService.getEvents(groupId);

  // 2.3 响应返回
  res.json({ data: events });
}
```

## Code Organization Principles

1. **Single Responsibility**: 每个文件只做一件事
2. **Modularity**: 按功能模块组织，便于复用
3. **Testability**: 业务逻辑与 I/O 分离，便于测试
4. **Consistency**: 遵循已建立的模式和约定

## Module Boundaries

- **web** → **shared**: 前端可导入共享类型
- **server** → **shared**: 后端可导入共享类型
- **web** ✗ **server**: 前后端不直接依赖
- **shared**: 不依赖任何其他包

## Code Size Guidelines

- **File size**: 单文件不超过 300 行
- **Function/Method size**: 单函数不超过 50 行
- **Component complexity**: 单组件不超过 200 行，复杂时拆分
- **Nesting depth**: 最大 3-4 层嵌套

## API Endpoint Structure

```
/api
├── /auth
│   ├── POST   /login          # 用户登录
│   └── POST   /logout         # 用户登出
├── /users
│   ├── GET    /               # 获取用户列表（管理员）
│   ├── POST   /               # 创建用户（管理员）
│   ├── PUT    /:id            # 更新用户
│   └── DELETE /:id            # 删除用户（管理员）
├── /events
│   ├── GET    /               # 获取事件列表
│   ├── POST   /               # 创建事件
│   ├── GET    /:id            # 获取事件详情
│   ├── PUT    /:id            # 更新事件
│   └── DELETE /:id            # 删除事件
├── /groups
│   ├── GET    /               # 获取分组列表
│   ├── POST   /               # 创建分组
│   ├── PUT    /:id            # 更新分组
│   └── DELETE /:id            # 删除分组
├── /webhooks
│   ├── GET    /               # 获取 Webhook 列表（管理员）
│   ├── POST   /               # 创建 Webhook（管理员）
│   ├── PUT    /:id            # 更新 Webhook（管理员）
│   ├── DELETE /:id            # 删除 Webhook（管理员）
│   └── POST   /:id/test       # 测试 Webhook
└── /notifications
    └── GET    /history        # 获取通知历史
```

## Documentation Standards

- 公共 API 必须有 JSDoc 注释
- 复杂业务逻辑需要行内注释说明
- 每个包的 README 说明用途和使用方法
