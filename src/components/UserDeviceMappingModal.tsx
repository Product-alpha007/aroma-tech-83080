import { useState, useEffect, useCallback } from "react";
import { User, MapPin, X, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { aromaAPI, SubAccountCreateRequest, SubAccount, SharedDevice, SharedDevicesResponse, Device } from "@/lib/api";


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
  const [users, setUsers] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState<UserDeviceMapping[]>([]);
  const [sharedDevices, setSharedDevices] = useState<SharedDevice[]>([]);
  const [loadingSharedDevices, setLoadingSharedDevices] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loadingAvailableDevices, setLoadingAvailableDevices] = useState(false);
  const [selectedUserForSharing, setSelectedUserForSharing] = useState<string>("");
  const [selectedRights, setSelectedRights] = useState<"VIEW" | "CONTROL">("CONTROL");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [newUser, setNewUser] = useState({ 
    email: "", 
    password: "", 
    locations: [] as string[]
  });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [editingUser, setEditingUser] = useState<SubAccount | null>(null);
  const [editUserModalOpen, setEditUserModalOpen] = useState(false);
  const [editUser, setEditUser] = useState({ role: "", department: "", locations: [] as string[], permissions: [] as string[] });
  const [userToDelete, setUserToDelete] = useState<SubAccount | null>(null);
  const { toast } = useToast();

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aromaAPI.getSubAccounts();
      if (response.success && response.data) {
        // Handle both array and object with data property
        const usersArray = Array.isArray(response.data) ? response.data : response.data.data;
        setUsers(usersArray || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch shared devices from API
  const fetchSharedDevices = useCallback(async () => {
    try {
      setLoadingSharedDevices(true);
      
      // For now, we'll fetch shared devices for all users
      // In a real implementation, you might want to fetch for a specific user
      const allSharedDevices: SharedDevice[] = [];
      
      for (const user of users) {
        try {
          const response = await aromaAPI.getSubAccountSharedDevices(user.id);
          
          if (response.success && response.data) {
            allSharedDevices.push(...response.data.data);
          }
        } catch (error) {
          // Don't fail completely if one user fails, just skip them
        }
      }
      
      setSharedDevices(allSharedDevices);
    } catch (error) {
      setSharedDevices([]);
    } finally {
      setLoadingSharedDevices(false);
    }
  }, [users, toast]);

  // Fetch available devices for sharing
  const fetchAvailableDevices = useCallback(async (userId: string) => {
    if (!userId) return;
    
    console.log(`🔍 fetchAvailableDevices: Starting fetch for userId: ${userId}`);
    
    try {
      setLoadingAvailableDevices(true);
      const response = await aromaAPI.getSubAccountAvailableDevices(userId);
      
      console.log(`📊 fetchAvailableDevices: API response`, {
        success: response.success,
        hasData: !!response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        error: response.error,
        fullResponse: response,
      });
      
      if (response.success && response.data) {
        // The API returns devices directly as an array
        setAvailableDevices(response.data);
        console.log(`✅ fetchAvailableDevices: Set available devices`, response.data);
      } else {
        setAvailableDevices([]);
        console.log(`❌ fetchAvailableDevices: No data, set empty array`);
      }
    } catch (error) {
      console.error(`❌ fetchAvailableDevices: Error occurred`, error);
      setAvailableDevices([]);
    } finally {
      setLoadingAvailableDevices(false);
    }
  }, [users, toast]);

  // Load users when modal opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);


  // Load shared devices when users are loaded
  useEffect(() => {
    if (users && users.length > 0) {
      fetchSharedDevices();
    }
  }, [users, fetchSharedDevices]);

  // Helper function to handle cascading permission selection (for Edit User modal)
  const getCascadingPermissions = (permissionId: string, isChecked: boolean, currentPermissions: string[]) => {
    let newPermissions = [...currentPermissions];
    
    if (isChecked) {
      // If checking, add the permission and required lower-level permissions
      if (permissionId === "write") {
        // Edit requires View
        if (!newPermissions.includes("read")) newPermissions.push("read");
        if (!newPermissions.includes("write")) newPermissions.push("write");
      } else if (permissionId === "delete") {
        // Delete requires View and Edit
        if (!newPermissions.includes("read")) newPermissions.push("read");
        if (!newPermissions.includes("write")) newPermissions.push("write");
        if (!newPermissions.includes("delete")) newPermissions.push("delete");
      } else if (permissionId === "admin") {
        // Admin requires all permissions
        if (!newPermissions.includes("read")) newPermissions.push("read");
        if (!newPermissions.includes("write")) newPermissions.push("write");
        if (!newPermissions.includes("delete")) newPermissions.push("delete");
        if (!newPermissions.includes("admin")) newPermissions.push("admin");
      } else if (permissionId === "read") {
        // Just add read if not already present
        if (!newPermissions.includes("read")) newPermissions.push("read");
      }
    } else {
      // If unchecking, remove the permission and all higher-level permissions
      if (permissionId === "read") {
        // Remove read and all higher permissions
        newPermissions = newPermissions.filter(p => !["read", "write", "delete", "admin"].includes(p));
      } else if (permissionId === "write") {
        // Remove write and all higher permissions
        newPermissions = newPermissions.filter(p => !["write", "delete", "admin"].includes(p));
      } else if (permissionId === "delete") {
        // Remove delete and all higher permissions
        newPermissions = newPermissions.filter(p => !["delete", "admin"].includes(p));
      } else if (permissionId === "admin") {
        // Remove only admin
        newPermissions = newPermissions.filter(p => p !== "admin");
      }
    }
    
    return newPermissions;
  };

  const availableDevicesForMapping = (devices || []).filter(device => 
    !(mappings || []).find(mapping => mapping.deviceId === device.id)
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

    const user = users && users.find(u => u.id === selectedUserId);
    const device = devices.find(d => d.id === selectedDeviceId);

    toast({
      title: "Device Mapped",
      description: `${device?.name} mapped to ${user?.note || user?.account}`,
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

  const handleAddUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim() || newUser.locations.length === 0) {
      toast({
        title: "Missing Information",
        description: "Email, password, and at least one location are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const subAccountRequest: SubAccountCreateRequest = {
        account: newUser.email.trim(), // Use email as account
        password: newUser.password.trim(),
        name: newUser.email.trim(), // Use email as name for now
        permissions: ["read"] // Default permissions
      };

      const response = await aromaAPI.createSubAccount(subAccountRequest);
      
      if (response.success && response.data) {
        // Enable the newly created sub account
        try {
          const enableResponse = await aromaAPI.enableSubAccount(response.data.id);
          if (!enableResponse.success) {
            console.warn('Failed to enable sub account:', enableResponse.error);
          }
        } catch (enableError) {
          console.warn('Error enabling sub account:', enableError);
        }

        setNewUser({ email: "", password: "", locations: [] });
    toast({
      title: "User Added",
          description: `${newUser.email} has been created and enabled successfully`,
        });
        // Refresh users list
        await fetchUsers();
      } else {
        // Handle specific Chinese error messages
        let errorMessage = response.error || "Failed to create user";
        if (errorMessage.includes("账号已存在")) {
          errorMessage = "An account with this email already exists. Please try signing in instead.";
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle Chinese error messages in catch block
      let errorMessage = "Failed to create user. Please try again.";
      if (error?.response?.data?.error?.includes("账号已存在")) {
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      } else if (error?.message?.includes("账号已存在")) {
        errorMessage = "An account with this email already exists. Please try signing in instead.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: SubAccount) => {
    setEditingUser(user);
    setEditUser({
      role: user.status === 1 ? "Active" : "Inactive",
      department: user.note || "",
      locations: [],
      permissions: [],
    });
    setEditUserModalOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await aromaAPI.updateSubAccount(editingUser.id, {
        name: editUser.department, // This will be the note field
      });

      if (response.success) {
        toast({
          title: "User Updated",
          description: `${editingUser.note || editingUser.account} has been updated successfully`,
        });
    setEditingUser(null);
    setEditUser({ role: "", department: "", locations: [], permissions: [] });
    setEditUserModalOpen(false);
        // Refresh users list
        await fetchUsers();
      } else {
    toast({
          title: "Error",
          description: response.error || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUser({ role: "", department: "", locations: [], permissions: [] });
    setEditUserModalOpen(false);
  };

  const handleRemoveUser = (user: SubAccount) => {
    setUserToDelete(user);
  };

  // Handle device sharing
  const handleShareDevice = async (deviceId: string, userId: string, rights: "VIEW" | "CONTROL" = "CONTROL") => {
    try {
      const response = await aromaAPI.shareDeviceWithSubAccount({
        subId: userId,
        deviceId: deviceId,
        rights: rights
      });

      if (response.ok) {
        toast({
          title: "Device Shared",
          description: `Device has been shared with ${rights} access`,
        });
        // Refresh available devices and shared devices
        await fetchAvailableDevices(userId);
        await fetchSharedDevices();
    } else {
      toast({
          title: "Error",
          description: "Failed to share device",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sharing device:', error);
      toast({
        title: "Error",
        description: "Failed to share device",
        variant: "destructive",
      });
    }
  };

  // Handle canceling device sharing
  const handleCancelDeviceShare = async (deviceId: string, userId: string) => {
    try {
      const response = await aromaAPI.cancelDeviceShareWithSubAccount({
        subId: userId,
        deviceId: deviceId
      });

      if (response.ok) {
        toast({
          title: "Device Share Removed",
          description: "Device sharing has been cancelled",
        });
        // Refresh available devices and shared devices
        await fetchAvailableDevices(userId);
        await fetchSharedDevices();
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel device sharing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error canceling device share:', error);
      toast({
        title: "Error",
        description: "Failed to cancel device sharing",
        variant: "destructive",
      });
    }
  };

  const confirmRemoveUser = async () => {
    if (userToDelete) {
      try {
        const response = await aromaAPI.deleteSubAccount(userToDelete.id);
        if (response.success) {
        toast({
        title: "User Removed",
        description: `${userToDelete.note || userToDelete.account} has been removed successfully`,
        });
          // Refresh users list
          await fetchUsers();
      } else {
        toast({
            title: "Error",
            description: response.error || "Failed to remove user",
            variant: "destructive",
        });
      }
    } catch (error) {
        console.error("Error removing user:", error);
      toast({
          title: "Error",
          description: "Failed to remove user",
        variant: "destructive",
      });
      }
      setUserToDelete(null);
    }
  };




  const getMappingDetails = (mapping: UserDeviceMapping) => {
    const user = users && users.find(u => u.id === mapping.userId);
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
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[70vw] max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-0">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl">Device to User Mapping</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mx-4 sm:mx-6 mb-4">
            <TabsTrigger value="single" className="text-xs sm:text-sm">Mapping</TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">Manage Users</TabsTrigger>
            <TabsTrigger value="sharing" className="text-xs sm:text-sm">Device Sharing</TabsTrigger>
            <TabsTrigger value="current" className="text-xs sm:text-sm">Current Mappings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 modal-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users && users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.note || (user.account ? user.account.split('@')[0] : '') || 'Unnamed User'} ({user.account || 'No account'})
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
                    {availableDevicesForMapping.map(device => (
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
          
          
          <TabsContent value="users" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 modal-scrollbar">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Add New User</h3>
              <div className="space-y-4">
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
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading users...</span>
                  </div>
                ) : users && users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  users && users.map(user => (
                  <Card key={user.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                          <p className="font-medium">{user.note || (user.account ? user.account.split('@')[0] : '') || 'Unnamed User'}</p>
                          <p className="text-sm text-muted-foreground">{user.account || 'No account'}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {user.status === 1 ? 'Active' : 'Inactive'}
                               </Badge>
                            {user.createDate && (
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(user.createDate).toLocaleDateString('en-GB')}
                              </span>
                            )}
                           </div>
                         </div>
                        <div className="flex items-center gap-2">
                         <Button
                           size="icon"
                           variant="ghost"
                            onClick={() => {
                              setEditingUser(user);
                              setEditUser({
                                role: user.status === 1 ? "Active" : "Inactive",
                                department: user.note || "",
                                locations: [],
                                permissions: []
                              });
                              setEditUserModalOpen(true);
                            }}
                           title="Edit user"
                         >
                           <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                           size="icon"
                           variant="ghost"
                            onClick={() => setUserToDelete(user)}
                           title="Remove user"
                         >
                           <Trash2 className="w-4 h-4 text-destructive" />
                         </Button>
                      </div>
                    </div>
                  </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sharing" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 modal-scrollbar">
            <div className="space-y-4">
              {/* User Selection */}
              <div className="space-y-2">
                <Label>Select User to Share Devices With</Label>
                <Select 
                  value={selectedUserForSharing} 
                  onValueChange={(value) => {
                    console.log(`🔄 User selection changed:`, { value, previousValue: selectedUserForSharing });
                    setSelectedUserForSharing(value);
                    if (value) {
                      console.log(`📞 Calling fetchAvailableDevices with userId: ${value}`);
                      try {
                        fetchAvailableDevices(value);
                        console.log(`✅ fetchAvailableDevices called successfully`);
                      } catch (error) {
                        console.error(`❌ Error calling fetchAvailableDevices:`, error);
                      }
                    } else {
                      console.log(`🧹 Clearing available devices`);
                      setAvailableDevices([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading users...</SelectItem>
                    ) : users && users.length > 0 ? (
                      users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.note || (user.account ? user.account.split('@')[0] : '') || 'Unnamed User'} ({user.account || 'No account'})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-users" disabled>No users available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Rights Selection */}
              <div className="space-y-2">
                <Label>Access Rights</Label>
                <Select 
                  value={selectedRights} 
                  onValueChange={(value: "VIEW" | "CONTROL") => setSelectedRights(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access rights" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">VIEW</SelectItem>
                    <SelectItem value="CONTROL">CONTROL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Available Devices */}
              {selectedUserForSharing && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">Available Devices to Share</h3>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {loadingAvailableDevices ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Loading available devices...</span>
                      </div>
                ) : availableDevices && availableDevices.length === 0 ? (
                  <div className="text-center py-4">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No devices available for sharing</p>
                  </div>
                    ) : (
                      availableDevices && availableDevices.map(device => (
                        <Card key={device.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium text-sm">{device.name}</span>
                                <Badge variant="outline" className="text-xs">{device.sn}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={device.status === 'ONLINE' ? "default" : "secondary"} className="text-xs">
                                  {device.status === 'ONLINE' ? "Online" : "Offline"}
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                  Available
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleShareDevice(device.id, selectedUserForSharing, selectedRights)}
                              disabled={device.status !== 'ONLINE'}
                              className="text-xs"
                            >
                              Share Device ({selectedRights})
                            </Button>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="current" className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 modal-scrollbar">
            {/* Local Mappings Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Local Mappings</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
              {mappings.length === 0 ? (
                  <div className="text-center py-4">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No local mappings yet</p>
                </div>
              ) : (
                mappings.map(mapping => {
                  const { user, device } = getMappingDetails(mapping);
                  return (
                      <Card key={mapping.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                              <span className="font-medium text-sm">{user?.note || user?.account}</span>
                              <span className="text-xs text-muted-foreground">({user?.account})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                              <span className="text-sm">{device?.name}</span>
                              <Badge variant="outline" className="text-xs">{device?.deviceId}</Badge>
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
                            className="h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })
              )}
              </div>
            </div>

            {/* Shared Devices from API Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Shared Devices (API)</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {loadingSharedDevices ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading shared devices...</span>
                  </div>
                ) : sharedDevices.length === 0 ? (
                  <div className="text-center py-4">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No shared devices found</p>
                  </div>
                ) : (
                  sharedDevices.map(sharedDevice => (
                    <Card key={sharedDevice.id} className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="font-medium text-sm">{sharedDevice.name}</span>
                            <Badge variant="outline" className="text-xs">{sharedDevice.deviceSN}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={sharedDevice.rights === 'CONTROL' ? 'default' : 'secondary'} className="text-xs">
                              {sharedDevice.rights}
                            </Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelDeviceShare(sharedDevice.deviceId, sharedDevice.subAccount)}
                              className="text-xs h-6 px-2"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm text-muted-foreground">{sharedDevice.subAccount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Shared on {new Date(sharedDevice.shareDate).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
      
      {/* Edit User Modal */}
      <Dialog open={editUserModalOpen} onOpenChange={setEditUserModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Non-editable user info */}
              <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Account</Label>
                  <p className="font-medium">{editingUser.account}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Note</Label>
                  <p className="text-sm">{editingUser.note || 'No note'}</p>
                </div>
                  <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Customer ID</Label>
                  <p className="text-sm">{editingUser.customerId}</p>
                  </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editUser.role} onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Note</Label>
                  <Input
                    value={editUser.department}
                    onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Enter note"
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
              Are you sure you want to remove {userToDelete?.note || userToDelete?.account}? This action cannot be undone.
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