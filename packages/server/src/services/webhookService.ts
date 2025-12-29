import axios from 'axios';
import * as webhookModel from '../models/webhookModel.ts';
import type { Webhook, CreateWebhookInput, UpdateWebhookInput } from '@event-noti/shared';

// Get all webhooks
export function getAllWebhooks(): Webhook[] {
  return webhookModel.findAll();
}

// Get webhook by ID
export function getWebhookById(id: number): Webhook | null {
  return webhookModel.findById(id);
}

// Get default webhook
export function getDefaultWebhook(): Webhook | null {
  return webhookModel.findDefault();
}

// Create webhook
export function createWebhook(userId: number, input: CreateWebhookInput): Webhook {
  // Validate URL format
  if (!isValidWebhookUrl(input.url)) {
    throw new Error('无效的 Webhook URL 格式');
  }

  return webhookModel.create(userId, input);
}

// Update webhook
export function updateWebhook(id: number, input: UpdateWebhookInput): Webhook | null {
  // Validate URL format if provided
  if (input.url && !isValidWebhookUrl(input.url)) {
    throw new Error('无效的 Webhook URL 格式');
  }

  return webhookModel.update(id, input);
}

// Delete webhook
export function deleteWebhook(id: number): { success: boolean; groupCount?: number } {
  const groupCount = webhookModel.getGroupsUsingWebhook(id);

  const success = webhookModel.remove(id);
  return { success, groupCount: success ? groupCount : undefined };
}

// Test webhook by sending a test message
export async function testWebhook(id: number): Promise<{ success: boolean; message: string }> {
  const webhook = webhookModel.findById(id);

  if (!webhook) {
    return { success: false, message: 'Webhook 不存在' };
  }

  try {
    const response = await axios.post(
      webhook.url,
      {
        msgtype: 'markdown',
        markdown: {
          content: `## 🔔 EventNoti 测试消息\n\n这是一条来自 **EventNoti** 的测试消息。\n\n> 时间: ${new Date().toLocaleString('zh-CN')}\n\n如果您看到此消息，说明 Webhook 配置正确！`,
        },
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data?.errcode === 0) {
      return { success: true, message: '测试消息发送成功' };
    } else {
      return {
        success: false,
        message: response.data?.errmsg || '发送失败，请检查 Webhook 配置',
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.errmsg || error.message || '请求失败',
      };
    }
    return { success: false, message: '发送失败' };
  }
}

// Send notification to webhook
export async function sendNotification(
  webhookUrl: string,
  title: string,
  content: string,
  daysRemaining: number
): Promise<{ success: boolean; error?: string }> {
  const urgency = daysRemaining <= 3 ? '🔴' : daysRemaining <= 7 ? '🟡' : '🟢';
  const dayText =
    daysRemaining === 0
      ? '**今天**'
      : daysRemaining < 0
        ? `**已过期 ${Math.abs(daysRemaining)} 天**`
        : `**还有 ${daysRemaining} 天**`;

  const message = {
    msgtype: 'markdown',
    markdown: {
      content: `${urgency} **${title}**\n\n> ${dayText}\n\n${content || ''}`,
    },
  };

  try {
    const response = await axios.post(webhookUrl, message, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data?.errcode === 0) {
      return { success: true };
    } else {
      return { success: false, error: response.data?.errmsg || '发送失败' };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return { success: false, error: error.message };
    }
    return { success: false, error: '发送失败' };
  }
}

// Validate webhook URL format (企业微信机器人)
function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // 企业微信机器人 URL 格式
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'qyapi.weixin.qq.com' &&
      parsed.pathname.startsWith('/cgi-bin/webhook/send')
    );
  } catch {
    return false;
  }
}

// Check if webhook is in use
export function isWebhookInUse(id: number): boolean {
  return webhookModel.isUsedByGroups(id);
}
