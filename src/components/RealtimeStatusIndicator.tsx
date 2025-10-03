import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Activity, Wifi, WifiOff } from 'lucide-react';

interface RealtimeStatusIndicatorProps {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE';
  lastSeen?: string;
  className?: string;
}

export function RealtimeStatusIndicator({ 
  deviceId, 
  status, 
  lastSeen, 
  className 
}: RealtimeStatusIndicatorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(lastSeen || null);

  useEffect(() => {
    // Simulate update animation when status changes
    if (lastSeen && lastSeen !== lastUpdate) {
      setIsUpdating(true);
      setLastUpdate(lastSeen);
      
      // Reset animation after 2 seconds
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [lastSeen, lastUpdate]);

  const getStatusColor = () => {
    if (status === 'ONLINE') {
      return isUpdating ? 'text-green-400' : 'text-green-500';
    }
    return 'text-red-500';
  };

  const getStatusIcon = () => {
    if (status === 'ONLINE') {
      return isUpdating ? (
        <Activity className="w-3 h-3 animate-pulse" />
      ) : (
        <Wifi className="w-3 h-3" />
      );
    }
    return <WifiOff className="w-3 h-3" />;
  };

  return (
    <div className={cn(
      "flex items-center gap-1",
      className
    )}>
      <div className={cn(
        "flex items-center gap-1 transition-all duration-300",
        getStatusColor(),
        isUpdating && "scale-110"
      )}>
        {getStatusIcon()}
        <span className="text-xs font-medium">
          {status === 'ONLINE' ? 'Online' : 'Offline'}
        </span>
      </div>
      {isUpdating && (
        <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
      )}
    </div>
  );
}
