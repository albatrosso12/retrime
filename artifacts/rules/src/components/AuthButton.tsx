import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, User, LogOut } from "lucide-react";
import { getCurrentUser, logout, setBaseUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// Initialize base URL once at module level
const API_URL = import.meta.env.VITE_API_URL || "https://retrime.korsetov2009.workers.dev";
setBaseUrl(API_URL);

export function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const getToken = useCallback(() => {
    const localToken = localStorage.getItem("auth_token");
    if (localToken) return localToken;
    
    const cookieMatch = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    return cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
  }, []);

  const validateToken = useCallback(async () => {
    const token = getToken();
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      if (userData && userData.id) {
        setIsAuthenticated(true);
        setUser(userData);
      } else {
        localStorage.removeItem("auth_token");
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err: any) {
      console.error("Auth validation failed:", err);
      localStorage.removeItem("auth_token");
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  useEffect(() => {
    const handleTokenChange = () => {
      setIsLoading(true);
      validateToken();
    };
    window.addEventListener("auth:token-changed", handleTokenChange);
    return () => window.removeEventListener("auth:token-changed", handleTokenChange);
  }, [validateToken]);

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/discord`;
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);
    setUser(null);
    queryClient.clear();
    window.dispatchEvent(new CustomEvent("auth:token-changed"));
    logout().catch(() => {});
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-8 h-8 rounded-full bg-[#282A2C] flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-[#9AA0A6] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    const avatarHash = user.avatar || "";
    const userId = user.discordId || user.id || "";
    const avatarUrl =
      avatarHash && userId
        ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`
        : "";

    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full bg-[#282A2C] flex items-center justify-center hover:bg-[#3C4043] transition-colors overflow-hidden flex-shrink-0"
            title={user.username}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <User className="w-5 h-5 text-[#9AA0A6]" />
            )}
          </div>
          <span className="text-sm text-[#E3E3E3] truncate max-w-[100px]" title={user.username}>
            {user.username}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-7 w-7 rounded-full text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#3C4043] flex-shrink-0"
          title="Выход"
        >
          <LogOut className="h-3.5 w-3.5" />
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