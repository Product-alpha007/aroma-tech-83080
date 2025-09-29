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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="locationName">Location Name *</Label>
            <Input
              id="locationName"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="Enter location name"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Location</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}