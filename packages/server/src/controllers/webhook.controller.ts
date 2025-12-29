import type { Request, Response } from 'express';
import { z } from 'zod';
import * as webhookService from '../services/webhookService.ts';
import { ERROR_CODES } from '@event-noti/shared';

// Validation schemas
const createWebhookSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  url: z.string().url('URL 格式无效'),
  isDefault: z.boolean().optional(),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  url: z.string().url().optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/webhooks - List webhooks
export function listWebhooks(_req: Request, res: Response): void {
  const webhooks = webhookService.getAllWebhooks();
  res.json({ data: webhooks, success: true });
}

// GET /api/webhooks/:id - Get webhook
export function getWebhook(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的 Webhook ID' },
      success: false,
    });
    return;
  }

  const webhook = webhookService.getWebhookById(id);

  if (!webhook) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Webhook 不存在' },
      success: false,
    });
    return;
  }

  res.json({ data: webhook, success: true });
}

// POST /api/webhooks - Create webhook
export function createWebhook(req: Request, res: Response): void {
  const userId = req.user!.id;

  const parseResult = createWebhookSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: parseResult.error.issues[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const webhook = webhookService.createWebhook(userId, parseResult.data);
    res.status(201).json({ data: webhook, success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Webhook URL')) {
      res.status(400).json({
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}

// PUT /api/webhooks/:id - Update webhook
export function updateWebhook(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的 Webhook ID' },
      success: false,
    });
    return;
  }

  const parseResult = updateWebhookSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: parseResult.error.issues[0].message,
      },
      success: false,
    });
    return;
  }

  try {
    const webhook = webhookService.updateWebhook(id, parseResult.data);

    if (!webhook) {
      res.status(404).json({
        error: { code: ERROR_CODES.NOT_FOUND, message: 'Webhook 不存在' },
        success: false,
      });
      return;
    }

    res.json({ data: webhook, success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Webhook URL')) {
      res.status(400).json({
        error: { code: ERROR_CODES.VALIDATION_ERROR, message: error.message },
        success: false,
      });
      return;
    }
    throw error;
  }
}

// DELETE /api/webhooks/:id - Delete webhook
export function deleteWebhook(req: Request, res: Response): void {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的 Webhook ID' },
      success: false,
    });
    return;
  }

  const result = webhookService.deleteWebhook(id);

  if (!result.success) {
    res.status(404).json({
      error: { code: ERROR_CODES.NOT_FOUND, message: 'Webhook 不存在' },
      success: false,
    });
    return;
  }

  res.json({
    data: {
      message: 'Webhook 已删除',
      groupsAffected: result.groupCount,
    },
    success: true,
  });
}

// POST /api/webhooks/:id/test - Test webhook
export async function testWebhook(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({
      error: { code: ERROR_CODES.INVALID_INPUT, message: '无效的 Webhook ID' },
      success: false,
    });
    return;
  }

  const result = await webhookService.testWebhook(id);

  if (!result.success) {
    res.status(400).json({
      error: { code: ERROR_CODES.WEBHOOK_FAILED, message: result.message },
      success: false,
    });
    return;
  }

  res.json({ data: { message: result.message }, success: true });
}
