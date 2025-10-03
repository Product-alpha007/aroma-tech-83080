import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { aromaAPI } from '@/lib/api';
import { deviceKeys } from './useDevices';

export function useRealtimeDevices() {
  const queryClient = useQueryClient();
  const isConnected = useRef(false);

  useEffect(() => {
    // Connect to WebSocket when component mounts
    if (!isConnected.current) {
      console.log('🔄 Initializing real-time device updates');
      aromaAPI.connectWebSocket();
      isConnected.current = true;
    }

    // Set up event listeners
    const handleDeviceUpdate = (data: any) => {
      console.log('📡 Real-time device update received:', data);
      
      // Invalidate and refetch device queries
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
      
      // Optionally update specific device data
      if (data.deviceId) {
        queryClient.invalidateQueries({ 
          queryKey: deviceKeys.detail(data.deviceId) 
        });
      }
    };

    const handleStatusChange = (data: any) => {
      console.log('📡 Device status change received:', data);
      
      // Update specific device status in cache
      if (data.deviceId && data.status) {
        queryClient.setQueryData(
          deviceKeys.detail(data.deviceId),
          (oldData: any) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  status: data.status,
                  lastSeen: data.lastSeen || new Date().toISOString()
                }
              };
            }
            return oldData;
          }
        );
        
        // Also invalidate the list to ensure consistency
        queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      }
    };

    const handleConnectionStatus = (data: any) => {
      console.log('🔌 WebSocket connection status:', data);
    };

    // Register event listeners
    aromaAPI.on('device_update', handleDeviceUpdate);
    aromaAPI.on('device_status_change', handleStatusChange);
    aromaAPI.on('connected', handleConnectionStatus);
    aromaAPI.on('disconnected', handleConnectionStatus);

    // Cleanup on unmount
    return () => {
      console.log('🔄 Cleaning up real-time device updates');
      aromaAPI.off('device_update', handleDeviceUpdate);
      aromaAPI.off('device_status_change', handleStatusChange);
      aromaAPI.off('connected', handleConnectionStatus);
      aromaAPI.off('disconnected', handleConnectionStatus);
      
      // Disconnect WebSocket when component unmounts
      aromaAPI.disconnectWebSocket();
      isConnected.current = false;
    };
  }, [queryClient]);

  return {
    isConnected: isConnected.current,
    subscribeToDevice: (deviceId: string) => aromaAPI.subscribeToDevice(deviceId),
    unsubscribeFromDevice: (deviceId: string) => aromaAPI.unsubscribeFromDevice(deviceId),
  };
}

// Hook for real-time device status monitoring
export function useRealtimeDeviceStatus(deviceId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!deviceId) return;

    const handleStatusUpdate = (data: any) => {
      if (data.deviceId === deviceId) {
        console.log(`📡 Status update for device ${deviceId}:`, data);
        
        // Update device status in cache
        queryClient.setQueryData(
          deviceKeys.detail(deviceId),
          (oldData: any) => {
            if (oldData?.data) {
              return {
                ...oldData,
                data: {
                  ...oldData.data,
                  status: data.status,
                  lastSeen: data.lastSeen || new Date().toISOString()
                }
              };
            }
            return oldData;
          }
        );
      }
    };

    // Subscribe to device updates
    aromaAPI.subscribeToDevice(deviceId);
    aromaAPI.on('device_status_change', handleStatusUpdate);

    return () => {
      aromaAPI.unsubscribeFromDevice(deviceId);
      aromaAPI.off('device_status_change', handleStatusUpdate);
    };
  }, [deviceId, queryClient]);
}
