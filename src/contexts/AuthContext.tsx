
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

type UserRole = 'student' | 'admin' | null;

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  role: UserRole;
  auth_provider: string;
} | null;

interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: () => boolean;
  isStudent: () => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Check if there's a manual session stored
      const storedSession = localStorage.getItem('manual_session');
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        setSession(sessionData);
        setUser(sessionData.user);
        setProfile(sessionData.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_user', {
        user_email: email,
        user_password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error('Invalid credentials');
      }

      // Type the response properly
      const authResult = data[0] as {
        user_id: string;
        user_data: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          auth_provider: string;
        };
      };

      const userData = authResult.user_data;
      const sessionData = {
        user: userData,
        access_token: 'manual_session_token',
        id: authResult.user_id
      };

      // Store session
      localStorage.setItem('manual_session', JSON.stringify(sessionData));
      
      setSession(sessionData);
      setUser(userData);
      setProfile(userData);
      setIsAuthenticated(true);

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('register_manual_user', {
        user_email: email,
        user_password: password,
        user_full_name: name,
        user_role: role || 'student'
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Registration Successful",
        description: "Account created successfully! Please log in.",
      });

      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('manual_session');
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      
      navigate('/login');
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isStudent = () => profile?.role === 'student';

  return (
    <AuthContext.Provider value={{ 
      user,
      session,
      profile,
      loading, 
      isAuthenticated,
      isAdmin,
      isStudent,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
