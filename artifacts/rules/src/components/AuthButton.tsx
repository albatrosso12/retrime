import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, User, LogOut } from "lucide-react";
import { getCurrentUser, logout, setBaseUrl } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
    } catch {
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
      <div className="flex items-center justify-center py-2">
        <div className="w-8 h-8 rounded-xl border-2 border-[#8AB4F8]/30 border-t-[#8AB4F8] animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    const avatarHash = user.avatar || "";
    const userId = user.discordId || user.id || "";
    const avatarUrl = avatarHash && userId
      ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=64`
      : "";

    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[#151518] border border-[#2D2D30]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8AB4F8]/20 to-[#6B9DFC]/10 border border-[#2D2D30] flex items-center justify-center overflow-hidden flex-shrink-0">
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
              <User className="w-4 h-4 text-[#8AB4F8]" />
            )}
          </div>
          <span className="text-sm font-medium text-white truncate" title={user.username}>
            {user.username}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 rounded-lg text-[#6B7280] hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
          title="Выход"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      className="w-full justify-start rounded-xl bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#677EE4] hover:to-[#5865F2] text-white h-11 px-4 gap-3 font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#5865F2]/25"
    >
      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
        <LogIn className="h-4 w-4" />
      </div>
      Войти через Discord
    </Button>
  );
}