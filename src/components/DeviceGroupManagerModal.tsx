import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeviceGroupsAll } from "@/hooks/useDeviceGroupsAll";
import { useCreateDeviceGroup, useUpdateDeviceGroup, useDeleteDeviceGroup } from "@/hooks/useDeviceGroups";
import { useDevices } from "@/hooks/useDevices";
import { DeviceGroup, DeviceGroupWithDevices, DeviceGroupCreateRequest, DeviceGroupUpdateRequest } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";

interface DeviceGroupManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceGroupManagerModal({ open, onOpenChange }: DeviceGroupManagerModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeviceGroupWithDevices | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<DeviceGroupWithDevices | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { data: groupsData, isLoading, error, refetch } = useDeviceGroupsAll();
  const groups = groupsData?.groups || [];
  
  // Debug logging
  console.log('🔍 DeviceGroupManagerModal - Open state:', open);
  console.log('🔍 DeviceGroupManagerModal - Groups data:', groups);
  console.log('🔍 DeviceGroupManagerModal - Loading:', isLoading);
  console.log('🔍 DeviceGroupManagerModal - Error:', error);
  const { data: devicesResponse } = useDevices(1, 1000); // Get all devices
  const devices = devicesResponse?.data?.records || [];
  
  const createGroupMutation = useCreateDeviceGroup();
  const updateGroupMutation = useUpdateDeviceGroup();
  const deleteGroupMutation = useDeleteDeviceGroup();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setIsCreating(false);
      setEditingGroup(null);
      setGroupName("");
      setGroupDescription("");
      setSelectedDevices([]);
    }
  }, [open]);

  // Reset form when editing
  useEffect(() => {
    if (editingGroup) {
      setGroupName(editingGroup.name);
      setGroupDescription("");
      setSelectedDevices(editingGroup.devices?.map(d => d.id) || []);
    }
  }, [editingGroup]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const request: DeviceGroupCreateRequest = {
      name: groupName.trim(),
      description: groupDescription.trim(),
      parentGroupId: "",
      deviceIds: selectedDevices,
    };

    try {
      await createGroupMutation.mutateAsync(request);
      toast({
        title: "Success",
        description: `Group "${groupName}" created successfully`,
      });
      setIsCreating(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedDevices([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const request: DeviceGroupUpdateRequest = {
      name: groupName.trim(),
      parentGroupId: "",
      deviceIds: selectedDevices,
      clean: true,
      id: editingGroup.id,
    };

    try {
      await updateGroupMutation.mutateAsync(request);
      toast({
        title: "Success",
        description: `Group "${groupName}" updated successfully`,
      });
      setEditingGroup(null);
      setGroupName("");
      setGroupDescription("");
      setSelectedDevices([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await deleteGroupMutation.mutateAsync(groupToDelete.id);
      toast({
        title: "Success",
        description: `Group "${groupToDelete.name}" deleted successfully`,
      });
      setGroupToDelete(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const selectAllDevices = () => {
    setSelectedDevices(devices.map(device => device.id));
  };

  const deselectAllDevices = () => {
    setSelectedDevices([]);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading device groups...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Device Groups
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Form */}
          {(isCreating || editingGroup) && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium">
                {editingGroup ? "Edit Group" : "Create New Group"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., 8th Floor Devices"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Description</Label>
                  <Input
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* Device Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Select Devices</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllDevices}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllDevices}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-3">
                  {devices.map(device => (
                    <div key={device.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={device.id}
                        checked={selectedDevices.includes(device.id)}
                        onCheckedChange={() => toggleDeviceSelection(device.id)}
                      />
                      <Label htmlFor={device.id} className="text-sm">
                        {device.name} ({device.sn})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                  disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                >
                  {editingGroup ? "Update Group" : "Create Group"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingGroup(null);
                    setGroupName("");
                    setGroupDescription("");
                    setSelectedDevices([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Groups List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Existing Groups</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {!isCreating && !editingGroup && (
                  <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-12 h-12 mx-auto mb-2" />
                <p>No device groups found</p>
                <p className="text-sm">Create your first group to organize devices by location</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{group.name}</h4>
                      {groupDescription && editingGroup?.id === group.id && (
                        <p className="text-sm text-muted-foreground">{groupDescription}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {group.device_count || group.devices?.length || 0} devices
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGroup(group)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setGroupToDelete(group)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Group</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{group.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteGroup}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
