import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aromaAPI, Device, DeviceListResponse, DeviceControlRequest, BatchControlRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { addDummyLocationData } from '@/lib/dummyData';

// Query keys
export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...deviceKeys.lists(), { page, pageSize }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  shared: () => [...deviceKeys.all, 'shared'] as const,
  sharedList: (subCustomerId?: string) => [...deviceKeys.shared(), { subCustomerId }] as const,
};

// Get devices list
export function useDevices(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: deviceKeys.list(page, pageSize),
    queryFn: async () => {
      console.log(`🔍 useDevices: Fetching devices (page: ${page}, pageSize: ${pageSize})`);
      const result = await aromaAPI.getDevices(page, pageSize);
      console.log(`📊 useDevices: Query result`, {
        success: result.success,
        dataLength: result.data?.records?.length || 0,
        total: result.data?.total || 0,
        error: result.error,
      });
      
      // Add dummy location data to devices
      if (result.success && result.data?.records) {
        const devicesWithLocations = addDummyLocationData(result.data.records);
        return {
          ...result,
          data: {
            ...result.data,
            records: devicesWithLocations
          }
        };
      }
      
      return result;
    },
    staleTime: 10000, // 10 seconds - data becomes stale quickly for real-time updates
    refetchInterval: 15000, // Auto-refetch every 15 seconds
    refetchIntervalInBackground: true, // Continue polling when tab is not active
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 2,
  });
}

// Get shared devices
export function useSharedDevices(subCustomerId?: string) {
  return useQuery({
    queryKey: deviceKeys.sharedList(subCustomerId),
    queryFn: async () => {
      console.log(`🔍 useSharedDevices: Fetching shared devices (subCustomerId: ${subCustomerId || 'all'})`);
      const result = await aromaAPI.getSharedDevices(subCustomerId);
      console.log(`📊 useSharedDevices: Query result`, {
        success: result.success,
        dataLength: result.data?.length || 0,
        error: result.error,
      });
      
      // Add dummy location data to shared devices
      if (result.success && result.data) {
        const devicesWithLocations = addDummyLocationData(result.data);
        return {
          ...result,
          data: devicesWithLocations
        };
      }
      
      return result;
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Auto-refetch every 15 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// Get single device details
export function useDevice(deviceId: string) {
  return useQuery({
    queryKey: deviceKeys.detail(deviceId),
    queryFn: async () => {
      console.log(`🔍 useDevice: Fetching device details (deviceId: ${deviceId})`);
      const result = await aromaAPI.getDeviceDetails(deviceId);
      console.log(`📊 useDevice: Query result`, {
        success: result.success,
        deviceName: result.data?.name || 'Unknown',
        deviceStatus: result.data?.status || 'Unknown',
        error: result.error,
      });
      
      // Add dummy location data to device
      if (result.success && result.data) {
        const deviceWithLocation = addDummyLocationData([result.data])[0];
        return {
          ...result,
          data: deviceWithLocation
        };
      }
      
      return result;
    },
    enabled: !!deviceId,
    staleTime: 10000, // 10 seconds for real-time updates
    refetchInterval: 15000, // Auto-refetch every 15 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

// Create device mutation
export function useCreateDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (device: Omit<Device, 'id'>) => aromaAPI.createDevice(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      toast({
        title: "Device Created",
        description: "Device has been successfully created",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create device",
        variant: "destructive",
      });
    },
  });
}

// Create device direct (using the correct API endpoint)
export function useCreateDeviceDirect() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (device: import('@/lib/api').DeviceCreateRequest) => aromaAPI.createDeviceDirect(device),
    onSuccess: (data) => {
      // Invalidate and refetch all device queries
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.shared() });
      
      toast({
        title: "Device Created",
        description: "Device has been successfully created",
      });
    },
    onError: (error: any) => {
      console.error('❌ Device creation failed:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create device",
        variant: "destructive",
      });
    },
  });
}

// Update device mutation
export function useUpdateDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ deviceId, updates }: { deviceId: string; updates: Partial<Device> }) =>
      aromaAPI.updateDevice(deviceId, updates),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(deviceId) });
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      toast({
        title: "Device Updated",
        description: "Device has been successfully updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update device",
        variant: "destructive",
      });
    },
  });
}

// Control device mutation
export function useControlDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: DeviceControlRequest) => {
      console.log(`🎮 useControlDevice: Controlling device`, {
        deviceId: request.id,
        frame: request.frame,
      });
      const result = await aromaAPI.controlDevice(request);
      console.log(`📊 useControlDevice: Control result`, {
        success: result.success,
        error: result.error,
      });
      return result;
    },
    onSuccess: () => {
      console.log(`✅ useControlDevice: Success - invalidating queries`);
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      toast({
        title: "Device Controlled",
        description: "Device command has been sent successfully",
      });
    },
    onError: (error: any) => {
      console.error(`❌ useControlDevice: Error`, error);
      toast({
        title: "Control Failed",
        description: error.message || "Failed to control device",
        variant: "destructive",
      });
    },
  });
}

// Batch control devices mutation
export function useBatchControlDevices() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: BatchControlRequest) => aromaAPI.batchControlDevices(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      toast({
        title: "Devices Controlled",
        description: "Batch device commands have been sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Batch Control Failed",
        description: error.message || "Failed to control devices",
        variant: "destructive",
      });
    },
  });
}

// Delete device mutation
export function useDeleteDevice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (deviceId: string) => aromaAPI.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      toast({
        title: "Device Deleted",
        description: "Device has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete device",
        variant: "destructive",
      });
    },
  });
}

// Share device mutation
export function useShareDevice() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: { deviceId: string; targetAccount: string }) =>
      aromaAPI.shareDevice(request),
    onSuccess: () => {
      toast({
        title: "Device Shared",
        description: "Device has been successfully shared",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Share Failed",
        description: error.message || "Failed to share device",
        variant: "destructive",
      });
    },
  });
}

