import { useState } from "react";
import { Activity, Droplet, MapPin, AlertTriangle, Search, Filter, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const stats = [
  {
    title: "Total Devices",
    value: "246",
    change: "+12 this month",
    icon: Droplet,
    gradient: "from-primary to-primary-glow",
  },
  {
    title: "Online Devices",
    value: "238",
    change: "96.7% active",
    icon: Activity,
    gradient: "from-success to-success/70",
  },
  {
    title: "Low Fuel",
    value: "8",
    change: "Need refill soon",
    icon: AlertTriangle,
    gradient: "from-warning to-warning/70",
  },
  {
    title: "Active Locations",
    value: "18",
    change: "+3 new",
    icon: MapPin,
    gradient: "from-accent to-primary",
  },
];

const devicesData = [
  { id: "1", name: "Reception Area Diffuser", location: "Main Office", status: "online", oilLevel: 85 },
  { id: "2", name: "Conference Room Alpha", location: "Main Office", status: "online", oilLevel: 72 },
  { id: "3", name: "Lobby Central Unit", location: "Lobby Area", status: "offline", oilLevel: 0 },
  { id: "4", name: "Executive Suite Diffuser", location: "Executive Floor", status: "online", oilLevel: 15 },
  { id: "5", name: "Cafeteria Corner Unit", location: "Cafeteria", status: "online", oilLevel: 45 },
  { id: "6", name: "Conference Room Beta", location: "Main Office", status: "online", oilLevel: 90 },
  { id: "7", name: "Reception Waiting Area", location: "Reception", status: "offline", oilLevel: 5 },
  { id: "8", name: "VIP Lounge Diffuser", location: "Executive Floor", status: "online", oilLevel: 68 },
  { id: "9", name: "Main Hallway Unit 1", location: "Main Office", status: "online", oilLevel: 35 },
  { id: "10", name: "Main Hallway Unit 2", location: "Main Office", status: "online", oilLevel: 20 },
  { id: "11", name: "Break Room Diffuser", location: "Cafeteria", status: "online", oilLevel: 55 },
  { id: "12", name: "Guest Reception Unit", location: "Reception", status: "online", oilLevel: 80 },
];

const locationStats = [
  { name: "Main Office", devices: 45, avgFuel: 82, lowFuel: 2, offline: 1 },
  { name: "Lobby Area", devices: 32, avgFuel: 75, lowFuel: 1, offline: 0 },
  { name: "Conference Rooms", devices: 28, avgFuel: 68, lowFuel: 3, offline: 0 },
  { name: "Reception", devices: 15, avgFuel: 90, lowFuel: 0, offline: 1 },
  { name: "Executive Floor", devices: 22, avgFuel: 85, lowFuel: 1, offline: 0 },
  { name: "Cafeteria", devices: 18, avgFuel: 60, lowFuel: 2, offline: 0 },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter devices based on search and status
  const filteredDevices = devicesData.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         statusFilter === device.status ||
                         (statusFilter === "low oil" && device.oilLevel <= 20);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    return status === "online" ? "success" : "destructive";
  };

  const getOilLevelBadge = (level: number) => {
    if (level <= 20) return "destructive";
    if (level <= 50) return "warning";
    return "success";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your aroma diffuser network</p>
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
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
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
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Oil Level</TableHead>
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
                            {device.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(device.status)} className="capitalize">
                            {device.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-20">
                              <Progress 
                                value={device.oilLevel} 
                                className="h-2"
                              />
                            </div>
                            <Badge variant={getOilLevelBadge(device.oilLevel)} className="min-w-12 text-center">
                              {device.oilLevel}%
                            </Badge>
                          </div>
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
                {locationStats.map((location, index) => (
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