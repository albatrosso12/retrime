import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { getCurrentUser, logout, setBaseUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  // Set base URL for API client
  useEffect(() => {
    setBaseUrl(import.meta.env.VITE_API_URL || 'https://retrime.korsetov2009.workers.dev');
  }, []);

  // Function to validate token and load user data
  const validateToken = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    getCurrentUser()
      .then(data => {
        if (data && data.id) {
          setIsAuthenticated(true);
          setUser(data);
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch((err) => {
        if (err?.status === 401) {
          localStorage.removeItem('auth_token');
        }
        setIsAuthenticated(false);
        setUser(null);
      });
  };

  // Check for token in localStorage on mount
  useEffect(() => {
    validateToken();
  }, []);

  // Listen for token changes (after login/logout)
  useEffect(() => {
    const handleTokenChange = () => {
      validateToken();
    };

    window.addEventListener('auth:token-changed', handleTokenChange);
    return () => {
      window.removeEventListener('auth:token-changed', handleTokenChange);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = 'https://retrime.korsetov2009.workers.dev/auth/discord';
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear();
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('auth:token-changed'));
    // Call logout endpoint
    logout().catch(() => {});
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        {user.avatar ? (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=64`}
            alt="Avatar"
            className="w-8 h-8 rounded-full border-2 border-[#5865F2] hover:border-[#8AB4F8] transition-colors cursor-pointer"
            onClick={handleLogout}
            title="Выйти"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#282A2C] flex items-center justify-center cursor-pointer hover:bg-[#3C4043] transition-colors" onClick={handleLogout} title="Выйти">
            <User className="w-5 h-5 text-[#9AA0A6]" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      className="rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white h-9 px-4 gap-2 mx-3 mb-2"
    >
      <LogIn className="h-4 w-4" />
      Войти через Discord
    </Button>
  );
}
