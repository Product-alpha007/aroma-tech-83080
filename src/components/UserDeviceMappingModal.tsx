import { useState } from "react";
import { User, MapPin, Upload, Download, FileText, X, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  location: string;
}

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
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", phone: "+1234567890", department: "IT", location: "Location A" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+0987654321", department: "HR", location: "Location B" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com", phone: "+1122334455", department: "Operations", location: "Location A" },
  ]);
  const [mappings, setMappings] = useState<UserDeviceMapping[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", department: "", location: "" });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState({ name: "", email: "", phone: "", department: "", location: "" });
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
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.location.trim()) {
      toast({
        title: "Missing Information",
        description: "Name, email, and location are required",
        variant: "destructive",
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: "", email: "", phone: "", department: "", location: "" });

    toast({
      title: "User Added",
      description: `${user.name} has been added successfully`,
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUser({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      department: user.department || "",
      location: user.location,
    });
  };

  const handleUpdateUser = () => {
    if (!editUser.name.trim() || !editUser.email.trim() || !editUser.location.trim()) {
      toast({
        title: "Missing Information",
        description: "Name, email, and location are required",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser) return;

    const updatedUser: User = {
      id: editingUser.id,
      ...editUser,
    };

    setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
    setEditingUser(null);
    setEditUser({ name: "", email: "", phone: "", department: "", location: "" });

    toast({
      title: "User Updated",
      description: `${updatedUser.name} has been updated successfully`,
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUser({ name: "", email: "", phone: "", department: "", location: "" });
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
                        {user.name} ({user.email}) - {user.location}
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
                  <Label>Phone</Label>
                  <Input
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
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
                <div className="space-y-2 col-span-2">
                  <Label>Location *</Label>
                  {!showAddLocation ? (
                    <div className="flex gap-2">
                      <Select value={newUser.location} onValueChange={(value) => setNewUser(prev => ({ ...prev, location: value }))}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location} value={location}>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {location}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
            
            {editingUser && (
              <Card className="p-4 border-primary">
                <h3 className="font-medium mb-4">Edit User: {editingUser.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input
                      value={editUser.name}
                      onChange={(e) => setEditUser(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter user name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={editUser.phone}
                      onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={editUser.department}
                      onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Location *</Label>
                    <Select value={editUser.location} onValueChange={(value) => setEditUser(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map(location => (
                          <SelectItem key={location} value={location}>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {location}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateUser} className="flex-1">
                    Update User
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
            
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
                          <span className="text-xs text-muted-foreground">{user.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1 items-end">
                          {user.department && (
                            <Badge variant="outline">{user.department}</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {user.location}
                          </Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
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
    </Dialog>
  );
}