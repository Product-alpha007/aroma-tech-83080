import { useState } from "react";
import { User, MapPin, Upload, Download, FileText, X, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useUsers, User as UserType } from "@/contexts/UserContext";

interface Device {
  id: string;
  name: string;
  deviceId: string;
  status: "online" | "offline";
  fuelLevel: number;
  fuelRate: string;
  location: string;
}

interface UserDeviceMapping {
  id: string;
  userId: string;
  deviceId: string;
  mappedAt: Date;
}

interface UserDeviceMappingModalProps {
  devices: Device[];
  locations: string[];
  onMappingUpdate?: (mappings: UserDeviceMapping[]) => void;
  onAddLocation?: (name: string) => void;
}

export function UserDeviceMappingModal({ devices, locations, onMappingUpdate, onAddLocation }: UserDeviceMappingModalProps) {
  const [open, setOpen] = useState(false);
  const { users, addUser, updateUser, removeUser } = useUsers();
  const [mappings, setMappings] = useState<UserDeviceMapping[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", department: "", locations: [] as string[] });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState({ role: "", department: "", locations: [] as string[], permissions: [] as string[] });
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const { toast } = useToast();

  const availableDevices = devices.filter(device => 
    !mappings.find(mapping => mapping.deviceId === device.id)
  );

  const handleSingleMapping = () => {
    if (!selectedUserId || !selectedDeviceId) {
      toast({
        title: "Missing Selection",
        description: "Please select both user and device",
        variant: "destructive",
      });
      return;
    }

    const existingMapping = mappings.find(m => m.deviceId === selectedDeviceId);
    if (existingMapping) {
      toast({
        title: "Device Already Mapped",
        description: "This device is already mapped to a user",
        variant: "destructive",
      });
      return;
    }

    const newMapping: UserDeviceMapping = {
      id: Date.now().toString(),
      userId: selectedUserId,
      deviceId: selectedDeviceId,
      mappedAt: new Date(),
    };

    const updatedMappings = [...mappings, newMapping];
    setMappings(updatedMappings);
    setSelectedUserId("");
    setSelectedDeviceId("");
    onMappingUpdate?.(updatedMappings);

    const user = users.find(u => u.id === selectedUserId);
    const device = devices.find(d => d.id === selectedDeviceId);

    toast({
      title: "Device Mapped",
      description: `${device?.name} mapped to ${user?.name}`,
    });
  };

  const handleRemoveMapping = (mappingId: string) => {
    const updatedMappings = mappings.filter(m => m.id !== mappingId);
    setMappings(updatedMappings);
    onMappingUpdate?.(updatedMappings);

    toast({
      title: "Mapping Removed",
      description: "Device mapping has been removed",
    });
  };

  const handleAddLocation = () => {
    if (!newLocationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    if (locations.includes(newLocationName)) {
      toast({
        title: "Location Exists",
        description: "This location already exists",
        variant: "destructive",
      });
      return;
    }

    onAddLocation?.(newLocationName);
    setNewLocationName("");
    setShowAddLocation(false);

    toast({
      title: "Location Added",
      description: `${newLocationName} has been added successfully`,
    });
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim() || newUser.locations.length === 0) {
      toast({
        title: "Missing Information",
        description: "Name, email, and at least one location are required",
        variant: "destructive",
      });
      return;
    }

    addUser({
      ...newUser,
      role: "User",
      permissions: ["read"],
    });

    setNewUser({ name: "", email: "", department: "", locations: [] });

    toast({
      title: "User Added",
      description: `${newUser.name} has been added successfully`,
    });
  };

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setEditUser({
      role: user.role || "",
      department: user.department || "",
      locations: user.locations || [],
      permissions: user.permissions || [],
    });
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = () => {
    if (editUser.locations.length === 0) {
      toast({
        title: "Missing Information",
        description: "At least one location is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser) return;

    updateUser(editingUser.id, {
      role: editUser.role,
      department: editUser.department,
      locations: editUser.locations,
      permissions: editUser.permissions,
    });

    setEditingUser(null);
    setEditUser({ role: "", department: "", locations: [], permissions: [] });
    setEditUserModalOpen(false);

    toast({
      title: "User Updated",
      description: `${editingUser.name} has been updated successfully`,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUser({ role: "", department: "", locations: [], permissions: [] });
    setEditUserModalOpen(false);
  };

  const handleRemoveUser = (user: UserType) => {
    setUserToDelete(user);
  };

  const confirmRemoveUser = () => {
    if (userToDelete) {
      removeUser(userToDelete.id);
      setUserToDelete(null);
      toast({
        title: "User Removed",
        description: `${userToDelete.name} has been removed successfully`,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setCsvFile(selectedFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const processBulkMapping = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      if (!headers.includes('useremail') || !headers.includes('deviceid')) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must have columns: userEmail, deviceId",
          variant: "destructive",
        });
        return;
      }

      const userEmailIndex = headers.indexOf('useremail');
      const deviceIdIndex = headers.indexOf('deviceid');
      
      const bulkMappings: UserDeviceMapping[] = [];
      const errors: string[] = [];

      lines.slice(1).forEach((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const userEmail = values[userEmailIndex];
        const deviceId = values[deviceIdIndex];

        const user = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
        const device = devices.find(d => d.deviceId === deviceId);

        if (!user) {
          errors.push(`Row ${index + 2}: User with email ${userEmail} not found`);
          return;
        }

        if (!device) {
          errors.push(`Row ${index + 2}: Device with ID ${deviceId} not found`);
          return;
        }

        const existingMapping = mappings.find(m => m.deviceId === device.id);
        if (existingMapping) {
          errors.push(`Row ${index + 2}: Device ${deviceId} is already mapped`);
          return;
        }

        bulkMappings.push({
          id: `${Date.now()}-${index}`,
          userId: user.id,
          deviceId: device.id,
          mappedAt: new Date(),
        });
      });

      if (bulkMappings.length > 0) {
        const updatedMappings = [...mappings, ...bulkMappings];
        setMappings(updatedMappings);
        onMappingUpdate?.(updatedMappings);
      }

      setCsvFile(null);

      if (errors.length > 0) {
        toast({
          title: "Bulk Mapping Completed with Errors",
          description: `${bulkMappings.length} mappings created, ${errors.length} errors`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bulk Mapping Complete",
          description: `${bulkMappings.length} device mappings created successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Error processing CSV file",
        variant: "destructive",
      });
    }
  };

  const downloadMappingTemplate = () => {
    const csvContent = "userEmail,deviceId\njohn@example.com,273894643664\njane@example.com,273894643665\nmike@example.com,273894643666";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_device_mapping_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded",
    });
  };

  const getMappingDetails = (mapping: UserDeviceMapping) => {
    const user = users.find(u => u.id === mapping.userId);
    const device = devices.find(d => d.id === mapping.deviceId);
    return { user, device };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          <User className="w-4 h-4 mr-2" />
          User Mapping
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Device to User Mapping</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="single">Single Mapping</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Mapping</TabsTrigger>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="current">Current Mappings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {(user.locations || []).join(", ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Select Device</Label>
                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDevices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.name} (ID: {device.deviceId}) - {device.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleSingleMapping} className="w-full">
              <MapPin className="w-4 h-4 mr-2" />
              Create Mapping
            </Button>
          </TabsContent>
          
          <TabsContent value="bulk" className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mappingCsvFile">Select CSV File</Label>
              <Input
                id="mappingCsvFile"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              {csvFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {csvFile.name}
                </p>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">CSV Format Requirements:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Headers: userEmail, deviceId</li>
                <li>User email must match existing users</li>
                <li>Device ID must match existing devices</li>
                <li>One mapping per row</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={downloadMappingTemplate} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
              <Button onClick={processBulkMapping} disabled={!csvFile} className="flex-1">
                <Upload className="w-4 h-4 mr-2" />
                Process Mappings
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="flex-1 space-y-4 overflow-y-auto">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Add New User</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={newUser.department}
                    onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Locations * (Select multiple)</Label>
                  {!showAddLocation ? (
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Select 
                          value=""
                          onValueChange={(value) => {
                            if (!newUser.locations.includes(value)) {
                              setNewUser(prev => ({ ...prev, locations: [...prev.locations, value] }));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Add location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.filter(loc => !newUser.locations.includes(loc)).map(location => (
                              <SelectItem key={location} value={location}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  {location}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newUser.locations.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/50">
                            {newUser.locations.map((loc) => (
                              <Badge 
                                key={loc} 
                                variant="secondary"
                                className="gap-1"
                              >
                                <MapPin className="w-3 h-3" />
                                {loc}
                                <button
                                  type="button"
                                  onClick={() => setNewUser(prev => ({ 
                                    ...prev, 
                                    locations: prev.locations.filter(l => l !== loc) 
                                  }))}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddLocation(true)}
                        title="Add new location"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        placeholder="Enter new location name"
                        className="flex-1"
                      />
                      <Button onClick={handleAddLocation} size="sm">
                        Add
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddLocation(false);
                          setNewLocationName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={handleAddUser} className="mt-4 w-full">
                Add User
              </Button>
            </Card>
            
            
            <div className="space-y-2">
              <h3 className="font-medium">Existing Users</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {users.map(user => (
                  <Card key={user.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {(user.locations || []).map((loc) => (
                              <span key={loc} className="text-xs text-muted-foreground">{loc}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="flex flex-col gap-1 items-end">
                           {user.department && (
                             <Badge variant="outline">{user.department}</Badge>
                           )}
                           {user.role && (
                             <Badge variant="default">{user.role}</Badge>
                           )}
                           <div className="flex flex-wrap gap-1 justify-end">
                             {(user.locations || []).map((loc) => (
                               <Badge key={loc} variant="secondary" className="text-xs">
                                 {loc}
                               </Badge>
                             ))}
                           </div>
                         </div>
                         <Button
                           size="icon"
                           variant="ghost"
                           onClick={() => handleEditUser(user)}
                           title="Edit user"
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                           size="icon"
                           variant="ghost"
                           onClick={() => handleRemoveUser(user)}
                           title="Remove user"
                         >
                           <Trash2 className="w-4 h-4 text-destructive" />
                         </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="current" className="flex-1 space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {mappings.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No device mappings yet</p>
                </div>
              ) : (
                mappings.map(mapping => {
                  const { user, device } = getMappingDetails(mapping);
                  return (
                    <Card key={mapping.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span className="font-medium">{user?.name}</span>
                            <span className="text-sm text-muted-foreground">({user?.email})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{device?.name}</span>
                            <Badge variant="outline">{device?.deviceId}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mapped on {mapping.mappedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMapping(mapping.id)}
                          title="Remove mapping"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Edit User Modal */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Non-editable user info */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="font-medium">{editingUser.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm">{editingUser.email}</p>
                </div>
                {editingUser.phone && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <p className="text-sm">{editingUser.phone}</p>
                  </div>
                )}
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={editUser.role} onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={editUser.department}
                    onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter department"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Locations * (Select multiple)</Label>
                  <div className="space-y-2">
                    <Select 
                      value=""
                      onValueChange={(value) => {
                        if (!editUser.locations.includes(value)) {
                          setEditUser(prev => ({ ...prev, locations: [...prev.locations, value] }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Add location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.filter(loc => !editUser.locations.includes(loc)).map(location => (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {location}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editUser.locations.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-muted/50">
                        {editUser.locations.map((loc) => (
                          <Badge 
                            key={loc} 
                            variant="secondary"
                            className="gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {loc}
                            <button
                              type="button"
                              onClick={() => setEditUser(prev => ({ 
                                ...prev, 
                                locations: prev.locations.filter(l => l !== loc) 
                              }))}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["read", "write", "delete", "admin"].map(permission => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={editUser.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditUser(prev => ({ 
                                ...prev, 
                                permissions: [...prev.permissions, permission] 
                              }));
                            } else {
                              setEditUser(prev => ({ 
                                ...prev, 
                                permissions: prev.permissions.filter(p => p !== permission) 
                              }));
                            }
                          }}
                          className="rounded border-border"
                        />
                        <span className="text-sm capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateUser} className="flex-1">
                  Update User
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}