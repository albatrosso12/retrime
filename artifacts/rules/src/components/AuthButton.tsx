import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, User } from "lucide-react";
import { useLocation } from "wouter";
import { getCurrentUser, logout } from "@workspace/api-client-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Check for token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    // Try to get user data using the token
    // We'll use a custom fetch with the token
    fetch(`${import.meta.env.VITE_API_URL || 'https://retrime.korsetov2009.workers.dev'}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setIsAuthenticated(true);
          setUser(data);
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
      });
  }, []);

  const handleLogin = () => {
    // Super simple redirect - no variables, no logic
    window.location.href = "https://retrime.korsetov2009.workers.dev/auth/discord";
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    // Optionally call logout endpoint
    fetch(`${import.meta.env.VITE_API_URL || 'https://retrime.korsetov2009.workers.dev'}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    }).catch(() => {});
  };

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        {user.avatar ? (
          <img 
            src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
            alt="Avatar"
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <User className="w-5 h-5 text-[#9AA0A6]" />
        )}
        <span className="text-sm text-[#E3E3E3] truncate flex-1">{user.username}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="rounded-full text-[#9AA0A6] hover:bg-[#282A2C] hover:text-[#E3E3E3] h-8 w-8"
          aria-label="Выйти"
        >
          <LogOut className="h-4 w-4" />
        </Button>
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
