import { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus,
  Trash2,
  Edit,
  Shield,
  Droplet,
  Share2,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  ChevronDown,
  MapPin,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useUsers } from "@/contexts/UserContext";
import { useLocations } from "@/contexts/LocationContext";
import { AddLocationModal } from "@/components/AddLocationModal";

export default function ManageUsers() {
  const { users, addUser, updateUser, removeUser } = useUsers();
  const { locations, addLocation } = useLocations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageDevicesDialog, setShowManageDevicesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    locations: [] as string[],
    permissions: [] as string[]
  });

  const [editUser, setEditUser] = useState({
    role: "",
    department: "",
    locations: [] as string[],
    permissions: [] as string[]
  });

  const roles = [
    "Admin",
    "Manager", 
    "User",
    "Viewer"
  ];

  const permissions = [
    { id: "read", label: "View Devices", description: "Can view device status and data" },
    { id: "write", label: "Edit Settings", description: "Can modify device settings" },
    { id: "delete", label: "Delete Access", description: "Can delete devices and data" },
    { id: "admin", label: "Admin Access", description: "Full administrative privileges" }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || newUser.locations.length === 0) return;
    
    addUser(newUser);
    setShowAddUserDialog(false);
    setNewUser({
      name: "",
      email: "",
      role: "",
      department: "",
      locations: [],
      permissions: []
    });
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditUser({
      role: user.role || "",
      department: user.department || "",
      locations: user.locations || [],
      permissions: user.permissions || []
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateUser(selectedUser.id, editUser);
    setShowEditUserDialog(false);
    setSelectedUser(null);
    setEditUser({
      role: "",
      department: "",
      locations: [],
      permissions: []
    });
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      removeUser(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Manage Users</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Add, remove and manage user permissions</p>
            </div>
            <Button onClick={() => setShowAddUserDialog(true)} className="gap-2 w-full sm:w-auto">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters */}
        <Card className="mb-6 p-4 bg-gradient-card border-border/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Users Grid */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={cn(
                "border-border/50 bg-gradient-card backdrop-blur-sm",
                "hover:border-primary/30 hover:shadow-glow",
                "transition-all duration-300 animate-fade-in"
              )}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-semibold text-lg"
                    )}>
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status || "active"}
                        </Badge>
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1 hidden md:flex">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Expandable Details */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 -ml-1"
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                >
                  <ChevronDown className={cn(
                    "w-4 h-4 mr-1 transition-transform",
                    expandedUser === user.id && "rotate-180"
                  )} />
                  {expandedUser === user.id ? "Hide" : "Show"} Details
                </Button>

                {expandedUser === user.id && (
                  <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        {user.department && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Department:</span>
                            <span className="font-medium">{user.department}</span>
                          </div>
                        )}
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <div>
                            <span className="text-muted-foreground">Locations:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.locations?.map((loc: string) => (
                                <Badge key={loc} variant="outline" className="text-xs">
                                  {loc}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {user.joinedDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Joined:</span>
                            <span className="font-medium">{user.joinedDate}</span>
                          </div>
                        )}
                        {user.lastActive && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last Active:</span>
                            <span className="font-medium">{user.lastActive}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {user.devicesAssigned !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Droplet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Devices:</span>
                            <span className="font-medium">{user.devicesAssigned} assigned</span>
                          </div>
                        )}
                        {user.devicesShared !== undefined && (
                          <div className="flex items-center gap-2 text-sm">
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Shared:</span>
                            <span className="font-medium">{user.devicesShared} devices</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {user.permissions && user.permissions.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Permissions:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {user.permissions.map((perm: string) => (
                            <Badge key={perm} variant="secondary" className="capitalize">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Locations (Select multiple)</Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (!newUser.locations.includes(value)) {
                        setNewUser({ ...newUser, locations: [...newUser.locations, value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(loc => !newUser.locations.includes(loc)).map((location) => (
                        <SelectItem key={location} value={location}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {location}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newUser.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
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
                            onClick={() => setNewUser({ 
                              ...newUser, 
                              locations: newUser.locations.filter(l => l !== loc) 
                            })}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <AddLocationModal 
                  onAddLocation={addLocation} 
                  trigger={
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  } 
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={permission.id}
                      checked={newUser.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewUser({
                            ...newUser,
                            permissions: [...newUser.permissions, permission.id]
                          });
                        } else {
                          setNewUser({
                            ...newUser,
                            permissions: newUser.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user role, department, locations, and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Non-editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <p className="font-medium">{selectedUser?.name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{selectedUser?.email}</p>
              </div>
              {selectedUser?.phone && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
              )}
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editUser.role}
                  onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Input
                  id="edit-department"
                  value={editUser.department}
                  onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
                  placeholder="Engineering"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Locations (Select multiple)</Label>
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (!editUser.locations.includes(value)) {
                        setEditUser({ ...editUser, locations: [...editUser.locations, value] });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Add location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(loc => !editUser.locations.includes(loc)).map((location) => (
                        <SelectItem key={location} value={location}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {location}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editUser.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/50">
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
                            onClick={() => setEditUser({ 
                              ...editUser, 
                              locations: editUser.locations.filter(l => l !== loc) 
                            })}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <AddLocationModal 
                  onAddLocation={addLocation} 
                  trigger={
                    <Button type="button" variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  } 
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-4">
                {permissions.map(permission => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={editUser.permissions.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditUser({
                            ...editUser,
                            permissions: [...editUser.permissions, permission.id]
                          });
                        } else {
                          setEditUser({
                            ...editUser,
                            permissions: editUser.permissions.filter(p => p !== permission.id)
                          });
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`edit-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteUser}
            >
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}