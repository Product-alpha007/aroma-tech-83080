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
  MapPin
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
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

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  location: string;
  status: "active" | "inactive";
  lastActive: string;
  joinedDate: string;
  devicesAssigned: number;
  devicesShared: number;
  permissions: string[];
}

interface Device {
  id: string;
  name: string;
  deviceId: string;
  location: string;
  assigned: boolean;
}

export default function ManageUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageDevicesDialog, setShowManageDevicesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Sample data
  const [users] = useState<User[]>([
    {
      id: "1",
      name: "John Manager",
      email: "john.manager@company.com",
      phone: "+1 234 567 8901",
      role: "Regional Manager",
      department: "Operations",
      location: "New York Office",
      status: "active",
      lastActive: "Online now",
      joinedDate: "2023-01-15",
      devicesAssigned: 45,
      devicesShared: 12,
      permissions: ["view", "edit", "share", "manage"]
    },
    {
      id: "2",
      name: "Sarah Admin",
      email: "sarah.admin@company.com",
      phone: "+1 234 567 8902",
      role: "Site Administrator",
      department: "Facilities",
      location: "Los Angeles Office",
      status: "active",
      lastActive: "5 min ago",
      joinedDate: "2023-03-20",
      devicesAssigned: 68,
      devicesShared: 8,
      permissions: ["view", "edit", "share"]
    },
    {
      id: "3",
      name: "Mike Tech",
      email: "mike.tech@company.com",
      phone: "+1 234 567 8903",
      role: "Technician",
      department: "Maintenance",
      location: "Chicago Office",
      status: "active",
      lastActive: "1 hour ago",
      joinedDate: "2023-06-10",
      devicesAssigned: 23,
      devicesShared: 23,
      permissions: ["view", "edit"]
    },
    {
      id: "4",
      name: "Lisa Operator",
      email: "lisa.operator@company.com",
      phone: "+1 234 567 8904",
      role: "Operator",
      department: "Operations",
      location: "Houston Office",
      status: "inactive",
      lastActive: "2 days ago",
      joinedDate: "2023-09-05",
      devicesAssigned: 15,
      devicesShared: 15,
      permissions: ["view"]
    }
  ]);

  const [devices] = useState<Device[]>([
    { id: "1", name: "Lobby Diffuser #001", deviceId: "LOB001", location: "Main Lobby", assigned: false },
    { id: "2", name: "Conference Room #002", deviceId: "CON002", location: "Conference Room A", assigned: true },
    { id: "3", name: "Office Diffuser #003", deviceId: "OFF003", location: "Open Office Area", assigned: false },
    { id: "4", name: "Reception #004", deviceId: "REC004", location: "Reception Desk", assigned: true },
    { id: "5", name: "Executive #005", deviceId: "EXE005", location: "Executive Suite", assigned: false },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    location: "",
    permissions: [] as string[]
  });

  const roles = [
    "Regional Manager",
    "Site Administrator",
    "Technician",
    "Operator",
    "Viewer"
  ];

  const permissions = [
    { id: "view", label: "View Devices", description: "Can view device status and data" },
    { id: "edit", label: "Edit Settings", description: "Can modify device settings" },
    { id: "share", label: "Share Access", description: "Can share devices with others" },
    { id: "manage", label: "Manage Users", description: "Can add/remove users" },
    { id: "maintenance", label: "Maintenance", description: "Can perform maintenance tasks" },
    { id: "reports", label: "Reports", description: "Can generate and view reports" }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = () => {
    // Add user logic here
    setShowAddUserDialog(false);
    setNewUser({
      name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      location: "",
      permissions: []
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleManageDevices = (user: User) => {
    setSelectedUser(user);
    setShowManageDevicesDialog(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manage Users</h1>
              <p className="text-muted-foreground">Add, remove and manage user permissions</p>
            </div>
            <Button onClick={() => setShowAddUserDialog(true)} className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
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
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <Badge variant={user.status === "active" ? "success" : "secondary"}>
                          {user.status}
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
                        <div className="flex items-center gap-1 hidden md:flex">
                          <Phone className="w-3 h-3" />
                          {user.phone}
                        </div>
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
                      <DropdownMenuItem onClick={() => handleManageDevices(user)}>
                        <Droplet className="w-4 h-4 mr-2" />
                        Manage Devices
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
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Department:</span>
                          <span className="font-medium">{user.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Location:</span>
                          <span className="font-medium">{user.location}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Joined:</span>
                          <span className="font-medium">{user.joinedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Last Active:</span>
                          <span className="font-medium">{user.lastActive}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Droplet className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Devices:</span>
                          <span className="font-medium">{user.devicesAssigned} assigned</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Shared:</span>
                          <span className="font-medium">{user.devicesShared} devices</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Permissions:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.map(perm => (
                          <Badge key={perm} variant="secondary" className="capitalize">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  placeholder="Operations"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newUser.location}
                  onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                  placeholder="New York Office"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3">
                {permissions.map(perm => (
                  <div key={perm.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={perm.id}
                      checked={newUser.permissions.includes(perm.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewUser({ ...newUser, permissions: [...newUser.permissions, perm.id] });
                        } else {
                          setNewUser({ ...newUser, permissions: newUser.permissions.filter(p => p !== perm.id) });
                        }
                      }}
                    />
                    <div className="space-y-1">
                      <Label htmlFor={perm.id} className="text-sm font-medium">
                        {perm.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
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
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Devices Dialog */}
      <Dialog open={showManageDevicesDialog} onOpenChange={setShowManageDevicesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Devices - {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Assign or remove device access for this user
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {devices.map(device => (
                <div
                  key={device.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    "bg-background/50 hover:bg-card border border-border/50",
                    "transition-colors duration-200"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={device.assigned}
                      onCheckedChange={() => {
                        // Toggle device assignment logic
                      }}
                    />
                    <div>
                      <p className="font-medium text-sm">{device.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {device.deviceId} • {device.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={device.assigned ? "default" : "outline"}>
                    {device.assigned ? "Assigned" : "Not Assigned"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageDevicesDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowManageDevicesDialog(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
              onClick={() => {
                // Delete logic here
                setShowDeleteDialog(false);
              }}
            >
              Remove User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}