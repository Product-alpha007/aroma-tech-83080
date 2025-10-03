import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Share2, 
  MapPin, 
  Wifi, 
  Settings,
  ChevronRight,
  Plus,
  Edit2,
  Edit,
  Check,
  X as XIcon,
  Save,
  Loader2,
  RefreshCw,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
import { aromaAPI } from "@/lib/api";
import { useDeleteDevice } from "@/hooks/useDevices";

/**
 * Build a frame to switch a mode ON or OFF
 *
 * @param mode - Mode slot number (1–5)
 * @param on - true = ON, false = OFF
 * @returns Hex string frame e.g. "55 10 13 05 01 01 2A"
 */
function buildModeSwitchFrame(mode: number, on: boolean): string {
  if (mode < 1 || mode > 5) {
    throw new Error("Mode must be between 1 and 5");
  }

  const funcCode = 0x10 + mode; // Mode1=0x11, Mode2=0x12 … Mode5=0x15
  const value = on ? 0x01 : 0x00;

  const frame: number[] = [
    0x55,       // Start byte
    0x10,       // Command: Configure
    funcCode,   // Function code
    0x05,       // Type: configure
    0x01,       // Length
    value       // Payload: 01=ON, 00=OFF
  ];

  // Compute checksum = sum of all bytes after 0x55, low 8 bits
  const checksum = frame.slice(1).reduce((a, b) => a + b, 0) & 0xFF;
  frame.push(checksum);

  return frame.map(b => b.toString(16).padStart(2, "0")).join(" ").toUpperCase();
}

/**
 * Build API request body
 */
function buildModeSwitchApiBody(deviceId: string, mode: number, on: boolean) {
  return {
    id: deviceId,
    params: {
      key: "TX",
      value: buildModeSwitchFrame(mode, on)
    }
  };
}

/**
 * Parse mode switch states from telemetry hex frames
 */
function parseModeSwitches(telemetry: Telemetry): { mode: number; active: boolean }[] {
  const results: { mode: number; active: boolean }[] = [];

  for (let i = 1; i <= 5; i++) {
    const key = `MODE${i}_SWITCH`;
    const hex = telemetry[key];
    if (hex) {
      try {
        // Split into bytes and parse
        const parts = hex.split(" ").map(h => parseInt(h, 16));
        const value = parts[5]; // YY byte (6th byte, 0-indexed)
        results.push({ mode: i, active: value === 1 });
        console.log(`Mode ${i} switch: hex="${hex}", parsed value=${value}, active=${value === 1}`);
      } catch (error) {
        console.error(`Error parsing mode ${i} switch:`, error);
        results.push({ mode: i, active: false });
      }
    } else {
      results.push({ mode: i, active: false });
    }
  }

  return results;
}

interface WorkMode {
  id: number;
  enabled: boolean;
  name: string;
  time: { start: string; end: string };
  work: { duration: number; unit: string };
  pause: { duration: number; unit: string };
  weekDays: string[];
}

interface Telemetry {
  [key: string]: string | null;
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
  const [deviceDetails, setDeviceDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [deviceLocked, setDeviceLocked] = useState(false);
  const [fanLevel, setFanLevel] = useState("L2");
  const [showFanSelector, setShowFanSelector] = useState(false);
  const [isControllingFan, setIsControllingFan] = useState(false);
  const [isControllingLock, setIsControllingLock] = useState(false);
  const [isCreatingWorkMode, setIsCreatingWorkMode] = useState(false);
  const [editingWorkMode, setEditingWorkMode] = useState<WorkMode | null>(null);
  const [workModesLoading, setWorkModesLoading] = useState(false);
  const [refreshingWorkModes, setRefreshingWorkModes] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isEditingOilName, setIsEditingOilName] = useState(false);
  const [editingOilName, setEditingOilName] = useState("");
  const [isUpdatingOilName, setIsUpdatingOilName] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Use the React Query hook for device deletion
  const deleteDeviceMutation = useDeleteDevice();
  
  // Fan speed frame mapping
  const fanFrames = {
    "Off": "5510070501001D",
    "L1": "5510070501011E", 
    "L2": "5510070501021F"
  };

  // Lock control frame mapping
  const lockFrames = {
    "locked": "55100905010120",    // 55 10 09 05 01 01 20 - for locking
    "unlocked": "5510090501001F"   // 55 10 09 05 01 00 1F - for unlocking
  };
  const [showWorkModeForm, setShowWorkModeForm] = useState(false);
  const [workModes, setWorkModes] = useState<WorkMode[]>([]);
  const [newWorkMode, setNewWorkMode] = useState<Partial<WorkMode>>({
    time: { start: "08:00", end: "23:59" },
    work: { duration: 0, unit: "s" },
    pause: { duration: 0, unit: "s" },
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  });
  const { toast } = useToast();

  const fetchDeviceDetails = async () => {
    setLoading(true);
    try {
      const response = await aromaAPI.getDeviceDetails(device.id);
      if (response.success && response.data) {
        setDeviceDetails(response.data);
        // Load work modes from telemetry
        loadWorkModesFromAPI(response.data);
      } else {
        console.error('Failed to fetch device details:', response.error);
      }
    } catch (error) {
      console.error('Error fetching device details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkModesFromAPI = (deviceData: any) => {
    setWorkModesLoading(true);
    
    try {
      const telemetry = deviceData.latestSelfTelemetry || {};
      const loadedWorkModes: WorkMode[] = [];

      // Parse switch states from hex frames
      const switchStates = parseModeSwitches(telemetry);
      console.log('Parsed switch states:', switchStates);

      // Parse each mode slot (MODE1_SET through MODE5_SET)
      for (let i = 1; i <= 5; i++) {
        const modeKey = `MODE${i}_SET`;
        const modeData = telemetry[modeKey];
        
        // Get switch state from parsed results
        const switchState = switchStates.find(s => s.mode === i);
        const isActive = switchState ? switchState.active : false;
        
        console.log(`Mode ${i}: modeData="${modeData}", isActive=${isActive}`);
        
        if (modeData && modeData !== "") {
          const parsedMode = parseWorkModeFromTelemetry(modeData, i, isActive);
          if (parsedMode) {
            console.log(`Parsed mode ${i}:`, parsedMode);
            loadedWorkModes.push(parsedMode);
          }
        } else {
          console.log(`Mode ${i}: No mode data or empty data`);
        }
      }

      console.log('=== WORK MODES DEBUG ===');
      console.log('Available telemetry keys:', Object.keys(telemetry));
      console.log('Mode-related keys:', Object.keys(telemetry).filter(key => key.includes('MODE')));
      console.log('Switch states:', switchStates);
      console.log('Loaded work modes from API:', loadedWorkModes);
      console.log('========================');
      setWorkModes(loadedWorkModes);
    } catch (error) {
      console.error('Error loading work modes from API:', error);
    } finally {
      setWorkModesLoading(false);
    }
  };

  const refreshWorkModes = useCallback(async (showToast = false) => {
    setRefreshingWorkModes(true);
    try {
      const response = await aromaAPI.getDeviceDetails(device.id);
      if (response.success && response.data) {
        loadWorkModesFromAPI(response.data);
        setLastRefreshTime(new Date());
        
        if (showToast) {
      toast({
            title: "Work Modes Refreshed",
            description: "Work mode status updated from device",
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing work modes:', error);
      if (showToast) {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh work modes. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setRefreshingWorkModes(false);
    }
  }, [device.id]);

  const handleNameEdit = () => {
    setEditingName(device.name);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (!editingName.trim() || editingName === device.name) {
      setIsEditingName(false);
      return;
    }

    setIsUpdatingName(true);
    try {
      const response = await aromaAPI.updateDevice(device.id, { 
        id: device.id,
        name: editingName.trim()
      });
      if (response.success) {
        // Update local device state
        device.name = editingName.trim();
        
        // Refresh device details to get updated data
        await fetchDeviceDetails();
        
        toast({
          title: "Device Updated",
          description: "Device name has been updated successfully",
        });
        
        setIsEditingName(false);
      } else {
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update device name",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating device name:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update device name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleNameCancel = () => {
    setEditingName("");
    setIsEditingName(false);
  };

  const handleOilNameEdit = () => {
    setEditingOilName(deviceDetails?.oilName || (device as any).oilName || '');
    setIsEditingOilName(true);
  };

  const handleOilNameSave = async () => {
    if (!editingOilName.trim() || editingOilName === (deviceDetails?.oilName || (device as any).oilName || '')) {
      setIsEditingOilName(false);
      return;
    }

    setIsUpdatingOilName(true);
    try {
      const response = await aromaAPI.updateDevice(device.id, { 
        id: device.id,
        name: device.name,
        oilName: editingOilName.trim()
      });

      if (response.success) {
        await fetchDeviceDetails(); // Refresh device details
        setIsEditingOilName(false);
    toast({
          title: "Oil Name Updated",
          description: `Oil name updated to "${editingOilName.trim()}"`,
        });
      } else {
        toast({
          title: "Update Failed",
          description: "Failed to update oil name. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating oil name:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update oil name. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingOilName(false);
    }
  };

  const handleOilNameCancel = () => {
    setEditingOilName(deviceDetails?.oilName || (device as any).oilName || '');
    setIsEditingOilName(false);
  };

  const handleDeleteDevice = async () => {
    try {
      await deleteDeviceMutation.mutateAsync(device.id);
      onOpenChange(false); // Close the modal
      setShowDeleteDialog(false);
      // The device list will automatically refresh due to React Query invalidation
    } catch (error) {
      console.error('Error unbinding device:', error);
      // Error handling is done by the mutation hook
    }
  };

  // Fetch device details when modal opens
  useEffect(() => {
    if (open && device.id) {
      fetchDeviceDetails();
    }
  }, [open, device.id]);

  // Smart periodic refresh of work modes
  useEffect(() => {
    if (!open) return;

    // Start with immediate refresh
    refreshWorkModes();

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      console.log('Auto-refreshing work modes data...');
      refreshWorkModes();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [open, refreshWorkModes]);

  const handleWorkModeToggle = async (id: number) => {
    const mode = workModes.find(m => m.id === id);
    if (!mode) return;

    const newEnabled = !mode.enabled;
    
    // Update local state immediately for better UX
    setWorkModes(modes => 
      modes.map(m => 
        m.id === id ? { ...m, enabled: newEnabled } : m
      )
    );

    try {
      // Use the utility function to build the correct switch frame
      const frameString = buildModeSwitchFrame(id, newEnabled);
      console.log(`Sending mode switch frame for mode ${id}:`, frameString);
      
      const response = await aromaAPI.controlDevice({
        id: device.id,
        frame: frameString
      });

      if (response.success) {
    toast({
          title: "Work Mode Updated",
          description: `Setting ${id} ${newEnabled ? 'activated' : 'deactivated'} successfully`,
        });
      } else {
        // Revert local state on failure
        setWorkModes(modes => 
          modes.map(m => 
            m.id === id ? { ...m, enabled: !newEnabled } : m
          )
        );
        throw new Error(response.error || "Failed to toggle work mode");
      }
    } catch (error) {
      console.error('Work mode toggle error:', error);
      // Revert local state on failure
      setWorkModes(modes => 
        modes.map(m => 
          m.id === id ? { ...m, enabled: !newEnabled } : m
        )
      );
      toast({
        title: "Toggle Failed",
        description: "Failed to change work mode status. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleFanSpeedChange = async (newLevel: string) => {
    setIsControllingFan(true);
    try {
      const frame = fanFrames[newLevel as keyof typeof fanFrames];
      if (!frame) {
        throw new Error("Invalid fan level");
      }

      const response = await aromaAPI.controlDevice({
        id: device.id,
        frame: frame
      });

      if (response.success) {
        setFanLevel(newLevel);
        setShowFanSelector(false);
      toast({
          title: "Fan Speed Updated",
          description: `Fan speed set to ${newLevel}`,
        });
      } else {
        throw new Error(response.error || "Failed to control fan");
      }
    } catch (error) {
      console.error('Fan control error:', error);
      toast({
        title: "Control Failed",
        description: "Failed to change fan speed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsControllingFan(false);
    }
  };

  const handleLockToggle = async () => {
    setIsControllingLock(true);
    try {
      const newLockState = !deviceLocked;
      const frame = newLockState ? lockFrames.locked : lockFrames.unlocked;

      const response = await aromaAPI.controlDevice({
        id: device.id,
        frame: frame
      });

      if (response.success) {
        setDeviceLocked(newLockState);
        toast({
          title: "Device Lock Updated",
          description: `Device ${newLockState ? 'locked' : 'unlocked'} successfully`,
        });
      } else {
        throw new Error(response.error || "Failed to control device lock");
      }
    } catch (error) {
      console.error('Lock control error:', error);
      toast({
        title: "Control Failed",
        description: "Failed to change device lock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsControllingLock(false);
    }
  };

  // Work mode frame builder function
  const buildScheduleFrame = (
    mode: number, 
    weekdays: number, 
    on_h: number, 
    on_m: number,
    off_h: number, 
    off_m: number, 
    work_s: number, 
    pause_s: number
  ): string => {
    // Function code based on mode
    const func = mode & 0xFF;

    // Data payload
    const data = [
      weekdays,
      on_h, on_m,
      off_h, off_m,
      (work_s >> 8) & 0xFF, work_s & 0xFF,
      (pause_s >> 8) & 0xFF, pause_s & 0xFF
    ];

    const frame = [0x55, 0x10, func, 0x05, 0x09, ...data];
    const checksum = frame.slice(1).reduce((sum, b) => sum + b, 0) & 0xFF; // exclude 0x55
    frame.push(checksum);

    return frame.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  };

  // Pick next available mode slot (1-5)
  const pickNextModeSlot = (): number => {
    const usedSlots = workModes.map(mode => mode.id);
    console.log('Used slots from local state:', usedSlots);
    
    // Find the first available slot (1-5)
    for (let i = 1; i <= 5; i++) {
      if (!usedSlots.includes(i)) {
        console.log(`Found available slot: ${i}`);
        return i;
      }
    }
    
    // If all slots are used, use the next sequential number (will overwrite)
    const nextSlot = workModes.length + 1;
    const modeSlot = nextSlot <= 5 ? nextSlot : 1; // Wrap around to 1 if > 5
    console.log(`Using slot: ${modeSlot} (${nextSlot > 5 ? 'overwriting' : 'new'})`);
    return modeSlot;
  };

  // Convert weekdays array to bitmask
  const weekdaysToBitmask = (weekDays: string[]): number => {
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let bitmask = 0;
    weekDays.forEach(day => {
      const index = dayOrder.indexOf(day);
      if (index !== -1) {
        bitmask |= (1 << index);
      }
    });
    return bitmask;
  };

  // Convert time string to hours and minutes
  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  // Convert duration to seconds
  const durationToSeconds = (duration: number, unit: string): number => {
    switch (unit) {
      case 's': return duration;
      case 'm': return duration * 60;
      case 'h': return duration * 3600;
      default: return duration;
    }
  };

  // Parse work mode data from API telemetry
  const parseWorkModeFromTelemetry = (modeData: string, modeId: number, isActive: boolean = false): WorkMode | null => {
    if (!modeData || modeData === "") return null;

    try {
      // Parse hex string (e.g., "55 11 01 05 09 7F 08 00 17 3B 00 96 00 2B BA")
      const hexValues = modeData.split(' ').map(hex => parseInt(hex, 16));
      
      if (hexValues.length < 15) return null; // Invalid frame length

      // Extract data from frame (skip header: 55 11 XX 05 09)
      const weekdays = hexValues[5];
      const onHour = hexValues[6];
      const onMinute = hexValues[7];
      const offHour = hexValues[8];
      const offMinute = hexValues[9];
      const workSeconds = (hexValues[10] << 8) | hexValues[11];
      const pauseSeconds = (hexValues[12] << 8) | hexValues[13];

      // Check if mode is effectively empty (all zeros for times and weekdays)
      if (weekdays === 0 && onHour === 0 && onMinute === 0 && offHour === 0 && offMinute === 0) {
        return null; // Skip empty/unused modes
      }

      // Convert weekdays bitmask to array
      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const weekDays: string[] = [];
      for (let i = 0; i < 7; i++) {
        if (weekdays & (1 << i)) {
          weekDays.push(dayOrder[i]);
        }
      }

      // Format time strings
      const formatTime = (hours: number, minutes: number) => 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      return {
        id: modeId,
        enabled: isActive, // Use the actual switch status
        name: `Setting ${modeId}`,
        time: {
          start: formatTime(onHour, onMinute),
          end: formatTime(offHour, offMinute)
        },
        work: {
          duration: workSeconds,
          unit: "s"
        },
        pause: {
          duration: pauseSeconds,
          unit: "s"
        },
        weekDays,
      };
    } catch (error) {
      console.error(`Error parsing work mode ${modeId}:`, error);
      return null;
    }
  };

  // Generate next available setting name
  const generateNextSettingName = (): string => {
    const existingNames = workModes.map(mode => mode.name);
    let settingNumber = 1;
    
    while (existingNames.includes(`Setting ${settingNumber}`)) {
      settingNumber++;
    }
    
    return `Setting ${settingNumber}`;
  };

  // Calculate fuel consumption based on fan speed and work/pause ratio
  const calculateFuelConsumption = (fanSpeed: string, workDuration: number, pauseDuration: number): number => {
    // Fan speed marginal consumption mapping
    const marginalConsumption: { [key: string]: number } = {
      "Off": 0,    // 00 - 0ml/hr
      "L1": 2,     // 01 - 2ml/hr
      "L2": 4      // 02 - 4ml/hr
    };

    const consumption = marginalConsumption[fanSpeed] || 0;
    const totalTime = workDuration + pauseDuration;
    
    if (totalTime === 0) return 0;
    
    // Formula: (work time * marginal consumption) / (work time + pause time)
    const actualConsumption = (workDuration * consumption) / totalTime;
    
    return Math.ceil(actualConsumption); // Use ceil function
  };

  // Calculate current device consumption based on fan speed and active work modes
  const getCurrentConsumption = (): number => {
    const activeWorkModes = workModes.filter(mode => mode.enabled);
    
    console.log('=== CONSUMPTION CALCULATION ===');
    console.log('Current fan speed:', fanLevel);
    console.log('Active work modes:', activeWorkModes.length);
    
    if (activeWorkModes.length === 0) {
      console.log('No active work modes - consumption = 0 mL/Hr');
      console.log('===============================');
      return 0; // No work modes = no consumption
    }
    
    // Calculate consumption for each active work mode
    let totalConsumption = 0;
    activeWorkModes.forEach((mode, index) => {
      const workDuration = mode.work.duration;
      const pauseDuration = mode.pause.duration;
      const marginalConsumption = fanLevel === "Off" ? 0 : fanLevel === "L1" ? 2 : 4;
      
      console.log(`Work Mode ${index + 1} (${mode.name}):`);
      console.log(`  - Work duration: ${workDuration}s`);
      console.log(`  - Pause duration: ${pauseDuration}s`);
      console.log(`  - Fan speed: ${fanLevel} (${marginalConsumption}ml/hr)`);
      
      const totalTime = workDuration + pauseDuration;
      const actualConsumption = totalTime === 0 ? 0 : (workDuration * marginalConsumption) / totalTime;
      const ceilConsumption = Math.ceil(actualConsumption);
      
      console.log(`  - Formula: (${workDuration} * ${marginalConsumption}) / (${workDuration} + ${pauseDuration}) = ${actualConsumption}`);
      console.log(`  - Ceil result: ${ceilConsumption} mL/Hr (actual consumption per hour)`);
      
      totalConsumption += ceilConsumption;
    });
    
    console.log(`Total consumption across all active modes: ${totalConsumption} mL/Hr`);
    console.log(`Final consumption: ${totalConsumption} mL/Hr`);
    console.log('===============================');
    
    return totalConsumption;
  };

  // Create work mode
  const handleEditWorkMode = (mode: WorkMode) => {
    setEditingWorkMode(mode);
    setNewWorkMode({
      time: mode.time,
      work: mode.work,
      pause: mode.pause,
      weekDays: mode.weekDays
    });
    setShowWorkModeForm(true);
  };

  const handleCancelEdit = () => {
    setEditingWorkMode(null);
    setShowWorkModeForm(false);
    setNewWorkMode({
      time: { start: "08:00", end: "23:59" },
      work: { duration: 0, unit: "s" },
      pause: { duration: 0, unit: "s" },
      weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    });
  };
    
  const handleCreateWorkMode = async () => {
    if (!newWorkMode.time || !newWorkMode.work || !newWorkMode.pause || !newWorkMode.weekDays) {
    toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
    });
      return;
    }

    // Validate that durations are greater than 0
    if (newWorkMode.work.duration <= 0 || newWorkMode.pause.duration <= 0) {
    toast({
        title: "Invalid Duration",
        description: "Work and pause durations must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingWorkMode(true);
    try {
      // Use existing mode slot if editing, otherwise pick next available
      const modeSlot = editingWorkMode ? editingWorkMode.id : pickNextModeSlot();

      // Parse time and duration data
      const startTime = parseTime(newWorkMode.time.start);
      const endTime = parseTime(newWorkMode.time.end);
      const workDuration = durationToSeconds(newWorkMode.work.duration, newWorkMode.work.unit);
      const pauseDuration = durationToSeconds(newWorkMode.pause.duration, newWorkMode.pause.unit);
      const weekdays = weekdaysToBitmask(newWorkMode.weekDays);

      // Build the schedule frame
      const frame = buildScheduleFrame(
        modeSlot,
        weekdays,
        startTime.hours,
        startTime.minutes,
        endTime.hours,
        endTime.minutes,
        workDuration,
        pauseDuration
      );

      // Send the schedule command (unified create/modify)
      const controlResponse = await aromaAPI.controlDevice({
        id: device.id,
        frame: frame
      });

      if (controlResponse.success) {
        // Use original name when editing, generate new name when creating
        const settingName = editingWorkMode ? editingWorkMode.name : generateNextSettingName();
        
        // Add or update the work mode in local state
        const newMode: WorkMode = {
          id: modeSlot,
          enabled: true,
          name: settingName,
          time: newWorkMode.time,
          work: newWorkMode.work,
          pause: newWorkMode.pause,
          weekDays: newWorkMode.weekDays
        };

        setWorkModes(prev => {
          // Check if a mode with this ID already exists
          const existingIndex = prev.findIndex(mode => mode.id === modeSlot);
          if (existingIndex !== -1) {
            // Update existing mode
            const updated = [...prev];
            updated[existingIndex] = newMode;
            return updated;
          } else {
            // Add new mode
            return [...prev, newMode];
          }
        });
        setShowWorkModeForm(false);
        setEditingWorkMode(null);
        setNewWorkMode({
          time: { start: "08:00", end: "23:59" },
          work: { duration: 0, unit: "s" },
          pause: { duration: 0, unit: "s" },
          weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        });

        const isUpdate = workModes.some(mode => mode.id === modeSlot);
    toast({
          title: isUpdate ? "Work Mode Updated" : "Work Mode Created",
          description: `Work mode "${settingName}" ${isUpdate ? 'updated' : 'created'} successfully in slot ${modeSlot}`,
        });
      } else {
        throw new Error(controlResponse.error || "Failed to create work mode");
      }
    } catch (error) {
      console.error('Work mode creation error:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create work mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingWorkMode(false);
    }
  };

  const toggleWeekDay = (day: string) => {
    setNewWorkMode(prev => ({
      ...prev,
      weekDays: prev.weekDays?.includes(day)
        ? prev.weekDays.filter(d => d !== day)
        : [...(prev.weekDays || []), day]
    }));
  };

  const fanLevels = ["Off", "L1", "L2"];
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] 2xl:w-[50vw] max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col bg-gradient-card border-border overflow-hidden">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold">Device Details</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading device details...</span>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 grid w-[calc(100%-3rem)] grid-cols-2 bg-background/50 flex-shrink-0">
            <TabsTrigger value="info" className="text-sm">Device Info</TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4 min-h-0 modal-scrollbar">
            {/* Device Image */}
            <div className="w-full max-w-[100px] sm:max-w-[120px] md:max-w-[140px] mx-auto">
              <div className="aspect-square rounded-lg border-2 border-dashed border-border/50 bg-background/50 flex flex-col items-center justify-center overflow-hidden">
                <img 
                  src="/download.jpg" 
                  alt={device.name} 
                  className="w-full h-full object-cover rounded-lg" 
                />
              </div>
            </div>

            {/* Device Information */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="device-name" className="text-muted-foreground text-sm">Name</Label>
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-2 py-1 text-sm border rounded bg-background flex-1 min-w-0"
                        placeholder="Enter device name"
                        disabled={isUpdatingName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleNameSave();
                          } else if (e.key === 'Escape') {
                            handleNameCancel();
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleNameSave}
                        disabled={isUpdatingName || !editingName.trim() || editingName === device.name}
                      >
                        {isUpdatingName ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleNameCancel}
                        disabled={isUpdatingName}
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="font-medium text-sm truncate">{device.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleNameEdit}
                        title="Edit device name"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="serial-number" className="text-muted-foreground text-sm">SN</Label>
                <span className="font-mono text-sm truncate">{device.serialNumber}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="share" className="text-muted-foreground text-sm">Share</Label>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="location-enable" className="text-muted-foreground text-sm">Loc Enable</Label>
                <Switch 
                  id="location-enable" 
                  checked={locationEnabled} 
                  onCheckedChange={setLocationEnabled}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="location" className="text-muted-foreground flex-shrink-0 text-sm">Location</Label>
                <div className="text-sm text-right max-w-[200px]">
                  {deviceDetails ? (
                    <div className="space-y-1">
                      <div className="truncate">
                        {deviceDetails.address || deviceDetails.city || 'Unknown Location'}
                      </div>
                      {(deviceDetails.lat && deviceDetails.lng) && (
                        <div className="text-xs text-muted-foreground">
                          📍 {deviceDetails.lat}, {deviceDetails.lng}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="truncate">{device.location}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="oil-name" className="text-muted-foreground text-sm">Oil Name</Label>
                <div className="flex items-center gap-2">
                  {isEditingOilName ? (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <input
                        type="text"
                        value={editingOilName}
                        onChange={(e) => setEditingOilName(e.target.value)}
                        className="px-2 py-1 text-sm border rounded bg-background flex-1 min-w-0"
                        placeholder="Enter oil name"
                        disabled={isUpdatingOilName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleOilNameSave();
                          } else if (e.key === 'Escape') {
                            handleOilNameCancel();
                          }
                        }}
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleOilNameSave}
                        disabled={isUpdatingOilName || !editingOilName.trim() || editingOilName === (deviceDetails?.oilName || (device as any).oilName || '')}
                      >
                        {isUpdatingOilName ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleOilNameCancel}
                        disabled={isUpdatingOilName}
                      >
                        <XIcon className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="font-medium text-sm truncate">
                        {deviceDetails?.oilName || (device as any).oilName || 'Not specified'}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 flex-shrink-0"
                        onClick={handleOilNameEdit}
                        title="Edit oil name"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                <Label htmlFor="fuel-rate" className="text-muted-foreground text-sm">Consumption Rate</Label>
                <span className="text-sm font-medium text-primary">
                  {getCurrentConsumption()} mL/Hr
                </span>
              </div>
            </div>

            {/* User Assignment */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
              <Label className="text-muted-foreground text-sm">Assigned User</Label>
              <span className="text-sm">Not assigned</span>
            </div>

            {/* Unbind/Delete Device Button */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full" 
                  size="lg"
                  disabled={deleteDeviceMutation.isPending}
                >
                  {deleteDeviceMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting Device...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
              Unbind Device
                    </>
                  )}
            </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unbind Device</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to unbind "{device.name}"? This will permanently remove the device from your account and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleteDeviceMutation.isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteDevice}
                    disabled={deleteDeviceMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteDeviceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Unbinding...
                      </>
                    ) : (
                      'Unbind Device'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
          
          <TabsContent value="settings" className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-4 min-h-0 modal-scrollbar">
            {/* Device Status Header */}
            <Card className="p-3 sm:p-4 bg-background/50 border-border/50">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{device.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground capitalize">{device.status}</p>
                  </div>
                </div>
                <Badge variant={device.status === "online" ? "default" : "secondary"} className="text-xs flex-shrink-0">
                  {device.status === "online" ? "Online" : "Offline"}
                </Badge>
              </div>

              {/* Fuel Gauge */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
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
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - (deviceDetails?.remainInfoCurrent || 0) / (deviceDetails?.remainInfoTotal || 1) * 100 / 100)}`}
                      className="text-primary transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-2xl font-bold">{Math.round((deviceDetails?.remainInfoCurrent || 0) / 10)}</span>
                    <span className="text-xs text-muted-foreground">ML</span>
                  </div>
                </div>
              </div>

              {/* Device Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
                <div>
                  <p className="text-sm font-medium">Not Set</p>
                  <p className="text-xs text-muted-foreground">Scent</p>
                </div>
                <div>
                  <p className="text-sm font-medium">{Math.round((deviceDetails?.remainInfoTotal || 0) / 10)} ML</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg py-1">
                  <p className="text-sm font-medium text-primary">{getCurrentConsumption()} mL/Hr</p>
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
                onClick={() => !isControllingFan && setShowFanSelector(!showFanSelector)}
              >
                <Label>Fan</Label>
                <div className="flex items-center gap-2">
                  {isControllingFan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Updating...</span>
                    </>
                  ) : (
                    <>
                  <span className="text-primary font-medium">{fanLevel}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </div>
              </div>
              
              {showFanSelector && !isControllingFan && (
                <div className="mt-4 space-y-2">
                  {fanLevels.map(level => (
                    <button
                      key={level}
                      onClick={() => handleFanSpeedChange(level)}
                      disabled={isControllingFan}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-colors",
                        fanLevel === level 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-background hover:bg-accent",
                        isControllingFan && "opacity-50 cursor-not-allowed"
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
                <div className="flex items-center gap-2">
                  {isControllingLock ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {deviceLocked ? 'Unlocking...' : 'Locking...'}
                      </span>
                    </>
                  ) : (
                <Switch 
                  id="device-lock" 
                  checked={deviceLocked} 
                      onCheckedChange={handleLockToggle}
                      disabled={isControllingLock}
                />
                  )}
                </div>
              </div>
            </Card>

            {/* Work Modes */}
            <Card className="p-3 sm:p-4 bg-background/50 border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h3 className="font-medium text-primary text-sm sm:text-base">Work Mode</h3>
                  {lastRefreshTime && (
                    <span className="text-xs text-muted-foreground">
                      Last updated: {lastRefreshTime.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => refreshWorkModes(true)}
                    disabled={refreshingWorkModes}
                    title="Manual refresh"
                  >
                    {refreshingWorkModes ? (
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Button>
                  {!editingWorkMode && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8"
                  onClick={() => setShowWorkModeForm(!showWorkModeForm)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                  )}
                </div>
              </div>

              {showWorkModeForm && (
                <Card className="p-4 bg-background/30 border-border/30 mb-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <div className="mt-1 p-2 bg-background/50 border border-border/50 rounded-md text-sm text-muted-foreground">
                        {editingWorkMode ? editingWorkMode.name : generateNextSettingName()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="work-duration" className="text-sm font-medium">Work Duration (s)</Label>
                        <Input
                          id="work-duration"
                          type="number"
                          value={newWorkMode.work?.duration || ""}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            work: { ...prev.work!, duration: e.target.value === "" ? 0 : Number(e.target.value) }
                          }))}
                          className="mt-1"
                          placeholder="150"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pause-duration" className="text-sm font-medium">Pause Duration (s)</Label>
                        <Input
                          id="pause-duration"
                          type="number"
                          value={newWorkMode.pause?.duration || ""}
                          onChange={(e) => setNewWorkMode(prev => ({
                            ...prev,
                            pause: { ...prev.pause!, duration: e.target.value === "" ? 0 : Number(e.target.value) }
                          }))}
                          className="mt-1"
                          placeholder="5"
                        />
                      </div>
                    </div>


                    <div>
                      <Label className="text-sm font-medium">Week Days</Label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {weekDays.map(day => (
                          <button
                            key={day}
                            onClick={() => toggleWeekDay(day)}
                            className={cn(
                              "px-2 py-1 text-xs rounded transition-colors flex-shrink-0",
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
                      <Button 
                        onClick={handleCreateWorkMode} 
                        size="sm" 
                        className="flex-1"
                        disabled={isCreatingWorkMode}
                      >
                        {isCreatingWorkMode ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {editingWorkMode ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          editingWorkMode ? "Update Mode" : "Create Mode"
                        )}
                      </Button>
                      <Button 
                        onClick={editingWorkMode ? handleCancelEdit : () => setShowWorkModeForm(false)} 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        disabled={isCreatingWorkMode}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {workModesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading work modes...</span>
                  </div>
                ) : workModes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No work modes configured</p>
                    <p className="text-xs text-muted-foreground mt-1">Click the + button to create a new schedule</p>
                  </div>
                ) : (
                  workModes.map(mode => (
                  <Card key={mode.id} className="p-4 bg-background/50 border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <Label htmlFor={`mode-${mode.id}`} className="font-medium">
                        {mode.name}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditWorkMode(mode)}
                          className="h-8 px-2"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      <Switch 
                        id={`mode-${mode.id}`}
                        checked={mode.enabled}
                        onCheckedChange={() => handleWorkModeToggle(mode.id)}
                      />
                      </div>
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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {weekDays.map(day => (
                              <Badge
                                key={day}
                                variant={mode.weekDays.includes(day) ? "default" : "outline"}
                                className="px-2 py-1 text-xs flex-shrink-0"
                              >
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                  ))
                )}
              </div>
            </Card>

            {/* Device Serial Number */}
            <div className="text-center text-xs text-muted-foreground pt-4">
              *Device Sn: {device.serialNumber}
            </div>
          </TabsContent>
        </Tabs>

          </>
        )}
      </DialogContent>
    </Dialog>
  );
}