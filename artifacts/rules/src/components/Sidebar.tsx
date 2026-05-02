import { useLocation } from "wouter";
import { Menu, Plus, Settings, MessageSquare, Trash2, Home as HomeIcon, Scale, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useChats } from "@/hooks/useChats";
import { AuthButton } from "@/components/AuthButton";

type Props = {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  onOpenSettings: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
};

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");

function withBase(path: string): string {
  return `${baseUrl}${path}`;
}

export function Sidebar({
  expanded,
  setExpanded,
  onOpenSettings,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: Props) {
  const [location, navigate] = useLocation();
  const { chats, createChat, deleteChat } = useChats();

  const goToChat = (id: string) => {
    navigate(`/chat/${id}`);
    setIsMobileMenuOpen(false);
  };

  const goHome = () => {
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleCreate = () => {
    const next = createChat();
    setExpanded(true);
    goToChat(next.id);
  };

  const activeChatId = location.startsWith("/chat/")
    ? location.slice("/chat/".length)
    : null;

  const Panel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-[#0D0D0F] w-[300px] p-3 text-[#E8EAED] border-r border-[#1F1F23]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8AB4F8] to-[#5B8DEE] flex items-center justify-center">
            <Gavel className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">Меню</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1A1A1D] h-8 w-8"
          aria-label="Свернуть меню"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-5">
        <Button
          variant="ghost"
          onClick={handleCreate}
          className="w-full justify-start rounded-xl bg-gradient-to-r from-[#8AB4F8]/10 to-[#6B9DFC]/5 text-white hover:from-[#8AB4F8]/20 hover:to-[#6B9DFC]/10 border border-[#8AB4F8]/20 hover:border-[#8AB4F8]/40 h-11 px-4 gap-3 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8AB4F8] to-[#6B9DFC] flex items-center justify-center">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span className="font-medium">Новое обращение</span>
        </Button>
      </div>

      <button
        onClick={goHome}
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium mb-3 mx-1 transition-all duration-200 ${
          location === "/"
            ? "bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/20"
            : "text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white"
        }`}
      >
        <HomeIcon className="h-4 w-4" />
        Свод правил
      </button>

      <div className="flex-1 overflow-y-auto">
        <p className="px-4 text-xs font-medium text-[#4B5563] mb-3 mt-4 uppercase tracking-wider">
          Обращения
        </p>
        {chats.length === 0 ? (
          <p className="px-4 py-4 text-sm text-[#4B5563]">
            Пока нет обращений. Нажмите «+», чтобы создать первое.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 px-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center rounded-xl transition-all duration-200 ${
                  activeChatId === chat.id 
                    ? "bg-[#8AB4F8]/10 border border-[#8AB4F8]/20" 
                    : "hover:bg-[#1A1A1D] border border-transparent"
                }`}
              >
                <button
                  onClick={() => goToChat(chat.id)}
                  className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#D1D5DB] truncate text-left hover:text-white transition-colors"
                >
                  <MessageSquare className={`h-4 w-4 shrink-0 ${activeChatId === chat.id ? "text-[#8AB4F8]" : "text-[#4B5563]"}`} />
                  <span className="truncate">{chat.title}</span>
                  {chat.status === "sent" && (
                    <span className="ml-auto text-[10px] text-[#8AB4F8] uppercase tracking-wide bg-[#8AB4F8]/10 px-2 py-0.5 rounded">
                      отправлено
                    </span>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                    if (activeChatId === chat.id) navigate("/");
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-all p-2 mr-1 text-[#4B5563] hover:text-red-400"
                  aria-label="Удалить обращение"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 px-2 border-t border-[#1F1F23] space-y-1.5">
        <Button
          variant="ghost"
          onClick={() => navigate("/review")}
          className={`w-full justify-start rounded-xl text-sm font-medium h-11 px-4 gap-3 transition-all duration-200 ${
            location === "/review"
              ? "bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/20"
              : "text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white"
          }`}
        >
          <Scale className={`h-4 w-4 ${location === "/review" ? "text-[#8AB4F8]" : "text-[#6B7280]"}`} />
          Рассмотрение жалоб
        </Button>
        <Button
          variant="ghost"
          onClick={onOpenSettings}
          className="w-full justify-start rounded-xl text-sm font-medium text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white h-11 px-4 gap-3 transition-all duration-200"
        >
          <Settings className="h-4 w-4 text-[#6B7280]" />
          Настройки
        </Button>
      </div>
      <div className="px-2 pb-2 mt-4">
        <AuthButton />
      </div>
    </div>
  );

  return (
    <>
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] p-0 border-none bg-transparent">
          <SheetTitle className="sr-only">Меню навигации</SheetTitle>
          <Panel onClose={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      <aside
        className={`hidden md:flex shrink-0 h-screen sticky top-0 z-40 transition-[width] duration-300 ease-out bg-[#0D0D0F] border-r border-[#1F1F23] ${
          expanded ? "w-[300px]" : "w-[72px]"
        }`}
      >
        {expanded ? (
          <Panel onClose={() => setExpanded(false)} />
        ) : (
          <div className="flex flex-col w-[72px] h-full py-4 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(true)}
              className="rounded-xl text-[#6B7280] hover:text-white hover:bg-[#1A1A1D] h-11 w-11"
              aria-label="Раскрыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="w-10 h-px bg-[#1F1F23]" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleCreate}
              className="rounded-xl bg-gradient-to-br from-[#8AB4F8]/20 to-[#6B9DFC]/10 text-[#8AB4F8] hover:from-[#8AB4F8]/30 hover:to-[#6B9DFC]/20 border border-[#8AB4F8]/30 h-11 w-11"
              aria-label="Новое обращение"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={goHome}
              className={`rounded-xl h-11 w-11 ${
                location === "/"
                  ? "bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/30"
                  : "text-[#6B7280] hover:text-white hover:bg-[#1A1A1D]"
              }`}
              aria-label="Свод правил"
              title="Свод правил"
            >
              <HomeIcon className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/review")}
              className={`rounded-xl h-11 w-11 ${
                location === "/review"
                  ? "bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/30"
                  : "text-[#6B7280] hover:text-white hover:bg-[#1A1A1D]"
              }`}
              aria-label="Рассмотрение жалоб"
              title="Рассмотрение жалоб"
            >
              <Scale className="h-5 w-5" />
            </Button>

            <div className="mt-2 flex flex-col gap-1.5 w-full px-2 overflow-y-auto no-scrollbar">
              {chats.slice(0, 5).map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => goToChat(chat.id)}
                  className={`rounded-xl w-11 h-11 mx-auto ${
                    activeChatId === chat.id
                      ? "bg-[#8AB4F8]/10 text-[#8AB4F8] border border-[#8AB4F8]/30"
                      : "text-[#6B7280] hover:text-white hover:bg-[#1A1A1D]"
                  }`}
                  aria-label={chat.title}
                  title={chat.title}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="mt-auto pt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSettings}
                className="rounded-xl text-[#6B7280] hover:text-white hover:bg-[#1A1A1D] h-11 w-11"
                aria-label="Настройки"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileMenuTrigger({ onClick }: { onClick: () => void }) {
  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="rounded-xl text-[#6B7280] hover:text-white hover:bg-[#1A1A1D]"
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
}

export { withBase };