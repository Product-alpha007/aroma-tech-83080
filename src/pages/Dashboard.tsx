import { useState } from "react";
import { Activity, Droplet, MapPin, AlertTriangle, Search, Filter, Building2, Calendar, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDevices, useSharedDevices } from "@/hooks/useDevices";
import { Device } from "@/lib/api";
import { useRealtimeDevices } from "@/hooks/useRealtimeDevices";
import { useLocations } from "@/contexts/LocationContext";
import { RealtimeStatusIndicator } from "@/components/RealtimeStatusIndicator";
import { useAuth } from "@/contexts/AuthContext";


export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortColumn, setSortColumn] = useState<"status" | "oilLevel" | "daysUntilRefill" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch devices data from API
  const { data: devicesResponse, isLoading, error } = useDevices(currentPage, pageSize);
  const { data: sharedDevicesResponse, isLoading: isLoadingShared } = useSharedDevices();
  const { user } = useAuth();
  const { locations, deviceGroupsWithDevices, getDevicesByLocation } = useLocations();
  
  // Initialize real-time updates
  const { isConnected } = useRealtimeDevices();

  // Calculate stats from API data
  const devices = devicesResponse?.data?.records || [];
  const sharedDevices = sharedDevicesResponse?.data || [];
  const allDevices = [...devices, ...sharedDevices];
  const totalDevices = allDevices.length;
  const onlineDevices = allDevices.filter(device => device.status === 'ONLINE').length;
  
  // Calculate low fuel devices using remainInfoTotal and remainInfoCurrent (API returns 10x values)
  const lowFuelDevices = allDevices.filter(device => {
    if (!device.remainInfoTotal || !device.remainInfoCurrent) return false;
    const fuelPercentage = (device.remainInfoCurrent / device.remainInfoTotal) * 100;
    return fuelPercentage <= 20;
  }).length;
  
  // Calculate location stats from device groups (API-based)
  const locationStats = locations.reduce((acc, location) => {
    if (location === "Unmapped") {
      // Find devices that are not in any group
      const groupDeviceIds = (deviceGroupsWithDevices || []).flatMap(group => group.devices?.map(d => d.id) || []);
      const unmappedDevices = allDevices.filter(device => {
        const isInGroup = groupDeviceIds.includes(device.id);
        return !isInGroup;
      });
      
      acc[location] = {
        name: location,
        devices: unmappedDevices.length,
        avgFuel: 0,
        lowFuel: 0,
        offline: 0,
        totalFuel: 0,
        deviceCount: unmappedDevices.length
      };
      
      // Calculate stats for unmapped devices
      unmappedDevices.forEach(device => {
        const fuelPercentage = device.remainInfoTotal && device.remainInfoCurrent 
          ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
          : 0;
        
        acc[location].totalFuel += fuelPercentage;
        if (fuelPercentage <= 20) acc[location].lowFuel += 1;
        if (device.status === 'OFFLINE') acc[location].offline += 1;
      });
    } else {
      // Find devices in this group only
      const groupDeviceIds = getDevicesByLocation(location);
      const groupDevices = allDevices.filter(device => {
        const isInGroup = groupDeviceIds.includes(device.id);
        return isInGroup;
      });
      
      acc[location] = {
        name: location,
        devices: groupDevices.length,
        avgFuel: 0,
        lowFuel: 0,
        offline: 0,
        totalFuel: 0,
        deviceCount: groupDevices.length
      };
      
      // Calculate stats for group devices
      groupDevices.forEach(device => {
        const fuelPercentage = device.remainInfoTotal && device.remainInfoCurrent 
          ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
          : 0;
        
        acc[location].totalFuel += fuelPercentage;
        if (fuelPercentage <= 20) acc[location].lowFuel += 1;
        if (device.status === 'OFFLINE') acc[location].offline += 1;
      });
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate average fuel for each location
  Object.values(locationStats).forEach((location: any) => {
    location.avgFuel = location.deviceCount > 0 ? Math.round(location.totalFuel / location.deviceCount) : 0;
  });

  const activeLocations = Object.keys(locationStats).length;
  
  const stats = [
    {
      title: "Total Devices",
      value: totalDevices.toString(),
      change: `Page ${currentPage} of ${Math.ceil(totalDevices / pageSize)}`,
      icon: Droplet,
      gradient: "from-primary to-primary-glow",
    },
    {
      title: "Online Devices",
      value: onlineDevices.toString(),
      change: `${totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0}% active`,
      icon: Activity,
      gradient: "from-success to-success/70",
    },
    {
      title: "Low Fuel",
      value: lowFuelDevices.toString(),
      change: "Need refill soon",
      icon: AlertTriangle,
      gradient: "from-warning to-warning/70",
    },
    {
      title: "Active Locations",
      value: activeLocations.toString(),
      change: `${Object.values(locationStats).filter((loc: any) => loc.offline === 0).length} fully online`,
      icon: MapPin,
      gradient: "from-accent to-primary",
    },
  ];

  const getStatusBadge = (status: string) => {
    return status === "ONLINE" ? "online" : "offline";
  };

  const getOilLevelBadge = (level: number) => {
    if (level <= 20) return "destructive";
    if (level <= 50) return "warning";
    return "success";
  };

  // Calculate days until oil exhaustion using remainInfoCurrent and remainInfoDay
  const calculateDaysUntilRefill = (device: Device) => {
    if (device.status === "OFFLINE" || !device.remainInfoCurrent || !device.remainInfoTotal) return "N/A";
    
    // Use remainInfoDay if available, otherwise calculate from fuel percentage
    if (device.remainInfoDay !== undefined) {
      if (device.remainInfoDay < 1) return "<1 day";
      if (device.remainInfoDay === 1) return "1 day";
      return `${device.remainInfoDay} days`;
    }
    
    // Fallback calculation using fuel percentage
    const fuelPercentage = (device.remainInfoCurrent / device.remainInfoTotal) * 100;
    if (fuelPercentage <= 0) return "N/A";
    
    // Estimate days based on fuel percentage (assuming 10% per day average consumption)
    const estimatedDays = Math.floor(fuelPercentage / 10);
    if (estimatedDays < 1) return "<1 day";
    if (estimatedDays === 1) return "1 day";
    return `${estimatedDays} days`;
  };

  const getDaysUntilRefillBadge = (days: string) => {
    if (days === "N/A") return "secondary";
    if (days === "<1 day") return "destructive";
    const numDays = parseInt(days);
    if (!isNaN(numDays) && numDays <= 3) return "warning";
    return "default";
  };

  const getSortIcon = (column: "status" | "oilLevel" | "daysUntilRefill") => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline-block text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 inline-block text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 inline-block text-primary" />
    );
  };

  // Handle sorting
  const handleSort = (column: "status" | "oilLevel" | "daysUntilRefill") => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter devices based on search and status
  const filteredDevices = allDevices
    .filter(device => {
      const location = device.address || device.city || 'Unmapped';
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           location.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Calculate fuel percentage for filtering
      const fuelPercentage = device.remainInfoTotal && device.remainInfoCurrent 
        ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
        : 0;
      
      const matchesStatus = statusFilter === "all" || 
                           statusFilter === device.status ||
                           (statusFilter === "low oil" && fuelPercentage <= 20);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;

      if (sortColumn === "status") {
        // OFFLINE first, then ONLINE
        const statusOrder = { OFFLINE: 0, ONLINE: 1 };
        const comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (sortColumn === "oilLevel") {
        // Calculate fuel percentage for sorting
        const fuelA = a.remainInfoTotal && a.remainInfoCurrent 
          ? (a.remainInfoCurrent / a.remainInfoTotal) * 100 
          : 0;
        const fuelB = b.remainInfoTotal && b.remainInfoCurrent 
          ? (b.remainInfoCurrent / b.remainInfoTotal) * 100 
          : 0;
        const comparison = fuelA - fuelB;
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (sortColumn === "daysUntilRefill") {
        // N/A first, then ascending numeric order
        const daysA = calculateDaysUntilRefill(a);
        const daysB = calculateDaysUntilRefill(b);
        
        // Handle N/A values
        if (daysA === "N/A" && daysB === "N/A") return 0;
        if (daysA === "N/A") return sortDirection === "asc" ? -1 : 1;
        if (daysB === "N/A") return sortDirection === "asc" ? 1 : -1;
        
        // Extract numeric values
        const getNumericValue = (days: string) => {
          if (days === "<1 day") return 0.5;
          const match = days.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        };
        
        const comparison = getNumericValue(daysA) - getNumericValue(daysB);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return 0;
    });

  // Show loading state
  if (isLoading || isLoadingShared) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage your aroma diffuser network</p>
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-lg">
          <div className="container mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Monitor and manage your aroma diffuser network</p>
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Monitor and manage your aroma diffuser network</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Live Updates" : "Connecting..."}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className={cn(
                "relative overflow-hidden border-border/50",
                "bg-gradient-card backdrop-blur-sm",
                "hover:shadow-glow hover:border-primary/30",
                "transition-all duration-300 animate-scale-in"
              )}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    "bg-gradient-to-br",
                    stat.gradient
                  )}>
                    <stat.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <Badge variant={stat.title === "Low Fuel" ? "warning" : "success"}>
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-radial opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Devices Table */}
          <Card className="lg:col-span-2 border-border/50 bg-gradient-card backdrop-blur-sm animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Devices Management</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search devices..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-background/50 border-border"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 bg-background/50 border-border">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="OFFLINE">Offline</SelectItem>
                      <SelectItem value="low oil">Low Oil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-background/30 backdrop-blur-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="font-semibold">Device Name</TableHead>
                      <TableHead className="font-semibold">Location</TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("status")}
                      >
                        <div className="flex items-center">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("oilLevel")}
                      >
                        <div className="flex items-center">
                          Oil Level
                          {getSortIcon("oilLevel")}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("daysUntilRefill")}
                      >
                        <div className="flex items-center">
                          Days Until Refill
                          {getSortIcon("daysUntilRefill")}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDevices.map((device, index) => (
                      <TableRow 
                        key={device.id} 
                        className={cn(
                          "border-border/50 hover:bg-card/50 transition-colors duration-200",
                          "animate-fade-in"
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {device.location || device.address || device.city || 'unmapped'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <RealtimeStatusIndicator 
                            deviceId={device.id}
                            status={device.status}
                            lastSeen={device.onlineTime ? new Date(device.onlineTime).toISOString() : undefined}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-20">
                              <Progress 
                                value={device.remainInfoTotal && device.remainInfoCurrent 
                                  ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
                                  : 0} 
                                className="h-2"
                              />
                            </div>
                            <Badge variant={getOilLevelBadge(device.remainInfoTotal && device.remainInfoCurrent 
                              ? (device.remainInfoCurrent / device.remainInfoTotal) * 100 
                              : 0)} className="min-w-12 text-center">
                              {device.remainInfoTotal && device.remainInfoCurrent 
                                ? Math.round((device.remainInfoCurrent / device.remainInfoTotal) * 100)
                                : 0}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getDaysUntilRefillBadge(calculateDaysUntilRefill(device))}
                            className="gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            {calculateDaysUntilRefill(device)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {filteredDevices.length === 0 && (
                  <div className="text-center py-12">
                    <Droplet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-xl text-muted-foreground mb-2">No devices found</p>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? `Try adjusting your search for "${searchQuery}"` : "No devices match the selected filter"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Location Stats */}
          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm animate-fade-in">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Location Stats</h2>
              </div>
              <div className="space-y-6">
                {Object.values(locationStats).map((location: any, index) => (
                  <div 
                    key={location.name} 
                    className={cn(
                      "space-y-4 p-4 rounded-lg bg-background/30 border border-border/30",
                      "hover:bg-background/50 transition-all duration-200",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{location.name}</h3>
                      <Badge variant="outline" className="font-medium">
                        {location.devices} devices
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Avg Fuel</p>
                        <p className="text-2xl font-bold">{location.avgFuel}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Low Fuel</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          location.lowFuel > 0 ? "text-warning" : "text-muted-foreground"
                        )}>
                          {location.lowFuel}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Offline</p>
                        <p className={cn(
                          "text-2xl font-bold",
                          location.offline > 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {location.offline}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={location.avgFuel} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Fuel Level</span>
                        <span>{location.avgFuel}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}