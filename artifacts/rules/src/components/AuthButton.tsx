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
    if (!token) { setIsAuthenticated(false); setUser(null); setIsLoading(false); return; }
    try {
      const userData = await getCurrentUser();
      if (userData && userData.id) { setIsAuthenticated(true); setUser(userData); }
      else { localStorage.removeItem("auth_token"); setIsAuthenticated(false); setUser(null); }
    } catch { localStorage.removeItem("auth_token"); setIsAuthenticated(false); setUser(null); }
    finally { setIsLoading(false); }
  }, [getToken]);

  useEffect(() => { validateToken(); }, [validateToken]);
  useEffect(() => { const h = () => { setIsLoading(true); validateToken(); }; window.addEventListener("auth:token-changed", h); return () => window.removeEventListener("auth:token-changed", h); }, [validateToken]);

  const handleLogin = () => { window.location.href = `${API_URL}/auth/discord`; };
  const handleLogout = () => { localStorage.removeItem("auth_token"); setIsAuthenticated(false); setUser(null); queryClient.clear(); window.dispatchEvent(new CustomEvent("auth:token-changed")); logout().catch(() => {}); };

  if (isLoading) return <div className="h-8 w-8 rounded-lg border border-[#DDD8CC] animate-pulse" />;

  if (isAuthenticated && user) {
    const avatarUrl = user.avatar && user.discordId ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=48` : "";
    return (
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border border-[#DDD8CC] bg-[#EAE6DF]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md bg-[#DDD8CC] flex items-center justify-center overflow-hidden">
            {avatarUrl ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <User className="w-4 h-4 text-[#9A9488]" />}
          </div>
          <span className="text-sm text-[#2D2A26] truncate">{user.username}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-7 w-7 text-[#9A9488] hover:text-red-600"><LogOut className="h-3.5 w-3.5" /></Button>
      </div>
    );
  }

  return (
    <Button onClick={handleLogin} className="w-full justify-start bg-[#5865F2] hover:bg-[#4752C4] text-white h-10 rounded-lg gap-2">
      <LogIn className="h-4 w-4" />Войти через Discord
    </Button>
  );
}