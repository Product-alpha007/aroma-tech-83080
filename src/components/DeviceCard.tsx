import { useState } from "react";
import { MoreVertical, Droplet, Activity, MapPin, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DeviceDetailsModal } from "@/components/DeviceDetailsModal";

interface DeviceCardProps {
  device: {
    id: string;
    name: string;
    deviceId: string;
    status: "online" | "offline";
    fuelLevel: number;
    fuelRate: string;
    location: string;
  };
  locations?: string[];
  onMapDevice?: (deviceId: string, location: string) => void;
  onUnmapDevice?: (deviceId: string) => void;
}

export function DeviceCard({ device, locations = [], onMapDevice, onUnmapDevice }: DeviceCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Extend device data for the modal
  const extendedDevice = {
    ...device,
    serialNumber: "d427879e3b00",
    fuelCapacity: 400,
  };

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
                <p className="text-xs text-muted-foreground">ID: {device.deviceId}</p>
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
                <DropdownMenuItem>Configure</DropdownMenuItem>
                <DropdownMenuItem>Maintenance</DropdownMenuItem>
                <DropdownMenuSeparator />
                {device.location === "unmapped" && locations.length > 0 && onMapDevice && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <MapPin className="w-4 h-4 mr-2" />
                      Map to Location
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {locations.map((location) => (
                        <DropdownMenuItem 
                          key={location}
                          onClick={() => onMapDevice(device.id, location)}
                        >
                          {location}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                {device.location !== "unmapped" && onUnmapDevice && (
                  <DropdownMenuItem onClick={() => onUnmapDevice(device.id)}>
                    <Unlink className="w-4 h-4 mr-2" />
                    Unmap from Location
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Disable</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={device.status === "online" ? "online" : "offline"}>
                {device.status === "online" ? "Online" : "Offline"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fuel Rate</span>
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-sm font-medium">{device.fuelRate}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fuel Level</span>
                <span className="text-sm font-medium">{device.fuelLevel}%</span>
              </div>
              <Progress 
                value={device.fuelLevel} 
                className="h-2 bg-secondary"
              />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-radial opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      <DeviceDetailsModal 
        open={showDetails}
        onOpenChange={setShowDetails}
        device={extendedDevice}
      />
    </>
  );
}