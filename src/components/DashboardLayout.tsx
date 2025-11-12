import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import NotificationBell from "@/components/NotificationBell";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  icon: ReactNode;
}

const DashboardLayout = ({ children, title, icon }: DashboardLayoutProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {icon}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
