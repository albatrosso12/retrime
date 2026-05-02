import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, User } from "lucide-react";
import { getCurrentUser, logout, setBaseUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setBaseUrl(import.meta.env.VITE_API_URL || 'https://retrime.korsetov2009.workers.dev');
  }, []);

  const validateToken = () => {
    const token = localStorage.getItem('auth_token') || (() => {
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        return match ? decodeURIComponent(match[1]) : null;
      })();
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
      .catch(() => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        setUser(null);
      });
  };

  useEffect(() => {
    validateToken();
  }, []);

  useEffect(() => {
    const handleTokenChange = () => validateToken();
    window.addEventListener('auth:token-changed', handleTokenChange);
    return () => window.removeEventListener('auth:token-changed', handleTokenChange);
  }, []);

  const handleLogin = () => {
    window.location.href = 'https://retrime.korsetov2009.workers.dev/auth/discord';
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear();
    window.dispatchEvent(new CustomEvent('auth:token-changed'));
    logout().catch(() => {});
  };

  if (isAuthenticated && user) {
    const avatarHash = user.avatar || '';
    const userId = user.id || user.discordId || '';
    const avatarUrl = avatarHash && userId
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`
      : '';

    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          className="w-8 h-8 rounded-full bg-[#282A2C] flex items-center justify-center cursor-pointer hover:bg-[#3C4043] transition-colors overflow-hidden"
          onClick={handleLogout}
          title={`${user.username || 'User'} - Выход`}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <User className="w-5 h-5 text-[#9AA0A6]" />
          )}
        </div>
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
