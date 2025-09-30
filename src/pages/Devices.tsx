import { useState } from "react";
import { Search, Filter, Plus, ChevronDown, ChevronUp, MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceCard } from "@/components/DeviceCard";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddDeviceModal } from "@/components/AddDeviceModal";
import { AddLocationModal } from "@/components/AddLocationModal";
import { BulkOperationsModal } from "@/components/BulkOperationsModal";
import { LocationManagerModal } from "@/components/LocationManagerModal";
import { UserDeviceMappingModal } from "@/components/UserDeviceMappingModal";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  deviceId: string;
  status: "online" | "offline";
  fuelLevel: number;
  fuelRate: string;
  location: string;
}

const initialDevicesData: Device[] = [
  {
    id: "1",
    name: "Aryan Mittal's Room Diffuser",
    deviceId: "273894643664",
    status: "online",
    fuelLevel: 70,
    fuelRate: "10 mL/Hr",
    location: "Location A",
  },
  {
    id: "2",
    name: "Office Reception Diffuser",
    deviceId: "273894643665",
    status: "online",
    fuelLevel: 45,
    fuelRate: "8 mL/Hr",
    location: "Location A",
  },
  {
    id: "3",
    name: "Conference Room Diffuser",
    deviceId: "273894643666",
    status: "offline",
    fuelLevel: 20,
    fuelRate: "12 mL/Hr",
    location: "Location B",
  },
  {
    id: "4",
    name: "Lobby Area Diffuser",
    deviceId: "273894643667",
    status: "online",
    fuelLevel: 85,
    fuelRate: "10 mL/Hr",
    location: "Location B",
  },
  {
    id: "5",
    name: "Unmapped Device 1",
    deviceId: "273894643668",
    status: "online",
    fuelLevel: 60,
    fuelRate: "9 mL/Hr",
    location: "unmapped",
  },
];

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>(initialDevicesData);
  const [locations, setLocations] = useState<string[]>(["Location A", "Location B"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"devices" | "locations">("devices");
  const [expandedLocations, setExpandedLocations] = useState<string[]>(["Location A", "Location B", "unmapped"]);
  const { toast } = useToast();

  const toggleLocation = (location: string) => {
    setExpandedLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleAddDevice = (newDevice: { deviceId: string; name: string; location: string }) => {
    const device: Device = {
      id: Date.now().toString(),
      name: newDevice.name,
      deviceId: newDevice.deviceId,
      status: "online",
      fuelLevel: 100,
      fuelRate: "10 mL/Hr",
      location: newDevice.location,
    };
    setDevices(prev => [...prev, device]);
  };

  const handleAddLocation = (name: string) => {
    if (!locations.includes(name) && name !== "unmapped") {
      setLocations(prev => [...prev, name]);
      setExpandedLocations(prev => [...prev, name]);
    }
  };

  const handleBulkUpload = (newDevices: Array<{ deviceId: string; name: string; location: string }>) => {
    const devices: Device[] = newDevices.map(device => ({
      id: Date.now().toString() + Math.random(),
      name: device.name,
      deviceId: device.deviceId,
      status: "online" as const,
      fuelLevel: Math.floor(Math.random() * 100),
      fuelRate: "10 mL/Hr",
      location: device.location,
    }));
    
    // Add new locations if they don't exist
    const newLocations = newDevices
      .map(d => d.location)
      .filter(loc => loc !== "unmapped" && !locations.includes(loc));
    
    if (newLocations.length > 0) {
      setLocations(prev => [...prev, ...newLocations]);
      setExpandedLocations(prev => [...prev, ...newLocations]);
    }
    
    setDevices(prev => [...prev, ...devices]);
  };

  const handleEditLocation = (oldName: string, newName: string) => {
    setLocations(prev => prev.map(loc => loc === oldName ? newName : loc));
    setDevices(prev => prev.map(device => 
      device.location === oldName ? { ...device, location: newName } : device
    ));
    setExpandedLocations(prev => prev.map(loc => loc === oldName ? newName : loc));
  };

  const handleDeleteLocation = (name: string) => {
    setLocations(prev => prev.filter(loc => loc !== name));
    setDevices(prev => prev.map(device => 
      device.location === name ? { ...device, location: "unmapped" } : device
    ));
    setExpandedLocations(prev => prev.filter(loc => loc !== name));
  };

  const handleMapDevice = (deviceId: string, location: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, location } : device
    ));
    toast({
      title: "Device Mapped",
      description: `Device has been mapped to ${location}`,
    });
  };

  const handleUnmapDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    setDevices(prev => prev.map(device => 
      device.id === deviceId ? { ...device, location: "unmapped" } : device
    ));
    toast({
      title: "Device Unmapped",
      description: `${device?.name} has been unmapped from its location`,
    });
  };

  // Group devices by location
  const devicesByLocation = devices.reduce((acc, device) => {
    const location = device.location;
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(device);
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
          device.deviceId.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredDevices.length > 0) {
          result[location] = filteredDevices;
        }
      });
      return result;
    }
  };

  const locationStats = locations.map(location => ({
    name: location,
    deviceCount: devicesByLocation[location]?.length || 0,
  }));

  const filteredDevicesByLocation = filteredData();
  
  // Sort locations to show unmapped last
  const sortedLocations = Object.entries(filteredDevicesByLocation).sort(([a], [b]) => {
    if (a === "unmapped") return 1;
    if (b === "unmapped") return -1;
    return a.localeCompare(b);
  });

  const unmappedDevices = devices.filter(device => device.location === "unmapped");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Devices & Locations</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Select value={searchType} onValueChange={(value: "devices" | "locations") => setSearchType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="devices">Devices</SelectItem>
                    <SelectItem value="locations">Locations</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={`Search ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-background/50 border-border"
                  />
                </div>
              </div>
              <UserDeviceMappingModal 
                devices={devices} 
                locations={locations}
                onAddLocation={handleAddLocation}
              />
              <BulkOperationsModal onBulkUpload={handleBulkUpload} />
              <LocationManagerModal
                locations={locationStats}
                onEditLocation={handleEditLocation}
                onDeleteLocation={handleDeleteLocation}
              />
              <AddLocationModal onAddLocation={handleAddLocation} />
              <AddDeviceModal
                locations={locations}
                onAddDevice={handleAddDevice}
                onAddLocation={handleAddLocation}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {sortedLocations.map(([location, devices]) => (
            <div
              key={location}
              className={cn(
                "border border-border rounded-lg overflow-hidden",
                "bg-card/30 backdrop-blur-sm",
                "animate-fade-in"
              )}
            >
              <div
                className={cn(
                  "w-full px-6 py-4 flex items-center justify-between",
                  "hover:bg-card/50 transition-colors duration-200"
                )}
              >
                <button
                  onClick={() => toggleLocation(location)}
                  className="flex items-center gap-3 flex-1"
                >
                  <div className="flex items-center gap-3">
                    {location === "unmapped" ? (
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <MapPin className="w-5 h-5 text-primary" />
                    )}
                    <h2 className={cn(
                      "text-lg font-semibold",
                      location === "unmapped" && "text-muted-foreground"
                    )}>
                      {location === "unmapped" ? "Unmapped Devices" : location}
                    </h2>
                    <Badge variant={location === "unmapped" ? "outline" : "secondary"}>
                      {devices.length}
                    </Badge>
                  </div>
                  {expandedLocations.includes(location) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
              </div>

              {expandedLocations.includes(location) && (
                <div className="px-6 pb-6">
                  {devices.length === 0 && location !== "unmapped" && unmappedDevices.length > 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No devices in this location</p>
                      <Select onValueChange={(deviceId) => handleMapDevice(deviceId, location)}>
                        <SelectTrigger className="w-64 mx-auto">
                          <SelectValue placeholder="Map an unmapped device" />
                        </SelectTrigger>
                        <SelectContent>
                          {unmappedDevices.map((device) => (
                            <SelectItem key={device.id} value={device.id}>
                              {device.name} (ID: {device.deviceId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {devices.map((device) => (
                        <DeviceCard 
                          key={device.id} 
                          device={device} 
                          locations={locations}
                          onMapDevice={handleMapDevice}
                          onUnmapDevice={handleUnmapDevice}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {Object.keys(filteredDevicesByLocation).length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground mb-2">
                No {searchType} found
              </p>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `Try adjusting your search for "${searchQuery}"` : "Get started by adding your first device"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}