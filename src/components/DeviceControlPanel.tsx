import { useState } from 'react';
import { Power, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useControlDevice, useBatchControlDevices } from '@/hooks/useDevices';
import { Device } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface DeviceControlPanelProps {
  device: Device;
  onClose?: () => void;
}

// Common device control commands (hex frames)
const DEVICE_COMMANDS = {
  POWER_ON: 'AA5500FF',
  POWER_OFF: 'AA5501FF',
  INTENSITY_LOW: 'AA5502FF',
  INTENSITY_MEDIUM: 'AA5503FF',
  INTENSITY_HIGH: 'AA5504FF',
  MODE_CONTINUOUS: 'AA5505FF',
  MODE_INTERMITTENT: 'AA5506FF',
  RESET: 'AA55FFFF',
};

export function DeviceControlPanel({ device, onClose }: DeviceControlPanelProps) {
  const [intensity, setIntensity] = useState(50);
  const [mode, setMode] = useState('continuous');
  const [isPowered, setIsPowered] = useState(device.status === 'online');
  
  const controlDevice = useControlDevice();
  const batchControl = useBatchControlDevices();
  const { toast } = useToast();

  const handlePowerToggle = async () => {
    const command = isPowered ? DEVICE_COMMANDS.POWER_OFF : DEVICE_COMMANDS.POWER_ON;
    
    try {
      await controlDevice.mutateAsync({
        id: device.id,
        frame: command,
      });
      setIsPowered(!isPowered);
    } catch (error) {
      console.error('Power control failed:', error);
    }
  };

  const handleIntensityChange = async (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    
    // Map intensity to command
    let command: string;
    if (newIntensity <= 33) {
      command = DEVICE_COMMANDS.INTENSITY_LOW;
    } else if (newIntensity <= 66) {
      command = DEVICE_COMMANDS.INTENSITY_MEDIUM;
    } else {
      command = DEVICE_COMMANDS.INTENSITY_HIGH;
    }

    try {
      await controlDevice.mutateAsync({
        id: device.id,
        frame: command,
      });
    } catch (error) {
      console.error('Intensity control failed:', error);
    }
  };

  const handleModeChange = async (newMode: string) => {
    setMode(newMode);
    
    const command = newMode === 'continuous' 
      ? DEVICE_COMMANDS.MODE_CONTINUOUS 
      : DEVICE_COMMANDS.MODE_INTERMITTENT;

    try {
      await controlDevice.mutateAsync({
        id: device.id,
        frame: command,
      });
    } catch (error) {
      console.error('Mode control failed:', error);
    }
  };

  const handleReset = async () => {
    try {
      await controlDevice.mutateAsync({
        id: device.id,
        frame: DEVICE_COMMANDS.RESET,
      });
      setIsPowered(false);
      setIntensity(50);
      setMode('continuous');
      toast({
        title: "Device Reset",
        description: "Device has been reset to default settings",
      });
    } catch (error) {
      console.error('Reset failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{device.name}</CardTitle>
          <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
            {device.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Device ID: {device.deviceId}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Power Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Power</span>
            <Button
              onClick={handlePowerToggle}
              disabled={controlDevice.isPending}
              variant={isPowered ? "destructive" : "default"}
              size="sm"
              className="gap-2"
            >
              <Power className="w-4 h-4" />
              {isPowered ? 'Turn Off' : 'Turn On'}
            </Button>
          </div>
        </div>

        {/* Intensity Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Intensity</span>
            <span className="text-sm text-muted-foreground">{intensity}%</span>
          </div>
          <Slider
            value={[intensity]}
            onValueChange={handleIntensityChange}
            max={100}
            step={1}
            className="w-full"
            disabled={!isPowered || controlDevice.isPending}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Mode Control */}
        <div className="space-y-3">
          <span className="text-sm font-medium">Mode</span>
          <Select value={mode} onValueChange={handleModeChange} disabled={!isPowered || controlDevice.isPending}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="continuous">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Continuous
                </div>
              </SelectItem>
              <SelectItem value="intermittent">
                <div className="flex items-center gap-2">
                  <Pause className="w-4 h-4" />
                  Intermittent
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Device Info */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Oil Level:</span>
            <span>{device.oilLevel || 0}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fuel Rate:</span>
            <span>{device.fuelRate || 0} mL/hr</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tank Capacity:</span>
            <span>{device.tankCapacity || 0} mL</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            disabled={controlDevice.isPending}
            className="flex-1 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          )}
        </div>

        {/* Loading State */}
        {controlDevice.isPending && (
          <div className="flex items-center justify-center py-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Sending command...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
