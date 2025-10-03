import { useQuery } from '@tanstack/react-query';

import { aromaAPI, DeviceGroupListAllResponse } from '@/lib/api';

export function useDeviceGroupsAll() {
  return useQuery<DeviceGroupListAllResponse>({
    queryKey: ['device-groups-all'],
    queryFn: async () => {
      const response = await aromaAPI.getDeviceGroupsAll();
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch device groups');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change frequently
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
  });
}
