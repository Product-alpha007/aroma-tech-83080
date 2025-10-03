import { useState, useEffect, useCallback } from "react";
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
  X,
  Loader2
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
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLocations } from "@/contexts/LocationContext";
import { AddLocationModal } from "@/components/AddLocationModal";
import { aromaAPI, SubAccount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ManageUsers() {
  const { locations, addLocation } = useLocations();
  const { toast } = useToast();
  const [users, setUsers] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showManageDevicesDialog, setShowManageDevicesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SubAccount | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    email: "",
    password: ""
  });

  const [editUser, setEditUser] = useState({
    email: "",
    password: "",
    username: ""
  });



  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await aromaAPI.getSubAccounts();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (user.account || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await aromaAPI.createSubAccount({
        account: newUser.email,
        password: newUser.password,
        name: newUser.email,
        permissions: ["read"]
      });

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

        setUsers(prev => [...prev, response.data!]);
    setShowAddUserDialog(false);
    setNewUser({
      email: "",
          password: ""
        });
        toast({
          title: "User Added",
          description: `${newUser.email} has been created and enabled successfully`,
        });
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
    setSelectedUser(user);
    setEditUser({
      email: user.account || "",
      password: "",
      username: user.account ? user.account.split('@')[0] : ""
    });
    setShowEditUserDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    if (!editUser.email || !editUser.username || !editUser.password) {
      toast({
        title: "Missing Information",
        description: "Email, username, and password are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Include email, username, and password as per API specification
      const updateData = {
        email: editUser.email,
        username: editUser.username,
        password: editUser.password
      };
      console.log('🔄 Updating sub account with all fields:', selectedUser.id, updateData);
      
      const response = await aromaAPI.updateSubAccount(selectedUser.id, updateData);

      if (response.success && response.data) {
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? response.data! : user
        ));
    setShowEditUserDialog(false);
    setSelectedUser(null);
        toast({
          title: "User Updated",
          description: "User has been updated successfully",
        });
      } else {
        console.error('❌ Update failed:', response);
        toast({
          title: "Error",
          description: response.error || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = (user: SubAccount) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await aromaAPI.deleteSubAccount(selectedUser.id);
      
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setShowDeleteDialog(false);
      setSelectedUser(null);
        toast({
          title: "User Deleted",
          description: "User has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-border bg-card/50 backdrop-blur-lg sticky top-0 z-40">
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
          </div>
        </Card>

        {/* Users Grid */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search or add a new user.</p>
            </Card>
          ) : (
            filteredUsers.map((user) => (
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
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-semibold text-sm sm:text-lg"
                    )}>
                        {(user.name || (user.account ? user.account.split('@')[0] : '') || 'U').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{user.name || (user.account ? user.account.split('@')[0] : '') || 'Unknown User'}</h3>
                        <Badge variant={user.status === "active" ? "default" : "secondary"} className="w-fit">
                          {user.status || "active"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.account || 'No account'}</span>
                      </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="whitespace-nowrap">{user.createDate ? new Date(user.createDate).toLocaleDateString('en-GB') : 'Unknown date'}</span>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">Account:</span>
                          </div>
                            <span className="font-medium truncate">{user.account || 'N/A'}</span>
                            </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground">Status:</span>
                          </div>
                          <span className="font-medium capitalize">{user.status || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">Created:</span>
                            </div>
                            <span className="font-medium">
                              {user.createDate ? new Date(user.createDate).toLocaleDateString('en-GB') : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">User ID:</span>
                            </div>
                            <span className="font-medium font-mono text-xs break-all">{user.id}</span>
                          </div>
                          </div>
                      <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Droplet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">Type:</span>
                          </div>
                            <span className="font-medium">Sub Account</span>
                      </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Share2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-muted-foreground">Name:</span>
                          </div>
                            <span className="font-medium truncate">{user.name || (user.account ? user.account.split('@')[0] : '') || 'Unknown'}</span>
                          </div>
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
          ))
        )}
        </div>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-scrollbar">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign permissions
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user account information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label htmlFor="edit-email">Email *</Label>
                 <Input
                   id="edit-email"
                   type="email"
                   value={editUser.email}
                   onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                   placeholder="john@company.com"
                 />
              </div>
              <div className="space-y-2">
                 <Label htmlFor="edit-username">Username *</Label>
                <Input
                   id="edit-username"
                   value={editUser.username}
                   onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                   placeholder="john_doe"
                />
              </div>
            </div>
            <div className="space-y-2">
               <Label htmlFor="edit-password">Password *</Label>
               <Input
                 id="edit-password"
                 type="password"
                 value={editUser.password}
                 onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                 placeholder="Enter password"
               />
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