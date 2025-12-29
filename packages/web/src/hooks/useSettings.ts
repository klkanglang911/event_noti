import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as settingsApi from '@/services/settingsApi';
import type { UpdateTimezoneInput } from '@event-noti/shared';

// Query keys
const SETTINGS_KEY = ['settings'];

// Get settings
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: settingsApi.getSettings,
  });
}

// Update timezone
export function useUpdateTimezone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTimezoneInput) => settingsApi.updateTimezone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
