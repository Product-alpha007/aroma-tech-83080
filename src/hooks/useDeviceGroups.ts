import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aromaAPI, DeviceGroup, DeviceGroupCreateRequest, DeviceGroupUpdateRequest } from '@/lib/api';

export const deviceGroupKeys = {
  all: ['deviceGroups'] as const,
  lists: () => [...deviceGroupKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...deviceGroupKeys.lists(), { filters }] as const,
  details: () => [...deviceGroupKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceGroupKeys.details(), id] as const,
};

export function useDeviceGroups(page: number = 1, pageSize: number = 100) {
  return useQuery({
    queryKey: deviceGroupKeys.list({ page, pageSize }),
    queryFn: async () => {
      console.log('🔍 Fetching device groups...', { page, pageSize });
      const response = await aromaAPI.getDeviceGroups(page, pageSize);
      console.log('📊 Device groups API response:', response);
      console.log('📊 Response success:', response.success);
      console.log('📊 Response data:', response.data);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data is array:', Array.isArray(response.data));
      
      if (response.success && response.data) {
        // Handle paginated response structure
        const groups = Array.isArray(response.data) ? response.data : response.data.records || [];
        console.log('✅ Device groups fetched successfully:', groups);
        console.log('✅ Groups length:', groups.length);
        return groups;
      }
      console.log('❌ Failed to fetch device groups:', response.error);
      throw new Error(response.error || 'Failed to fetch device groups');
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change frequently
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
  });
}

export function useDeviceGroupDetail(groupId: string) {
  return useQuery({
    queryKey: deviceGroupKeys.detail(groupId),
    queryFn: async () => {
      const response = await aromaAPI.getDeviceGroupDetail(groupId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch device group details');
    },
    enabled: !!groupId,
    staleTime: 10 * 60 * 1000, // 10 minutes - groups don't change frequently
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2,
  });
}

export function useCreateDeviceGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: DeviceGroupCreateRequest) => {
      console.log('🔨 Creating device group:', request);
      const response = await aromaAPI.createDeviceGroup(request);
      console.log('📊 Create device group response:', response);
      
      if (response.success && response.data) {
        console.log('✅ Device group created successfully:', response.data);
        return response.data;
      }
      console.log('❌ Failed to create device group:', response.error);
      throw new Error(response.error || 'Failed to create device group');
    },
    onSuccess: (data) => {
      console.log('🔄 Invalidating device groups cache after creation...');
      queryClient.invalidateQueries({ queryKey: deviceGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['device-groups-all'] });
      // Force a refetch to ensure the new group appears immediately
      queryClient.refetchQueries({ queryKey: deviceGroupKeys.lists() });
      queryClient.refetchQueries({ queryKey: ['device-groups-all'] });
      console.log('✅ Cache invalidated and refetched successfully');
    },
  });
}

export function useUpdateDeviceGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: DeviceGroupUpdateRequest) => {
      if (!request.id) {
        throw new Error('Group ID is required for update');
      }
      const response = await aromaAPI.updateDeviceGroup(request.id, request);
      if (response.success && response.data) {
        return response.data;
      }
      
      // Handle specific Chinese error messages
      let errorMessage = response.error || 'Failed to update device group';
      if (errorMessage.includes('设备组无法编辑')) {
        errorMessage = 'This device group cannot be edited. It may be a system group or have restrictions.';
      }
      
      throw new Error(errorMessage);
    },
    onMutate: async (request: DeviceGroupUpdateRequest) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['device-groups-all'] });
      await queryClient.cancelQueries({ queryKey: deviceGroupKeys.lists() });

      // Snapshot the previous value
      const previousGroupsAll = queryClient.getQueryData(['device-groups-all']);
      const previousGroups = queryClient.getQueryData(deviceGroupKeys.lists());

      // Optimistically update the cache
      queryClient.setQueryData(['device-groups-all'], (old: any) => {
        if (!old?.groups) return old;
        return {
          ...old,
          groups: old.groups.map((group: any) => 
            group.id === request.id 
              ? { ...group, name: request.name, description: request.description }
              : group
          )
        };
      });

      queryClient.setQueryData(deviceGroupKeys.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          records: old.records?.map((group: any) => 
            group.id === request.id 
              ? { ...group, name: request.name, description: request.description }
              : group
          ) || old.records
        };
      });

      // Return a context object with the snapshotted value
      return { previousGroupsAll, previousGroups };
    },
    onError: (err, request, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousGroupsAll) {
        queryClient.setQueryData(['device-groups-all'], context.previousGroupsAll);
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(deviceGroupKeys.lists(), context.previousGroups);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: deviceGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['device-groups-all'] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: deviceGroupKeys.detail(data.id) });
      }
    },
  });
}

export function useDeleteDeviceGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await aromaAPI.deleteDeviceGroup(groupId);
      if (response.success) {
        return groupId;
      }
      throw new Error(response.error || 'Failed to delete device group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceGroupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['device-groups-all'] });
      // Force a refetch to ensure the list is updated immediately
      queryClient.refetchQueries({ queryKey: deviceGroupKeys.lists() });
      queryClient.refetchQueries({ queryKey: ['device-groups-all'] });
    },
  });
}