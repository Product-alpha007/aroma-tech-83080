import { useState, useMemo } from "react";
import { MoreVertical, Droplet, Activity, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DeviceDetailsModal } from "@/components/DeviceDetailsModal";
import { RealtimeStatusIndicator } from "@/components/RealtimeStatusIndicator";
import { Device } from "@/lib/api";

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get the current location for this device (from API data)
  const currentLocation = device.location || device.address || device.city || 'unmapped';

  // Extend device data for the modal - memoized to prevent unnecessary re-renders
  const extendedDevice = useMemo(() => ({
    ...device,
    deviceId: device.sn,
    serialNumber: device.sn,
    fuelLevel: device.remainInfoTotal && device.remainInfoCurrent 
      ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
      : 0,
    fuelCapacity: device.remainInfoTotal || 400,
    fuelRate: "10 mL/Hr", // Default value since not in API response
    location: currentLocation,
    status: device.status === "ONLINE" ? "online" : "offline" as "online" | "offline",
  }), [device, currentLocation]);

  return (
    <>
      <div className={cn(
        "group relative overflow-hidden rounded-lg border border-border",
        "bg-gradient-card backdrop-blur-sm",
        "hover:border-primary/30 hover:shadow-glow",
        "transition-all duration-300 animate-fade-in"
      )}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-gradient-glass border border-primary/20",
                "group-hover:scale-110 transition-transform duration-300"
              )}>
                <Droplet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">{device.name}</h3>
                <p className="text-xs text-muted-foreground">SN: {device.sn}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <RealtimeStatusIndicator 
                deviceId={device.id}
                status={device.status}
                lastSeen={device.onlineTime ? new Date(device.onlineTime).toISOString() : undefined}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Remaining Days</span>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium">{device.remainInfoDay || 0} days</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fuel Level</span>
                <span className="text-sm font-medium">
                  {device.remainInfoTotal && device.remainInfoCurrent 
                    ? Math.round((device.remainInfoCurrent / device.remainInfoTotal) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={device.remainInfoTotal && device.remainInfoCurrent 
                  ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
                  : 0} 
                className="h-2 bg-secondary"
              />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-radial opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      <DeviceDetailsModal 
        key={device.id}
        open={showDetails}
        onOpenChange={setShowDetails}
        device={extendedDevice}
      />

    </>
  );
}