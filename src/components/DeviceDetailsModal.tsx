import { useState } from "react";
import { 
  X, 
  Camera, 
  Share2, 
  MapPin, 
  Wifi, 
  Settings,
  ChevronRight,
  Plus,
  Edit2,
  Save
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface WorkMode {
  id: number;
  enabled: boolean;
  name: string;
  time: { start: string; end: string };
  work: { duration: number; unit: string };
  pause: { duration: number; unit: string };
  weekDays: string[];
}

interface DeviceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: {
    id: string;
    name: string;
    deviceId: string;
    serialNumber: string;
    status: "online" | "offline";
    fuelLevel: number;
    fuelCapacity: number;
    fuelRate: string;
    location: string;
    image?: string;
  };
}

export function DeviceDetailsModal({ open, onOpenChange, device }: DeviceDetailsModalProps) {
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [fanLevel, setFanLevel] = useState("L2");
  const [showFanSelector, setShowFanSelector] = useState(false);
  const [showWorkModeForm, setShowWorkModeForm] = useState(false);
  const [editingFuelRate, setEditingFuelRate] = useState(false);
  const [fuelRate, setFuelRate] = useState(parseInt(device.fuelRate.replace(/\D/g, '')));
  const [workModes, setWorkModes] = useState<WorkMode[]>([
    {
      id: 1,
      enabled: true,
      name: "Setting 1",
      time: { start: "08:00", end: "23:59" },
      work: { duration: 150, unit: "s" },
      pause: { duration: 5, unit: "s" },
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    {
      id: 2,
      enabled: false,
      name: "Setting 2",
      time: { start: "08:30", end: "23:59" },
      work: { duration: 20, unit: "s" },
      pause: { duration: 20, unit: "s" },
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    }
  ]);
  const [newWorkMode, setNewWorkMode] = useState<Partial<WorkMode>>({
    name: "",
    time: { start: "08:00", end: "23:59" },
    work: { duration: 150, unit: "s" },
    pause: { duration: 5, unit: "s" },
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  });
  const { toast } = useToast();

  const handleWorkModeToggle = (id: number) => {
    setWorkModes(modes => 
      modes.map(mode => 
        mode.id === id ? { ...mode, enabled: !mode.enabled } : mode
      )
    );
  };

  const handleCreateWorkMode = () => {
    if (!newWorkMode.name?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a work mode name",
        variant: "destructive"
      });
      return;
    }

    const workMode: WorkMode = {
      id: Date.now(),
      enabled: false,
      name: newWorkMode.name,
      time: newWorkMode.time || { start: "08:00", end: "23:59" },
      work: newWorkMode.work || { duration: 150, unit: "s" },
      pause: newWorkMode.pause || { duration: 5, unit: "s" },
      weekDays: newWorkMode.weekDays || ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    };

    setWorkModes(prev => [...prev, workMode]);
    setShowWorkModeForm(false);
    setNewWorkMode({
      name: "",
      time: { start: "08:00", end: "23:59" },
      work: { duration: 150, unit: "s" },
      pause: { duration: 5, unit: "s" },
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    });
    
    toast({
      title: "Work Mode Created",
      description: `${workMode.name} has been created successfully`
    });
  };

  const handleSaveFuelRate = () => {
    setEditingFuelRate(false);
    toast({
      title: "Fuel Rate Updated",
      description: `Consumption rate set to ${fuelRate} mL/Hr`
    });
  };

  const toggleWeekDay = (day: string) => {
    setNewWorkMode(prev => ({
      ...prev,
      weekDays: prev.weekDays?.includes(day)
        ? prev.weekDays.filter(d => d !== day)
        : [...(prev.weekDays || []), day]
    }));
  };

  const fanLevels = ["OFF", "L1", "L2", "L3"];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 h-[90vh] flex flex-col bg-gradient-card border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">Device Details</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="flex-1 flex flex-col">
          <TabsList className="mx-6 grid w-[calc(100%-3rem)] grid-cols-2 bg-background/50">
            <TabsTrigger value="info">Device Info</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
            {/* Device Image */}
            <div className="aspect-square rounded-lg border-2 border-dashed border-border/50 bg-background/50 flex flex-col items-center justify-center">
              {device.image ? (
                <img src={device.image} alt={device.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add image</span>
                </>
              )}
            </div>

            {/* Device Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="device-name" className="text-muted-foreground">Name</Label>
                <span className="font-medium">{device.name}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="serial-number" className="text-muted-foreground">SN</Label>
                <span className="font-mono text-sm">{device.serialNumber}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="share" className="text-muted-foreground">Share</Label>
                <Button variant="ghost" size="icon">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="location-enable" className="text-muted-foreground">Loc Enable</Label>
                <Switch 
                  id="location-enable" 
                  checked={locationEnabled} 
                  onCheckedChange={setLocationEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="location" className="text-muted-foreground">Location</Label>
                <span className="text-sm text-right max-w-[200px]">{device.location}</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="fuel-rate" className="text-muted-foreground">Fuel Rate</Label>
                <div className="flex items-center gap-2">
                  {editingFuelRate ? (
                    <>
                      <Input
                        id="fuel-rate"
                        type="number"
                        value={fuelRate}
                        onChange={(e) => setFuelRate(Number(e.target.value))}
                        className="w-20 h-8 text-right"
                      />
                      <span className="text-sm">mL/Hr</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={handleSaveFuelRate}
                      >
                        <Save className="w-4 h-4 text-primary" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{fuelRate} mL/Hr</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => setEditingFuelRate(true)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* User Assignment */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
              <Label className="text-muted-foreground">Assigned User</Label>
              <span className="text-sm">Not assigned</span>
            </div>

            {/* Unbind Device Button */}
            <Button variant="destructive" className="w-full" size="lg">
              Unbind Device
            </Button>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4">
            {/* Device Status Header */}
            <Card className="p-4 bg-background/50 border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Wifi className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{device.status}</p>
                  </div>
                </div>
              </div>

              {/* Fuel Gauge */}
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-secondary"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - device.fuelLevel / 100)}`}
                      className="text-primary transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(device.fuelLevel * device.fuelCapacity / 100)}</span>
                    <span className="text-xs text-muted-foreground">ML</span>
                  </div>
                </div>
              </div>

              {/* Device Stats */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-sm font-medium">Not Set</p>
                  <p className="text-xs text-muted-foreground">Scent</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{device.fuelCapacity} ML</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{fuelRate} mL/Hr</p>
                  <p className="text-xs text-muted-foreground">Consumption</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Stopped</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </Card>

            {/* Fan Control */}
            <Card className="p-4 bg-background/50 border-border/50">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowFanSelector(!showFanSelector)}
              >
                <Label>Fan</Label>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium">{fanLevel}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              {showFanSelector && (
                <div className="mt-4 space-y-2">
                  {fanLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        setFanLevel(level);
                        setShowFanSelector(false);
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-colors",
                        fanLevel === level 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background hover:bg-accent"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Lock Control */}
            <Card className="p-4 bg-background/50 border-border/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="device-lock">Lock</Label>
                <Switch 
                  id="device-lock" 
                  checked={deviceLocked} 
                  onCheckedChange={setDeviceLocked}
                />
              </div>
            </Card>

            {/* Work Modes */}
            <Card className="p-4 bg-background/50 border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-primary">Work Mode</h3>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => setShowWorkModeForm(!showWorkModeForm)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {showWorkModeForm && (
                <Card className="p-4 bg-background/30 border-border/30 mb-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mode-name" className="text-sm font-medium">Name</Label>
                      <Input
                        id="mode-name"
                        placeholder="Enter work mode name"
                        value={newWorkMode.name || ""}
                        onChange={(e) => setNewWorkMode(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time" className="text-sm font-medium">Start Time</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={newWorkMode.time?.start || "08:00"}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            time: { ...prev.time!, start: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time" className="text-sm font-medium">End Time</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={newWorkMode.time?.end || "23:59"}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            time: { ...prev.time!, end: e.target.value }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="work-duration" className="text-sm font-medium">Work Duration (s)</Label>
                        <Input
                          id="work-duration"
                          type="number"
                          value={newWorkMode.work?.duration || 150}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            work: { ...prev.work!, duration: Number(e.target.value) }
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pause-duration" className="text-sm font-medium">Pause Duration (s)</Label>
                        <Input
                          id="pause-duration"
                          type="number"
                          value={newWorkMode.pause?.duration || 5}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            pause: { ...prev.pause!, duration: Number(e.target.value) }
                          }))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Week Days</Label>
                      <div className="flex gap-1 mt-2">
                        {weekDays.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleWeekDay(day)}
                            className={cn(
                              "px-2 py-1 text-xs rounded transition-colors",
                              newWorkMode.weekDays?.includes(day)
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border border-border hover:bg-accent"
                            )}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreateWorkMode} size="sm" className="flex-1">
                        Create Mode
                      </Button>
                      <Button 
                        onClick={() => setShowWorkModeForm(false)} 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {workModes.map(mode => (
                  <Card key={mode.id} className="p-4 bg-background/50 border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor={`mode-${mode.id}`} className="font-medium">
                        {mode.name}
                      </Label>
                      <Switch 
                        id={`mode-${mode.id}`}
                        checked={mode.enabled}
                        onCheckedChange={() => handleWorkModeToggle(mode.id)}
                      />
                    </div>

                    {mode.enabled && (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Time</span>
                          <span>{mode.time.start} - {mode.time.end}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Work</span>
                          <div className="flex gap-4">
                            <span>Work {mode.work.duration}{mode.work.unit}</span>
                            <span>Pause {mode.pause.duration}{mode.pause.unit}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-muted-foreground">Week</span>
                          <div className="flex gap-1 mt-2">
                            {weekDays.map(day => (
                              <Badge
                                key={day}
                                variant={mode.weekDays.includes(day) ? "default" : "outline"}
                                className="px-2 py-1 text-xs"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </Card>

            {/* Device Serial Number */}
            <div className="text-center text-xs text-muted-foreground pt-4">
              *Device Sn: {device.serialNumber}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}