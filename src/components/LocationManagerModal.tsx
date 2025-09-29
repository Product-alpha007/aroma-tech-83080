import { useState } from "react";
import { Settings, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface LocationManagerModalProps {
  locations: Array<{ name: string; deviceCount: number }>;
  onEditLocation: (oldName: string, newName: string) => void;
  onDeleteLocation: (name: string) => void;
}

export function LocationManagerModal({ locations, onEditLocation, onDeleteLocation }: LocationManagerModalProps) {
  const [open, setOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();

  const startEdit = (locationName: string) => {
    setEditingLocation(locationName);
    setEditName(locationName);
  };

  const saveEdit = () => {
    if (editingLocation && editName.trim() && editName.trim() !== editingLocation) {
      onEditLocation(editingLocation, editName.trim());
      toast({
        title: "Location Updated",
        description: `Location renamed to ${editName.trim()}`,
      });
    }
    setEditingLocation(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditingLocation(null);
    setEditName("");
  };

  const handleDelete = (locationName: string) => {
    onDeleteLocation(locationName);
    toast({
      title: "Location Deleted",
      description: `${locationName} deleted. Devices moved to unmapped.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <Settings className="w-4 h-4 mr-2" />
          Manage Locations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Locations</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No locations found</p>
            </div>
          ) : (
            locations.map((location) => (
              <div key={location.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {editingLocation === location.name ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium">{location.name}</p>
                      </div>
                      <Badge variant="secondary">{location.deviceCount} devices</Badge>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {editingLocation === location.name ? (
                    <>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(location.name)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Location</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{location.name}"? 
                              {location.deviceCount > 0 && ` The ${location.deviceCount} device(s) will be moved to unmapped.`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(location.name)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}