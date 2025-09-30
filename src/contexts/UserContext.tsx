import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  location: string;
  role?: string;
  permissions?: string[];
  status?: "active" | "inactive";
  lastActive?: string;
  joinedDate?: string;
  devicesAssigned?: number;
  devicesShared?: number;
}

interface UserContextType {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialUsers: User[] = [
  { 
    id: "1", 
    name: "John Doe", 
    email: "john@example.com", 
    phone: "+1234567890", 
    department: "IT", 
    location: "Location A", 
    role: "Admin", 
    permissions: ["read", "write", "delete"],
    status: "active",
    lastActive: "Online now",
    joinedDate: "2023-01-15",
    devicesAssigned: 45,
    devicesShared: 12
  },
  { 
    id: "2", 
    name: "Jane Smith", 
    email: "jane@example.com", 
    phone: "+0987654321", 
    department: "HR", 
    location: "Location B", 
    role: "Manager", 
    permissions: ["read", "write"],
    status: "active",
    lastActive: "5 min ago",
    joinedDate: "2023-03-20",
    devicesAssigned: 68,
    devicesShared: 8
  },
  { 
    id: "3", 
    name: "Mike Johnson", 
    email: "mike@example.com", 
    phone: "+1122334455", 
    department: "Operations", 
    location: "Location A", 
    role: "User", 
    permissions: ["read"],
    status: "active",
    lastActive: "1 hour ago",
    joinedDate: "2023-06-10",
    devicesAssigned: 23,
    devicesShared: 23
  },
];

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      status: "active",
      lastActive: "Just added",
      joinedDate: new Date().toISOString().split('T')[0],
      devicesAssigned: 0,
      devicesShared: 0,
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...updates } : user
    ));
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  const getUserById = (id: string) => {
    return users.find(user => user.id === id);
  };

  return (
    <UserContext.Provider value={{
      users,
      addUser,
      updateUser,
      removeUser,
      getUserById
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
}