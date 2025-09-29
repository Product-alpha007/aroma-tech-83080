import { Activity, Droplet, MapPin, AlertTriangle, Users, Share2, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const subAccounts = [
  { id: 1, name: "John Manager", role: "Regional Manager", devices: 45, shared: 12, status: "active", lastActive: "Online now" },
  { id: 2, name: "Sarah Admin", role: "Site Administrator", devices: 68, shared: 8, status: "active", lastActive: "5 min ago" },
  { id: 3, name: "Mike Tech", role: "Technician", devices: 23, shared: 23, status: "active", lastActive: "1 hour ago" },
  { id: 4, name: "Lisa Operator", role: "Operator", devices: 15, shared: 15, status: "inactive", lastActive: "2 days ago" },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sub Accounts */}
          <Card className="lg:col-span-2 border-border/50 bg-gradient-card backdrop-blur-sm animate-fade-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Sub Accounts</h2>
                </div>
                <Button variant="outline" size="sm">Manage Users</Button>
              </div>
              <div className="space-y-3">
                {subAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg",
                      "bg-background/50 hover:bg-card",
                      "transition-colors duration-200 border border-border/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-semibold"
                      )}>
                        {account.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-xs">
                          <Droplet className="w-3 h-3" />
                          <span>{account.devices} devices</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Share2 className="w-3 h-3" />
                          <span>{account.shared} shared</span>
                        </div>
                      </div>
                      <Badge variant={account.status === "active" ? "success" : "secondary"} className="text-xs">
                        {account.lastActive}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Location-wise Device Stats */}
          <Card className="border-border/50 bg-gradient-card backdrop-blur-sm animate-fade-in">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Location Stats</h2>
              </div>
              <div className="space-y-3">
                {locationStats.map((location) => (
                  <div key={location.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{location.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {location.devices} devices
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                        <span className="text-muted-foreground">Avg Fuel</span>
                        <span className="font-semibold text-sm">{location.avgFuel}%</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                        <span className="text-muted-foreground">Low Fuel</span>
                        <span className={cn(
                          "font-semibold text-sm",
                          location.lowFuel > 0 && "text-warning"
                        )}>{location.lowFuel}</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                        <span className="text-muted-foreground">Offline</span>
                        <span className={cn(
                          "font-semibold text-sm",
                          location.offline > 0 && "text-destructive"
                        )}>{location.offline}</span>
                      </div>
                    </div>
                    <Progress value={location.avgFuel} className="h-1" />
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