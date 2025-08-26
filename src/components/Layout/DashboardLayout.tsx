
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/ClerkAuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  FileText, 
  Award, 
  Settings, 
  LogOut,
  FileVideo,
  Tag,
  CreditCard,
  Sparkles,
  GraduationCap,
  UserCog,
  Briefcase,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, profile, isAdmin, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  const handleLogout = async () => {
    try {
      // Clear temporary admin access
      localStorage.removeItem('tempAdmin');
      
      if (user) {
        await logout();
      }
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user && !isTempAdmin) {
    navigate('/login');
    return null;
  }

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Video, label: 'Interview Practice', href: '/interviews' },
    { icon: Sparkles, label: 'Custom Interviews', href: '/custom-interviews' },
    { icon: BookOpen, label: 'Learning Hub', href: '/learning' },
    { icon: Briefcase, label: 'Jobs', href: '/jobs' },
    { icon: FileText, label: 'Interview Resources', href: '/interview-resources' },
    { icon: Award, label: 'Certificates', href: '/certificates' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: UserCog, label: 'User Management', href: '/admin/user-management' },
    { icon: GraduationCap, label: 'Course Management', href: '/admin/courses' },
    { icon: FileText, label: 'Interview Resources', href: '/admin/interview-resources' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: Award, label: 'Certificates', href: '/admin/certificates' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ];

  const navItems = (isAdmin() || isTempAdmin) ? adminNavItems : studentNavItems;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-sidebar to-sidebar-accent/50 border-r border-sidebar-border transform transition-transform duration-300 ease-in-out md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border/50">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground group-hover:text-sidebar-primary transition-colors duration-200">
              MockInvi
            </span>
          </Link>
          
          {/* Mobile Close Button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-sidebar-accent transition-colors duration-200"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>
        
        {/* Sidebar Navigation */}
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "sidebar-item group",
                    isActive && "active bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  )}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-primary"
                  )} />
                  <span className="font-medium">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute right-3 w-2 h-2 bg-sidebar-primary-foreground rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
          
          {/* Sidebar Footer */}
          <div className="mt-auto pt-6 border-t border-sidebar-border/50">
            <button
              onClick={handleLogout}
              className="sidebar-item w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-soft">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            
            {/* Page Title */}
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-foreground">
                {navItems.find(item => item.href === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{profile?.full_name || 'User'}</p>
                  <p className="text-foreground/60 text-xs">{profile?.role || 'Student'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
