import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface AddLocationModalProps {
  onAddLocation: (name: string) => void;
  trigger?: React.ReactNode;
}

export function AddLocationModal({ onAddLocation, trigger }: AddLocationModalProps) {
  const [open, setOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a location name",
        variant: "destructive",
      });
      return;
    }

    onAddLocation(locationName.trim());
    setLocationName("");
    setOpen(false);

    toast({
      title: "Location Added",
      description: `${locationName} has been created`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="glass" size="default">
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="locationName" className="text-sm sm:text-base">Location Name *</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter location name"
              required
              className="text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto text-sm sm:text-base">Add Location</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}