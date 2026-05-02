import { useLocation } from "wouter";
import { Menu, Plus, Settings, MessageSquare, Trash2, Home as HomeIcon, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useChats } from "@/hooks/useChats";
import { AuthButton } from "@/components/AuthButton";

type Props = { expanded: boolean; setExpanded: (v: boolean) => void; onOpenSettings: () => void; isMobileMenuOpen: boolean; setIsMobileMenuOpen: (v: boolean) => void; };

export function Sidebar({ expanded, setExpanded, onOpenSettings, isMobileMenuOpen, setIsMobileMenuOpen }: Props) {
  const [location, navigate] = useLocation();
  const { chats, createChat, deleteChat } = useChats();
  const goToChat = (id: string) => { navigate(`/chat/${id}`); setIsMobileMenuOpen(false); };
  const goHome = () => { navigate("/"); setIsMobileMenuOpen(false); };
  const handleCreate = () => { const next = createChat(); setExpanded(true); goToChat(next.id); };
  const activeChatId = location.startsWith("/chat/") ? location.slice("/chat/".length) : null;

  const Panel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-[#F5F3EF] w-[280px] p-3 text-[#2D2A26] border-r border-[#E8E4DD]">
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="font-medium">Меню</span>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[#9A9488] hover:text-[#2D2A26]"><Menu className="h-4 w-4" /></Button>
      </div>
      <Button variant="ghost" onClick={handleCreate} className="mb-4 justify-start bg-[#EAE6DF] border border-[#DDD8CC] hover:border-[#E67E22] rounded-lg h-10 gap-2 text-[#2D2A26]">
        <Plus className="h-4 w-4" />Новое обращение
      </Button>
      <button onClick={goHome} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 ${location === "/" ? "bg-[#EAE6DF] text-[#E67E22]" : "text-[#5C5650] hover:bg-[#EAE6DF]"}`}>
        <HomeIcon className="h-4 w-4" />Свод правил
      </button>
      <div className="flex-1 overflow-y-auto">
        <p className="px-3 text-xs text-[#9A9488] mb-2 mt-3">Обращения</p>
        {chats.length === 0 ? <p className="px-3 text-xs text-[#9A9488]">Нет обращений</p> : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div key={chat.id} className={`group flex items-center rounded-lg ${activeChatId === chat.id ? "bg-[#EAE6DF]" : "hover:bg-[#EAE6DF]"}`}>
                <button onClick={() => goToChat(chat.id)} className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-[#4A4540] truncate">
                  <MessageSquare className="h-3 w-3 text-[#9A9488]" /><span className="truncate">{chat.title}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-[#9A9488] hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pt-3 border-t border-[#E8E4DD] space-y-1">
        <Button variant="ghost" onClick={() => navigate("/review")} className={`w-full justify-start h-10 gap-2 ${location === "/review" ? "bg-[#EAE6DF] text-[#E67E22]" : "text-[#5C5650]"}`}><Scale className="h-4 w-4" />Рассмотрение</Button>
        <Button variant="ghost" onClick={onOpenSettings} className="w-full justify-start h-10 gap-2 text-[#5C5650]"><Settings className="h-4 w-4" />Настройки</Button>
      </div>
      <div className="pt-3"><AuthButton /></div>
    </div>
  );

  return (
    <>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 border-none bg-[#F5F3EF]">
          <SheetTitle className="sr-only">Меню</SheetTitle>
          <Panel onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <aside className={`hidden md:flex shrink-0 h-screen sticky top-0 z-40 bg-[#F5F3EF] border-r border-[#E8E4DD] ${expanded ? "w-[280px]" : "w-[64px]"}`}>
        {expanded ? (<Panel onClose={() => setExpanded(false)} />) : (
          <div className="flex flex-col w-[64px] h-full py-4 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setExpanded(true)} className="h-10 w-10 text-[#9A9488] hover:text-[#2D2A26]"><Menu className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={handleCreate} className="h-10 w-10 bg-[#EAE6DF] text-[#E67E22]"><Plus className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={goHome} className={`h-10 w-10 ${location === "/" ? "text-[#E67E22]" : "text-[#9A9488] hover:text-[#2D2A26]"}`}><HomeIcon className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/review")} className={`h-10 w-10 ${location === "/review" ? "text-[#E67E22]" : "text-[#9A9488] hover:text-[#2D2A26]"}`}><Scale className="h-5 w-5" /></Button>
            <div className="mt-auto"><Button variant="ghost" size="icon" onClick={onOpenSettings} className="h-10 w-10 text-[#9A9488] hover:text-[#2D2A26]"><Settings className="h-5 w-5" /></Button></div>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (<div className="md:hidden"><Button variant="ghost" size="icon" onClick={onClick} className="text-[#5C5650]"><Menu className="h-5 w-5" /></Button></div>);
}