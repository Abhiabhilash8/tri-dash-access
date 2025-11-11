import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

const DEMO_USERS = {
  "student1": { password: "password", role: "student" },
  "hod1": { password: "password", role: "hod" },
  "faculty1": { password: "password", role: "faculty" },
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = DEMO_USERS[username as keyof typeof DEMO_USERS];
    
    if (user && user.password === password) {
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("username", username);
      toast.success("Login successful!");
      navigate(`/${user.role}`);
    } else {
      toast.error("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center font-bold">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-2">Demo accounts:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• student1 / password</li>
              <li>• hod1 / password</li>
              <li>• faculty1 / password</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
