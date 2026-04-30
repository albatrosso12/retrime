import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ruleSections, ranks } from "../data/rules";
import {
  Menu,
  Settings,
  MessageSquare,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Chat = {
  id: string;
  title: string;
  createdAt: number;
};

const CHATS_STORAGE_KEY = "balkan-rules:chats";
const SETTINGS_STORAGE_KEY = "balkan-rules:settings";

type Settings = {
  reduceMotion: boolean;
  compactMode: boolean;
  notifications: boolean;
};

const defaultSettings: Settings = {
  reduceMotion: false,
  compactMode: false,
  notifications: true,
};

const factions = [
  "Гражданские",
  "Сербская Армия",
  "НАТО / Канадцы",
  "Армия РФ"
];

const documents = [
  {
    title: "ШАБЛОН РАПОРТА",
    content: `КОМУ: Командиру подразделения
ОТ КОГО: [Звание] [Фамилия]
ДАТА: ДД.ММ.ГГГГ

СОДЕРЖАНИЕ:
Докладываю о происшествии во время патруля квадрата D4. В 14:00 был обнаружен...

ПОДПИСЬ: _______`
  },
  {
    title: "ШАБЛОН ПРИКАЗА",
    content: `ПРИКАЗ № ___
ОТ: [Должность, Звание]
ДАТА: ДД.ММ.ГГГГ

СОДЕРЖАНИЕ:
1. Выдвинуться в квадрат B2 для зачистки.
2. Организовать блокпост на перекрестке.
3. Открывать огонь на поражение при сопротивлении.

ПОДПИСЬ: _______`
  },
  {
    title: "ПРОТОКОЛ ЗАДЕРЖАНИЯ",
    content: `ПРОТОКОЛ № ___
ОТ КОГО: Патрульный [Звание]
ДАТА: ДД.ММ.ГГГГ
ЗАДЕРЖАННЫЙ: [Имя Фамилия или Описание]

ПРИЧИНА ЗАДЕРЖАНИЯ:
Нарушение комендантского часа, ношение оружия.
ИЗЪЯТОЕ ИМУЩЕСТВО:
- Пистолет ПМ
- Радиостанция

ПОДПИСЬ: _______`
  }
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("general");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHATS_STORAGE_KEY);
      if (raw) setChats(JSON.parse(raw));
      const sRaw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (sRaw) setSettings({ ...defaultSettings, ...JSON.parse(sRaw) });
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
    } catch {
      // ignore
    }
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  const createChat = () => {
    const next: Chat = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: `Обращение №${chats.length + 1}`,
      createdAt: Date.now(),
    };
    setChats((prev) => [next, ...prev]);
    setActiveChatId(next.id);
    setSidebarExpanded(true);
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    setActiveChatId((prev) => (prev === id ? null : prev));
  };

  const updateNavScrollState = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    updateNavScrollState();
    const el = navRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateNavScrollState, { passive: true });
    window.addEventListener("resize", updateNavScrollState);
    return () => {
      el.removeEventListener("scroll", updateNavScrollState);
      window.removeEventListener("resize", updateNavScrollState);
    };
  }, [updateNavScrollState]);

  useEffect(() => {
    const t = window.setTimeout(updateNavScrollState, 320);
    return () => window.clearTimeout(t);
  }, [sidebarExpanded, updateNavScrollState]);

  const scrollNavBy = (direction: "left" | "right") => {
    const el = navRef.current;
    if (!el) return;
    const amount = Math.max(240, el.clientWidth * 0.7);
    el.scrollTo({
      left: el.scrollLeft + (direction === "left" ? -amount : amount),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);

            if (navRef.current) {
              const container = navRef.current;
              const activeBtn = container.querySelector<HTMLElement>(
                `[data-section="${entry.target.id}"]`
              );
              if (activeBtn) {
                const target =
                  activeBtn.offsetLeft -
                  container.clientWidth / 2 +
                  activeBtn.clientWidth / 2;
                container.scrollTo({ left: target, behavior: "smooth" });
              }
            }
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const SidebarPanel = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-[#1E1F20] w-[280px] p-3 text-[#E3E3E3]">
      <div className="flex items-center justify-between mb-2 px-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3] h-10 w-10"
          aria-label="Свернуть меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-4 px-1">
        <Button
          variant="ghost"
          onClick={createChat}
          className="rounded-full bg-[#282A2C] text-[#E3E3E3] hover:bg-[#444746] hover:text-[#E3E3E3] h-11 px-4 gap-2"
        >
          <Plus className="h-5 w-5" />
          Новое обращение
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        <p className="px-3 text-xs font-medium text-[#9AA0A6] mb-2 mt-2">
          Обращения
        </p>
        {chats.length === 0 ? (
          <p className="px-3 py-4 text-sm text-[#9AA0A6]">
            Пока нет обращений. Нажмите «+», чтобы создать первое.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center rounded-full transition-colors ${
                  activeChatId === chat.id
                    ? "bg-[#282A2C]"
                    : "hover:bg-[#282A2C]"
                }`}
              >
                <button
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 flex items-center gap-3 px-3 py-2 text-sm font-normal text-[#E3E3E3] truncate text-left"
                >
                  <MessageSquare className="h-4 w-4 shrink-0 text-[#9AA0A6]" />
                  <span className="truncate">{chat.title}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 mr-1 text-[#9AA0A6] hover:text-[#E3E3E3]"
                  aria-label="Удалить обращение"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 px-1 border-t border-[#282A2C]">
        <Button
          variant="ghost"
          onClick={() => setSettingsOpen(true)}
          className="w-full justify-start rounded-full text-sm font-normal text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3] h-11 px-3 gap-3"
        >
          <Settings className="h-5 w-5 text-[#9AA0A6]" />
          Настройки
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#131314] text-[#E3E3E3] flex font-sans selection:bg-[#8AB4F8] selection:text-[#131314]">
      
      {/* Desktop Sidebar — slim by default, expands on hamburger click */}
      <aside
        className={`hidden md:flex shrink-0 h-screen sticky top-0 z-40 transition-[width] duration-300 ease-out ${
          sidebarExpanded ? "w-[280px]" : "w-[68px]"
        }`}
      >
        {sidebarExpanded ? (
          <SidebarPanel onClose={() => setSidebarExpanded(false)} />
        ) : (
          <div className="flex flex-col w-[68px] h-full bg-[#131314] py-4 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarExpanded(true)}
              className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3] h-10 w-10"
              aria-label="Раскрыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={createChat}
              className="rounded-full bg-[#282A2C] text-[#E3E3E3] hover:bg-[#444746] hover:text-[#E3E3E3] h-10 w-10 mt-2"
              aria-label="Новое обращение"
            >
              <Plus className="h-5 w-5" />
            </Button>

            <div className="mt-2 flex flex-col gap-1 w-full px-2 overflow-y-auto no-scrollbar">
              {chats.slice(0, 6).map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setSidebarExpanded(true);
                  }}
                  className={`rounded-full w-10 h-10 mx-auto ${
                    activeChatId === chat.id
                      ? "bg-[#282A2C] text-[#8AB4F8]"
                      : "text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3]"
                  }`}
                  aria-label={chat.title}
                  title={chat.title}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              ))}
            </div>

            <div className="mt-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3] h-10 w-10"
                aria-label="Настройки"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#131314]">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#131314]/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 border-none bg-transparent">
                  <SheetTitle className="sr-only">Меню навигации</SheetTitle>
                  <SidebarPanel onClose={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>
            
            <span className="text-[#E3E3E3] text-xl font-medium tracking-tight flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
              Балканский Конфликт
            </span>
          </div>
          
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[880px] mx-auto px-4 md:px-8 py-8 md:py-12 pb-24 flex flex-col gap-12">
            
            {/* Hero Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col gap-6 pt-4 pb-8"
            >
              <h1 className="text-4xl md:text-5xl font-normal text-[#9AA0A6] tracking-tight">
                Добро пожаловать
              </h1>
              <h2 className="text-5xl md:text-6xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#8AB4F8] to-[#D7E3FC] tracking-tight">
                Свод правил сервера
              </h2>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {factions.map(faction => (
                  <div key={faction} className="px-4 py-2 rounded-full bg-[#1E1F20] text-[#E3E3E3] text-sm font-medium border border-[#444746] select-none">
                    {faction}
                  </div>
                ))}
              </div>

            </motion.div>

            {/* Horizontal Navigation row with arrow controls */}
            <div className="sticky top-20 z-20 py-2 bg-[#131314]/90 backdrop-blur -mx-4 px-4 md:mx-0 md:px-0">
              <div className="relative">
                {/* Left arrow */}
                <AnimatePresence>
                  {canScrollLeft && (
                    <motion.button
                      key="left-arrow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => scrollNavBy("left")}
                      aria-label="Прокрутить влево"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-[#282A2C] hover:bg-[#444746] text-[#E3E3E3] shadow-md"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Left fade */}
                <div
                  className={`pointer-events-none absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-[#131314] to-transparent transition-opacity duration-200 ${
                    canScrollLeft ? "opacity-100" : "opacity-0"
                  }`}
                />

                <div
                  ref={navRef}
                  onWheel={(e) => {
                    if (e.deltaY === 0) return;
                    const el = e.currentTarget;
                    const max = el.scrollWidth - el.clientWidth;
                    if (max <= 0) return;
                    if (
                      (e.deltaY > 0 && el.scrollLeft < max) ||
                      (e.deltaY < 0 && el.scrollLeft > 0)
                    ) {
                      e.preventDefault();
                      el.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-12 scroll-smooth"
                >
                 {ruleSections.map((section) => (
                   <button
                     key={section.id}
                     data-section={section.id}
                     onClick={() => scrollTo(section.id)}
                     className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                       activeSection === section.id 
                         ? 'bg-[#8AB4F8]/10 text-[#8AB4F8]' 
                         : 'bg-[#1E1F20] text-[#E3E3E3] hover:bg-[#282A2C]'
                     }`}
                   >
                     {section.title}
                   </button>
                 ))}
                 <button
                   data-section="ranks"
                   onClick={() => scrollTo("ranks")}
                   className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                     activeSection === "ranks" 
                       ? 'bg-[#8AB4F8]/10 text-[#8AB4F8]' 
                       : 'bg-[#1E1F20] text-[#E3E3E3] hover:bg-[#282A2C]'
                   }`}
                 >
                   Звания
                 </button>
                 <button
                   data-section="documents"
                   onClick={() => scrollTo("documents")}
                   className={`shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                     activeSection === "documents" 
                       ? 'bg-[#8AB4F8]/10 text-[#8AB4F8]' 
                       : 'bg-[#1E1F20] text-[#E3E3E3] hover:bg-[#282A2C]'
                   }`}
                 >
                   Документы
                 </button>
                </div>

                {/* Right fade */}
                <div
                  className={`pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[#131314] to-transparent transition-opacity duration-200 ${
                    canScrollRight ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Right arrow */}
                <AnimatePresence>
                  {canScrollRight && (
                    <motion.button
                      key="right-arrow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => scrollNavBy("right")}
                      aria-label="Прокрутить вправо"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-[#282A2C] hover:bg-[#444746] text-[#E3E3E3] shadow-md"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rules Sections */}
            <div className="flex flex-col gap-10">
              {ruleSections.map((section, index) => {
                const num = String(index + 1).padStart(2, "0");
                return (
                  <motion.section 
                    key={section.id} 
                    id={section.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="scroll-mt-36"
                  >
                    <div className="bg-[#1E1F20] rounded-3xl p-6 md:p-10 shadow-sm border border-[#282A2C]">
                      <div className="mb-8">
                        <span className="text-sm font-medium text-[#8AB4F8] mb-2 block">Раздел {num}</span>
                        <h2 className="text-2xl md:text-3xl font-medium text-[#E3E3E3] mb-2">{section.title}</h2>
                        <p className="text-base text-[#9AA0A6]">{section.subtitle}</p>
                      </div>

                      <div className="flex flex-col gap-5">
                        {section.rules.map((rule, ruleIdx) => (
                          <motion.div 
                            key={ruleIdx} 
                            variants={itemVariants}
                            className="flex gap-4 text-[15px] text-[#E3E3E3] leading-relaxed"
                          >
                            <span className="text-[#9AA0A6] font-medium mt-0.5 shrink-0 w-6">
                              {ruleIdx + 1}.
                            </span>
                            <div>{rule}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.section>
                );
              })}

              {/* Ranks Section */}
              <motion.section
                id="ranks"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="scroll-mt-36"
              >
                <div className="bg-[#1E1F20] rounded-3xl p-6 md:p-10 shadow-sm border border-[#282A2C]">
                  <div className="mb-8">
                     <span className="text-sm font-medium text-[#8AB4F8] mb-2 block">Раздел {String(ruleSections.length + 1).padStart(2, "0")}</span>
                     <h2 className="text-2xl md:text-3xl font-medium text-[#E3E3E3] mb-2">Звания всех фракций</h2>
                     <p className="text-base text-[#9AA0A6]">Иерархия вооруженных сил и гражданских групп.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ranks.map((faction, idx) => (
                      <motion.div key={idx} variants={itemVariants} className="bg-[#282A2C] rounded-2xl p-6">
                        <h3 className="text-lg font-medium text-[#E3E3E3] mb-4 pb-3 border-b border-[#444746]">
                          {faction.faction}
                        </h3>
                        <div className="flex flex-col">
                          {faction.list.map((rank, rankIdx) => (
                            <div 
                              key={rankIdx} 
                              className="py-2 border-b border-[#444746]/50 last:border-0 text-[15px] flex items-center justify-between text-[#E3E3E3]"
                            >
                              <span>{rank}</span>
                              <span className="text-xs text-[#9AA0A6] font-mono">{faction.list.length - rankIdx}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>

              {/* Documents Section */}
              <motion.section
                id="documents"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="scroll-mt-36"
              >
                <div className="bg-[#1E1F20] rounded-3xl p-6 md:p-10 shadow-sm border border-[#282A2C]">
                  <div className="mb-8">
                     <span className="text-sm font-medium text-[#8AB4F8] mb-2 block">Раздел {String(ruleSections.length + 2).padStart(2, "0")}</span>
                     <h2 className="text-2xl md:text-3xl font-medium text-[#E3E3E3] mb-2">Формат документов</h2>
                     <p className="text-base text-[#9AA0A6]">Стандартизированные бланки делопроизводства.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {documents.map((doc, idx) => (
                      <motion.div 
                        key={idx} 
                        variants={itemVariants}
                        className="bg-[#282A2C] rounded-2xl overflow-hidden"
                      >
                        <div className="px-6 py-4 border-b border-[#444746]">
                          <h3 className="text-lg font-medium text-[#E3E3E3]">
                            {doc.title}
                          </h3>
                        </div>
                        <div className="p-6 bg-[#131314]/50">
                          <pre className="font-mono text-sm whitespace-pre-wrap text-[#9AA0A6] leading-relaxed">
                            {doc.content}
                          </pre>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>

            </div>
          </div>

          {/* Footer */}
          <footer className="w-full py-8 text-center text-sm text-[#9AA0A6]">
            Балканский Конфликт · v1.0 · 2026
          </footer>
        </main>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#1E1F20] border-[#282A2C] text-[#E3E3E3] sm:max-w-[440px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium">Настройки</DialogTitle>
            <DialogDescription className="text-[#9AA0A6]">
              Внешний вид и поведение интерфейса.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-[#282A2C] transition-colors">
              <div className="flex flex-col">
                <Label htmlFor="reduce-motion" className="text-sm font-medium text-[#E3E3E3]">
                  Уменьшить анимации
                </Label>
                <span className="text-xs text-[#9AA0A6]">
                  Отключить плавные переходы и эффекты появления
                </span>
              </div>
              <Switch
                id="reduce-motion"
                checked={settings.reduceMotion}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, reduceMotion: v }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-[#282A2C] transition-colors">
              <div className="flex flex-col">
                <Label htmlFor="compact" className="text-sm font-medium text-[#E3E3E3]">
                  Компактный режим
                </Label>
                <span className="text-xs text-[#9AA0A6]">
                  Уплотнить отступы и текст
                </span>
              </div>
              <Switch
                id="compact"
                checked={settings.compactMode}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, compactMode: v }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 hover:bg-[#282A2C] transition-colors">
              <div className="flex flex-col">
                <Label htmlFor="notifications" className="text-sm font-medium text-[#E3E3E3]">
                  Уведомления
                </Label>
                <span className="text-xs text-[#9AA0A6]">
                  Показывать обновления свода правил
                </span>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(v) =>
                  setSettings((s) => ({ ...s, notifications: v }))
                }
              />
            </div>

            {chats.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#282A2C]">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setChats([]);
                    setActiveChatId(null);
                  }}
                  className="w-full justify-start rounded-2xl text-sm text-[#F28B82] hover:bg-[#3C2A2A] hover:text-[#F28B82] gap-3 h-11"
                >
                  <Trash2 className="h-4 w-4" />
                  Удалить все обращения
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Active chat toast */}
      <AnimatePresence>
        {activeChatId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-40 bg-[#1E1F20] border border-[#282A2C] rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-sm"
          >
            <MessageSquare className="h-4 w-4 text-[#8AB4F8] shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[#9AA0A6]">Открытое обращение</span>
              <span className="text-sm text-[#E3E3E3] truncate">
                {chats.find((c) => c.id === activeChatId)?.title ?? ""}
              </span>
            </div>
            <button
              onClick={() => setActiveChatId(null)}
              className="ml-2 p-1 rounded-full text-[#9AA0A6] hover:text-[#E3E3E3] hover:bg-[#282A2C]"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
