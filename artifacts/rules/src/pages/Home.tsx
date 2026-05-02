import { useCallback, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ruleSections, ranks } from "../data/rules";
import { ChevronLeft, ChevronRight, FileText, Shield, Users, Scroll } from "lucide-react";
import { Sidebar, MobileMenuTrigger } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useChats } from "@/hooks/useChats";
import { useSettings } from "@/hooks/useSettings";

const factions = [
  { name: "Гражданские", icon: Users, color: "from-gray-500 to-gray-600" },
  { name: "Сербская Армия", icon: Shield, color: "from-red-500 to-red-600" },
  { name: "НАТО / Канадцы", icon: Shield, color: "from-blue-500 to-blue-600" },
  { name: "Армия РФ", icon: Shield, color: "from-amber-500 to-amber-600" },
];

const documents = [
  {
    title: "ШАБЛОН РАПОРТА",
    icon: FileText,
    content: `КОМУ: Командиру подразделения
ОТ КОГО: [Звание] [Фамилия]
ДАТА: ДД.ММ.ГГГГ

СОДЕРЖАНИЕ:
Докладываю о происшествии во время патруля квадрата D4. В 14:00 был обнаружен...

ПОДПИСЬ: _______`,
  },
  {
    title: "ШАБЛОН ПРИКАЗА",
    icon: Scroll,
    content: `ПРИКАЗ № ___
ОТ: [Должность, Звание]
ДАТА: ДД.ММ.ГГГГ

СОДЕРЖАНИЕ:
1. Выдвинуться в квадрат B2 для зачистки.
2. Организовать блокпост на перекрестке.
3. Открывать огонь на поражение при сопротивлении.

ПОДПИСЬ: _______`,
  },
  {
    title: "ПРОТОКОЛ ЗАДЕРЖАНИЯ",
    icon: Shield,
    content: `ПРОТОКОЛ № ___
ОТ КОГО: Патрульный [Звание]
ДАТА: ДД.ММ.ГГГГ
ЗАДЕРЖАННЫЙ: [Имя Фамилия или Описание]

ПРИЧИНА ЗАДЕРЖАНИЯ:
Нарушение комендантского часа, ношение оружия.
ИЗЪЯТОЕ ИМУЩЕСТВО:
- Пистолет ПМ
- Радиостанция

ПОДПИСЬ: _______`,
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("general");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, setSettings } = useSettings();
  const { chats, clearChats } = useChats();
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
              const activeBtn = container.querySelector<HTMLElement>(`[data-section="${entry.target.id}"]`);
              if (activeBtn) {
                const target = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
                container.scrollTo({ left: target, behavior: "smooth" });
              }
            }
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px" },
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
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E8EAED] flex font-sans selection:bg-[#8AB4F8]/30 selection:text-[#E8EAED]">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#8AB4F8]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#6B9DFC]/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8AB4F8]/3 rounded-full blur-[150px]" />
      </div>

      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
        onOpenSettings={() => setSettingsOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10">
        <header className="sticky top-0 z-30 flex items-center justify-between p-5 bg-[#0A0A0C]/80 backdrop-blur-xl border-b border-[#1F1F23]">
          <div className="flex items-center gap-4">
            <MobileMenuTrigger onClick={() => setIsMobileMenuOpen(true)} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8AB4F8] to-[#5B8DEE] flex items-center justify-center shadow-lg shadow-[#8AB4F8]/20">
                <img
                  src={`${import.meta.env.BASE_URL}logo.jpg`}
                  alt="Logo"
                  className="w-6 h-6 rounded-full object-cover"
                />
              </div>
              <span className="text-lg font-medium text-white tracking-tight">
                Балканский Конфликт
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[900px] mx-auto px-6 md:px-10 py-10 pb-28 flex flex-col gap-14">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-8 pt-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8AB4F8]/10 border border-[#8AB4F8]/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-[#8AB4F8] animate-pulse" />
                <span className="text-sm text-[#8AB4F8] font-medium">Roleplay Server</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-normal text-[#9CA3AF] tracking-tight leading-tight">
                  Добро пожаловать
                </h1>
                <h2 className="text-5xl md:text-7xl font-semibold text-white tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-[#E8EAED] via-white to-[#9CA3AF] bg-clip-text text-transparent">
                    Свод правил
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-[#8AB4F8] to-[#6B9DFC] bg-clip-text text-transparent">
                    сервера
                  </span>
                </h2>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {factions.map((faction) => {
                  const Icon = faction.icon;
                  return (
                    <motion.div
                      key={faction.name}
                      whileHover={{ scale: 1.02 }}
                      className="group flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#151518] border border-[#2D2D30] hover:border-[#3D3D40] transition-all duration-200 cursor-pointer"
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${faction.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-medium text-[#E8EAED] group-hover:text-white transition-colors">
                        {faction.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Navigation Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="sticky top-20 z-20 py-3 bg-[#0A0A0C]/90 backdrop-blur-xl -mx-6 px-6 md:mx-0 md:px-0"
            >
              <div className="relative">
                <AnimatePresence>
                  {canScrollLeft && (
                    <motion.button
                      key="left-arrow"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => scrollNavBy("left")}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-xl bg-[#151518] border border-[#2D2D30] hover:border-[#8AB4F8]/50 hover:bg-[#1A1A1D] text-[#6B7280] hover:text-[#8AB4F8] transition-all duration-200 shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0A0A0C] to-transparent z-10" />

                <div
                  ref={navRef}
                  onWheel={(e) => {
                    if (e.deltaY === 0) return;
                    const el = e.currentTarget;
                    const max = el.scrollWidth - el.clientWidth;
                    if (max <= 0) return;
                    if ((e.deltaY > 0 && el.scrollLeft < max) || (e.deltaY < 0 && el.scrollLeft > 0)) {
                      e.preventDefault();
                      el.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex gap-2.5 overflow-x-auto no-scrollbar pb-3 pt-1 px-14 scroll-smooth"
                >
                  {ruleSections.map((section) => (
                    <button
                      key={section.id}
                      data-section={section.id}
                      onClick={() => scrollTo(section.id)}
                      className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-gradient-to-r from-[#8AB4F8] to-[#6B9DFC] text-[#0A0A0C] shadow-lg shadow-[#8AB4F8]/25"
                          : "bg-[#151518] text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white border border-[#2D2D30] hover:border-[#3D3D40]"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                  <button
                    data-section="ranks"
                    onClick={() => scrollTo("ranks")}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "ranks"
                        ? "bg-gradient-to-r from-[#8AB4F8] to-[#6B9DFC] text-[#0A0A0C] shadow-lg shadow-[#8AB4F8]/25"
                        : "bg-[#151518] text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white border border-[#2D2D30] hover:border-[#3D3D40]"
                    }`}
                  >
                    Звания
                  </button>
                  <button
                    data-section="documents"
                    onClick={() => scrollTo("documents")}
                    className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeSection === "documents"
                        ? "bg-gradient-to-r from-[#8AB4F8] to-[#6B9DFC] text-[#0A0A0C] shadow-lg shadow-[#8AB4F8]/25"
                        : "bg-[#151518] text-[#9CA3AF] hover:bg-[#1A1A1D] hover:text-white border border-[#2D2D30] hover:border-[#3D3D40]"
                    }`
                  >
                    Документы
                  </button>
                </div>

                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0A0A0C] to-transparent z-10" />

                <AnimatePresence>
                  {canScrollRight && (
                    <motion.button
                      key="right-arrow"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => scrollNavBy("right")}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-xl bg-[#151518] border border-[#2D2D30] hover:border-[#8AB4F8]/50 hover:bg-[#1A1A1D] text-[#6B7280] hover:text-[#8AB4F8] transition-all duration-200 shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Rule Sections */}
            <div className="flex flex-col gap-8">
              {ruleSections.map((section, index) => {
                const num = String(index + 1).padStart(2, "0");
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={containerVariants}
                    className="scroll-mt-36"
                  >
                    <motion.div
                      variants={itemVariants}
                      className="bg-[#151518]/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#2D2D30] hover:border-[#3D3D40] transition-all duration-300 hover:shadow-2xl hover:shadow-[#8AB4F8]/5"
                    >
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#8AB4F8]/20 to-[#6B9DFC]/10 border border-[#8AB4F8]/30">
                            <span className="text-[#8AB4F8] font-bold text-lg">{num}</span>
                          </span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
                          {section.title}
                        </h2>
                        <p className="text-lg text-[#6B7280]">{section.subtitle}</p>
                      </div>

                      <div className="flex flex-col gap-4">
                        {section.rules.map((rule, ruleIdx) => (
                          <motion.div
                            key={ruleIdx}
                            variants={itemVariants}
                            className="group flex gap-4 text-[15px] text-[#D1D5DB] leading-relaxed p-3 rounded-xl hover:bg-[#1A1A1D] transition-colors"
                          >
                            <span className="text-[#6B7280] font-medium mt-0.5 shrink-0 w-6 flex-shrink-0 group-hover:text-[#8AB4F8] transition-colors">
                              {ruleIdx + 1}.
                            </span>
                            <div className="flex-1">{rule}</div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.section>
                );
              })}

              {/* Ranks Section */}
              <motion.section
                id="ranks"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={containerVariants}
                className="scroll-mt-36"
              >
                <motion.div
                  variants={itemVariants}
                  className="bg-[#151518]/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#2D2D30] hover:border-[#3D3D40] transition-all duration-300"
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#8AB4F8]/20 to-[#6B9DFC]/10 border border-[#8AB4F8]/30">
                        <span className="text-[#8AB4F8] font-bold text-lg">{String(ruleSections.length + 1).padStart(2, "0")}</span>
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
                      Звания всех фракций
                    </h2>
                    <p className="text-lg text-[#6B7280]">Иерархия вооружённых сил и гражданских групп.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {ranks.map((faction, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        className="bg-gradient-to-br from-[#1A1A1D] to-[#151518] rounded-2xl p-6 border border-[#2D2D30] hover:border-[#8AB4F8]/30 transition-all duration-300"
                      >
                        <h3 className="text-lg font-semibold text-white mb-5 pb-4 border-b border-[#2D2D30]">
                          {faction.faction}
                        </h3>
                        <div className="flex flex-col gap-1">
                          {faction.list.map((rank, rankIdx) => (
                            <div
                              key={rankIdx}
                              className="py-2.5 border-b border-[#2D2D30]/50 last:border-0 text-[15px] flex items-center justify-between text-[#D1D5DB] hover:text-white transition-colors"
                            >
                              <span>{rank}</span>
                              <span className="text-xs text-[#6B7280] font-mono bg-[#1A1A1D] px-2 py-1 rounded-md">
                                {faction.list.length - rankIdx}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.section>

              {/* Documents Section */}
              <motion.section
                id="documents"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={containerVariants}
                className="scroll-mt-36"
              >
                <motion.div
                  variants={itemVariants}
                  className="bg-[#151518]/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-[#2D2D30] hover:border-[#3D3D40] transition-all duration-300"
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#8AB4F8]/20 to-[#6B9DFC]/10 border border-[#8AB4F8]/30">
                        <span className="text-[#8AB4F8] font-bold text-lg">{String(ruleSections.length + 2).padStart(2, "0")}</span>
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
                      Формат документов
                    </h2>
                    <p className="text-lg text-[#6B7280]">Стандартизированные бланки делопроизводства.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {documents.map((doc, idx) => {
                      const Icon = doc.icon;
                      return (
                        <motion.div
                          key={idx}
                          variants={itemVariants}
                          className="group bg-gradient-to-br from-[#1A1A1D] to-[#151518] rounded-2xl overflow-hidden border border-[#2D2D30] hover:border-[#8AB4F8]/30 transition-all duration-300"
                        >
                          <div className="flex items-center gap-4 px-6 py-4 border-b border-[#2D2D30] bg-[#151518]/50">
                            <div className="w-10 h-10 rounded-xl bg-[#8AB4F8]/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-[#8AB4F8]" />
                            </div>
                            <h3 className="text-lg font-semibold text-white">{doc.title}</h3>
                          </div>
                          <div className="p-6">
                            <pre className="font-mono text-sm whitespace-pre-wrap text-[#9CA3AF] leading-relaxed group-hover:text-[#D1D5DB] transition-colors">
                              {doc.content}
                            </pre>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </motion.section>
            </div>
          </div>

          <footer className="w-full py-10 text-center text-sm text-[#4B5563]">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#8AB4F8]/50" />
              <span>Балканский Конфликт · v1.0 · 2026</span>
            </div>
          </footer>
        </main>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        setSettings={(u) => setSettings(u(settings))}
        hasChats={chats.length > 0}
        onClearChats={clearChats}
      />
    </div>
  );
}