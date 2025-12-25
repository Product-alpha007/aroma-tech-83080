import { useQuery } from '@tanstack/react-query';

import { aromaAPI, DeviceGroupListAllResponse } from '@/lib/api';
import { MOCK_DEVICE_GROUPS } from '@/lib/dummyData';

export function useDeviceGroupsAll() {
  return useQuery<DeviceGroupListAllResponse>({
    queryKey: ['device-groups-all'],
    queryFn: async () => {
      const response = await aromaAPI.getDeviceGroupsAll();
      if (response.success && response.data) {
        return response.data;
      }
      
      // Return mock data if API fails (for testing without auth)
      console.log('⚠️ useDeviceGroupsAll: API failed, returning mock data');
      return {
        groups: MOCK_DEVICE_GROUPS,
        total_groups: MOCK_DEVICE_GROUPS.length,
        main_groups: MOCK_DEVICE_GROUPS.filter(g => g.type === 'main').length,
        sub_groups: MOCK_DEVICE_GROUPS.filter(g => g.type === 'sub').length,
        devices_by_group: {
          main: {},
          sub: {},
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change frequently
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 1,
  });
}
