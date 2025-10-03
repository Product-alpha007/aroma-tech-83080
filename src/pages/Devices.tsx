import { useState, useEffect } from "react";
import { Search, Filter, Plus, ChevronDown, ChevronUp, MapPin, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceCard } from "@/components/DeviceCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddDeviceModal } from "@/components/AddDeviceModal";
import { BulkOperationsModal } from "@/components/BulkOperationsModal";
import { BulkDeviceUploadModal } from "@/components/BulkDeviceUploadModal";
import { UserDeviceMappingModal } from "@/components/UserDeviceMappingModal";
import { DeviceGroupManagerModal } from "@/components/DeviceGroupManagerModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocations } from "@/contexts/LocationContext";
import { useDevices, useSharedDevices } from "@/hooks/useDevices";
import { useRealtimeDevices } from "@/hooks/useRealtimeDevices";
import { Device } from "@/lib/api";

export default function Devices() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // Fetch devices from API
  const { data: devicesResponse, isLoading, error } = useDevices(currentPage, pageSize);
  const devices = devicesResponse?.data?.records || [];
  
  // Fetch shared devices
  const { data: sharedDevicesResponse, isLoading: isLoadingShared } = useSharedDevices();
  const sharedDevices = sharedDevicesResponse?.data || [];
  const { locations, deviceGroupsWithDevices, isLoading: isLoadingGroups, addLocation, updateLocation, removeLocation, getDevicesByLocation } = useLocations();
  
  // Initialize real-time updates
  const { isConnected } = useRealtimeDevices();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"devices" | "locations">("devices");
  const [expandedLocations, setExpandedLocations] = useState<string[]>(["Location A", "Location B", "unmapped"]);
  const [showDeviceGroupManager, setShowDeviceGroupManager] = useState(false);
  
  // Debug logging for modal state
  console.log('🔍 Devices - showDeviceGroupManager:', showDeviceGroupManager);
  
  // Debug when state changes
  useEffect(() => {
    console.log('🔄 Devices - showDeviceGroupManager changed to:', showDeviceGroupManager);
  }, [showDeviceGroupManager]);
  const { toast } = useToast();


  const toggleLocation = (location: string) => {
    setExpandedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleAddDevice = (newDevice: { deviceId: string; name: string; location: string }) => {
    // This will be handled by the AddDeviceModal with API integration
    toast({
      title: "Device Added",
      description: `${newDevice.name} has been added successfully`,
    });
  };

  const handleAddLocation = (name: string) => {
    addLocation(name);
    setExpandedLocations(prev => [...prev, name]);
  };

  const handleBulkUpload = (newDevices: Array<{ deviceId: string; name: string; location: string }>) => {
    const devices: Device[] = newDevices.map(device => ({
      id: Date.now().toString() + Math.random(),
      name: device.name,
      sn: device.deviceId,
      status: "ONLINE" as const,
      remainInfoTotal: 1000,
      remainInfoCurrent: Math.floor(Math.random() * 1000),
      remainInfoDay: 7,
    }));
    
    // Add new locations if they don't exist
    const newLocations = newDevices
      .map(d => d.location)
      .filter(loc => loc !== "unmapped" && !locations.includes(loc));
    
    if (newLocations.length > 0) {
      newLocations.forEach(loc => addLocation(loc));
      setExpandedLocations(prev => [...prev, ...newLocations]);
    }
    
    // Note: Devices will be refreshed automatically via the API
  };



  // Combine regular devices and shared devices
  const allDevices = [...devices, ...sharedDevices];
  
  // Group devices by location using only device groups (API-based)
  const devicesByLocation = locations.reduce((acc, location) => {
    if (location === "Unmapped") {
      // Find devices that are not in any group
      const groupDeviceIds = (deviceGroupsWithDevices || []).flatMap(group => group.devices?.map(d => d.id) || []);
      const unmappedDevices = allDevices.filter(device => {
        const isInGroup = groupDeviceIds.includes(device.id);
        return !isInGroup;
      });
      acc[location] = unmappedDevices;
    } else {
      // Find devices in this group only
      const groupDeviceIds = getDevicesByLocation(location);
      const groupDevices = allDevices.filter(device => {
        const isInGroup = groupDeviceIds.includes(device.id);
        return isInGroup;
      });
      acc[location] = groupDevices;
    }
    return acc;
  }, {} as Record<string, Device[]>);

  // Filter locations and devices based on search
  const filteredData = () => {
    if (!searchQuery.trim()) {
      return devicesByLocation;
    }

    if (searchType === "locations") {
      const filteredLocations = [...locations, "unmapped"].filter(location =>
        location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return filteredLocations.reduce((acc, location) => {
        if (devicesByLocation[location]) {
          acc[location] = devicesByLocation[location];
        }
        return acc;
      }, {} as Record<string, Device[]>);
    } else {
      // Filter devices
      const result: Record<string, Device[]> = {};
      Object.entries(devicesByLocation).forEach(([location, devices]) => {
        const filteredDevices = devices.filter(device =>
          device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          device.sn.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredDevices.length > 0) {
          result[location] = filteredDevices;
        }
      });
      return result;
    }
  };


  const filteredDevicesByLocation = filteredData();
  
  // Sort locations to show unmapped last
  const sortedLocations = Object.entries(filteredDevicesByLocation).sort(([a], [b]) => {
    if (a === "unmapped") return 1;
    if (b === "unmapped") return -1;
    return a.localeCompare(b);
  });


  // Show loading state
  if (isLoading || isLoadingShared || isLoadingGroups) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40 overflow-hidden">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Devices & Locations</h1>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading devices...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40 overflow-hidden">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Devices & Locations</h1>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to load devices</h2>
              <p className="text-muted-foreground">Please try refreshing the page or contact support.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden smooth-scroll">
      {/* Sticky Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Title and Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Devices & Locations</h1>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  )} />
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {isConnected ? "Live" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              {/* Search Row */}
              <div className="flex items-center gap-2 w-full">
                <Select value={searchType} onValueChange={(value: "devices" | "locations") => setSearchType(value)}>
                  <SelectTrigger className="w-20 sm:w-24 lg:w-28 flex-shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devices">Devices</SelectItem>
                    <SelectItem value="locations">Locations</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Search ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full bg-background/50 border-border text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Action Buttons - Horizontal Scroll on Mobile */}
              <div className="w-full overflow-x-auto mobile-scroll -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max pb-1 sm:pb-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🖱️ Button clicked - setting showDeviceGroupManager to true');
                      setShowDeviceGroupManager(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">Manage Groups</span>
                    <span className="sm:hidden">Groups</span>
                  </Button>
                  <UserDeviceMappingModal 
                    devices={devices} 
                    locations={locations}
                    onAddLocation={handleAddLocation}
                  />
                  <BulkDeviceUploadModal onDevicesAdded={() => {
                    // The device list will automatically refresh due to React Query invalidation
                  }} />
                  {/* <BulkOperationsModal onBulkUpload={handleBulkUpload} /> */}
                  <AddDeviceModal
                    locations={locations}
                    onAddDevice={handleAddDevice}
                    onAddLocation={handleAddLocation}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Smooth Scrolling */}
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {sortedLocations.map(([location, devices]) => (
            <div
              key={location}
              className={cn(
                "border border-border rounded-lg overflow-hidden",
                "bg-card/30 backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "hover:shadow-lg hover:shadow-primary/5"
              )}
            >
              {/* Location Header */}
              <div
                className={cn(
                  "w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex items-center justify-between",
                  "hover:bg-card/50 transition-colors duration-200 cursor-pointer",
                  "touch-manipulation touch-target" // Better touch response
                )}
                onClick={() => toggleLocation(location)}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {location === "unmapped" ? (
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    )}
                    <h2 className={cn(
                      "text-sm sm:text-base lg:text-lg font-semibold truncate",
                      location === "unmapped" && "text-muted-foreground"
                    )}>
                      {location === "unmapped" ? "Unmapped Devices" : location}
                    </h2>
                    <Badge 
                      variant={location === "unmapped" ? "outline" : "secondary"} 
                      className="flex-shrink-0 text-xs"
                    >
                      {devices.length}
                    </Badge>
                  </div>
                  {expandedLocations.includes(location) ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </div>

              {/* Devices Grid - Responsive */}
              {expandedLocations.includes(location) && (
                <div className="px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
                  {devices.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">No devices in this location</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                      {devices.map((device) => (
                        <DeviceCard 
                          key={device.id} 
                          device={device} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {Object.keys(filteredDevicesByLocation).length === 0 && (
            <div className="text-center py-8 sm:py-12">
              <MapPin className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg sm:text-xl text-muted-foreground mb-2">
                No {searchType} found
              </p>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                {searchQuery ? `Try adjusting your search for "${searchQuery}"` : "Get started by adding your first device"}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Device Group Manager Modal */}
      <DeviceGroupManagerModal
        open={showDeviceGroupManager}
        onOpenChange={(open) => {
          console.log('🔄 DeviceGroupManagerModal onOpenChange called with:', open);
          setShowDeviceGroupManager(open);
        }}
      />
    </div>
  );
}