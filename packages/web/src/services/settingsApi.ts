import api from './api';
import type { SystemSettings, UpdateTimezoneInput } from '@event-noti/shared';

interface SettingsResponse {
  data: SystemSettings;
  success: boolean;
}

// Get all settings
export async function getSettings(): Promise<SystemSettings> {
  const response = await api.get<SettingsResponse>('/settings');
  return response.data.data;
}

// Update timezone
export async function updateTimezone(input: UpdateTimezoneInput): Promise<SystemSettings> {
  const response = await api.put<SettingsResponse>('/settings/timezone', input);
  return response.data.data;
}
