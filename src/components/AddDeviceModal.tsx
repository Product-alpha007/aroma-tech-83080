import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AddLocationModal } from "./AddLocationModal";
import { DeviceCreateRequest } from "@/lib/api";
import { useCreateDeviceDirect } from "@/hooks/useDevices";

interface AddDeviceModalProps {
  locations: string[];
  onAddDevice: (device: { deviceId: string; name: string; location: string }) => void;
  onAddLocation: (name: string) => void;
}

export function AddDeviceModal({ locations, onAddDevice, onAddLocation }: AddDeviceModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<DeviceCreateRequest>({
    sn: "",
    name: "",
    deviceTypeId: "037164fe160203b9a5e665612b2e7d1b", // Default device type
    address: "",
    city: "",
    province: "",
    lat: "28.511333", // Default Delhi coordinates
    lng: "77.16705"
  });
  const { toast } = useToast();
  const createDeviceMutation = useCreateDeviceDirect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sn.trim()) {
      toast({
        title: "Missing Information",
        description: "Device serial number is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeviceMutation.mutateAsync(formData);
      
      // Call the callback for UI updates
      onAddDevice({
        deviceId: formData.sn,
        name: formData.name || formData.sn,
        location: "Unmapped", // New devices start as unmapped
      });

      // Reset form
      setFormData({
        sn: "",
        name: "",
        deviceTypeId: "037164fe160203b9a5e665612b2e7d1b",
        address: "",
        city: "",
        province: "",
        lat: "28.511333",
        lng: "77.16705"
      });
      setOpen(false);
      
      // The device list will automatically refresh due to React Query invalidation
    } catch (error) {
      console.error('Error creating device:', error);
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="default">
          <Plus className="w-4 h-4 mr-2" />
          Add Device
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Device</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="sn" className="text-sm sm:text-base">Serial Number *</Label>
            <Input
              id="sn"
              value={formData.sn}
              onChange={(e) => setFormData({ ...formData, sn: e.target.value })}
              placeholder="AR123456789"
              required
              className="text-sm sm:text-base"
            />
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="name" className="text-sm sm:text-base">Device Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Test Device (optional)"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="address" className="text-sm sm:text-base">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Test Street (optional)"
              className="text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="city" className="text-sm sm:text-base">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Test City (optional)"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="province" className="text-sm sm:text-base">Province</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Test Province (optional)"
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="lat" className="text-sm sm:text-base">Latitude</Label>
              <Input
                id="lat"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="28.511333"
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="lng" className="text-sm sm:text-base">Longitude</Label>
              <Input
                id="lng"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="77.16705"
                className="text-sm sm:text-base"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={createDeviceMutation.isPending}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createDeviceMutation.isPending}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {createDeviceMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Device'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}