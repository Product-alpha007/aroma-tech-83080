import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aromaAPI, LoginRequest, UserProfile } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (aromaAPI.isAuthenticated()) {
        try {
          const response = await aromaAPI.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear it
            aromaAPI.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          aromaAPI.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    console.log(`🔐 AuthContext: Starting login process`, {
      email: credentials.aroma_account,
    });
    setIsLoading(true);
    try {
      const response = await aromaAPI.login(credentials);
      console.log(`📊 AuthContext: Login API response`, {
        success: response.success,
        hasToken: !!response.data?.token,
        token: response.data?.token,
        error: response.error,
        fullResponse: response,
      });
      
      if (response.success && response.data) {
        // Get user profile after successful login
        console.log(`👤 AuthContext: Fetching user profile`);
        const profileResponse = await aromaAPI.getProfile();
        console.log(`📊 AuthContext: Profile API response`, {
          success: profileResponse.success,
          username: profileResponse.data?.username,
          email: profileResponse.data?.email,
          id: profileResponse.data?.id,
          error: profileResponse.error,
          fullProfileResponse: profileResponse,
        });
        
        if (profileResponse.success && profileResponse.data) {
          console.log(`🔄 AuthContext: Setting authentication state`, {
            username: profileResponse.data.username,
            userId: profileResponse.data.id,
          });
          setUser(profileResponse.data);
          setIsAuthenticated(true);
          console.log(`✅ AuthContext: Login successful - state updated`, {
            username: profileResponse.data.username,
            userId: profileResponse.data.id,
            isAuthenticated: true,
          });
          
          // Wait a bit for initial data to start loading before showing success
          console.log(`⏳ AuthContext: Waiting for initial data loading...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${profileResponse.data.username}!`,
          });
          return true;
        } else {
          console.log(`❌ AuthContext: Profile fetch failed after login`, {
            success: profileResponse.success,
            error: profileResponse.error,
            data: profileResponse.data,
          });
        }
      } else {
        console.log(`❌ AuthContext: Login failed`, {
          error: response.error,
        });
        toast({
          title: "Login Failed",
          description: response.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
    
    return false;
  };

  const logout = () => {
    aromaAPI.logout();
    setIsAuthenticated(false);
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const refreshProfile = async () => {
    if (!isAuthenticated) return;
    
    console.log(`🔄 AuthContext: Refreshing user profile`);
    try {
      const response = await aromaAPI.getProfile();
      console.log(`📊 AuthContext: Profile refresh response`, {
        success: response.success,
        username: response.data?.username,
        error: response.error,
      });
      if (response.success && response.data) {
        setUser(response.data);
        console.log(`✅ AuthContext: Profile refreshed successfully`);
      }
    } catch (error) {
      console.error('❌ AuthContext: Profile refresh failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

