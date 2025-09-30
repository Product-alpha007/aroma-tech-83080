import { useState } from "react";
import { User, MapPin, Upload, Download, FileText, X } from "lucide-react";
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
  onMappingUpdate?: (mappings: UserDeviceMapping[]) => void;
}

export function UserDeviceMappingModal({ devices, onMappingUpdate }: UserDeviceMappingModalProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "John Doe", email: "john@example.com", phone: "+1234567890", department: "IT" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+0987654321", department: "HR" },
    { id: "3", name: "Mike Johnson", email: "mike@example.com", phone: "+1122334455", department: "Operations" },
  ]);
  const [mappings, setMappings] = useState<UserDeviceMapping[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", phone: "", department: "" });
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

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      ...newUser,
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: "", email: "", phone: "", department: "" });

    toast({
      title: "User Added",
      description: `${user.name} has been added successfully`,
    });
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
                        {user.name} ({user.email})
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
                        {device.name} (ID: {device.deviceId})
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
          
          <TabsContent value="users" className="flex-1 space-y-4">
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
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.phone && <p className="text-xs text-muted-foreground">{user.phone}</p>}
                      </div>
                      {user.department && (
                        <Badge variant="outline">{user.department}</Badge>
                      )}
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