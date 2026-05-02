import { useCallback, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ruleSections, ranks } from "../data/rules";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar, MobileMenuTrigger } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useChats } from "@/hooks/useChats";
import { useSettings } from "@/hooks/useSettings";

const factions = ["Гражданские", "Сербская Армия", "НАТО / Канадцы", "Армия РФ"];

const documents = [
  { title: "ШАБЛОН РАПОРТА", content: `КОМУ: Командиру подразделения\nОТ КОГО: [Звание] [Фамилия]\nДАТА: ДД.ММ.ГГГГ\n\nСОДЕРЖАНИЕ:\nДокладываю о происшествии...\n\nПОДПИСЬ: _______` },
  { title: "ШАБЛОН ПРИКАЗА", content: `ПРИКАЗ № ___\nОТ: [Должность, Звание]\nДАТА: ДД.ММ.ГГГГ\n\nСОДЕРЖАНИЕ:\n1. Выдвинуться в квадрат B2\n2. Организовать блокпост\n\nПОДПИСЬ: _______` },
  { title: "ПРОТОКОЛ ЗАДЕРЖАНИЯ", content: `ПРОТОКОЛ № ___\nОТ КОГО: Патрульный [Звание]\nДАТА: ДД.ММ.ГГГГ\nЗАДЕРЖАННЫЙ: [Имя]\n\nПРИЧИНА: Нарушение комендантского часа\n\nПОДПИСЬ: _______` },
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
    return () => { el.removeEventListener("scroll", updateNavScrollState); window.removeEventListener("resize", updateNavScrollState); };
  }, [updateNavScrollState]);

  useEffect(() => {
    const t = window.setTimeout(updateNavScrollState, 320);
    return () => window.clearTimeout(t);
  }, [sidebarExpanded, updateNavScrollState]);

  const scrollNavBy = (direction: "left" | "right") => {
    const el = navRef.current;
    if (!el) return;
    const amount = Math.max(240, el.clientWidth * 0.7);
    el.scrollTo({ left: el.scrollLeft + (direction === "left" ? -amount : amount), behavior: "smooth" });
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
    document.querySelectorAll("section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) { element.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#2D2A26] flex font-sans">
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} onOpenSettings={() => setSettingsOpen(true)} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#F5F3EF]/95 backdrop-blur border-b border-[#E8E4DD]">
          <div className="flex items-center gap-3">
            <MobileMenuTrigger onClick={() => setIsMobileMenuOpen(true)} />
            <span className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="w-7 h-7 rounded-full object-cover" />
              Балканский Конфликт
            </span>
          </div>
        </header>

        <main className="flex-1">
          <div className="max-w-3xl mx-auto px-6 py-12 pb-24 flex flex-col gap-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
              <p className="text-[#9A9488] text-sm uppercase tracking-widest">Добро пожаловать</p>
              <h1 className="text-4xl md:text-5xl font-semibold text-[#2D2A26] tracking-tight font-serif">
                Свод правил <span className="text-[#E67E22] font-serif">сервера</span>
              </h1>
              <div className="flex flex-wrap gap-2 pt-2">
                {factions.map((f) => (
                  <span key={f} className="px-3 py-1.5 rounded-md bg-[#EAE6DF] text-[#5C5650] text-sm border border-[#DDD8CC]">{f}</span>
                ))}
              </div>
            </motion.div>

            <div className="sticky top-20 z-20 py-2 bg-[#F5F3EF]/95 backdrop-blur -mx-6 px-6 md:mx-0 md:px-0">
              <div className="relative">
                {canScrollLeft && (
                  <button onClick={() => scrollNavBy("left")} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-lg bg-[#EAE6DF] border border-[#DDD8CC] text-[#9A9488] hover:text-[#2D2A26]">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#F5F3EF] to-transparent z-10" />
                <div ref={navRef} onWheel={(e) => { if (e.deltaY !== 0) { e.preventDefault(); e.currentTarget.scrollLeft += e.deltaY; } }} className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 px-10 scroll-smooth">
                  {ruleSections.map((s) => (
                    <button key={s.id} data-section={s.id} onClick={() => scrollTo(s.id)} className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === s.id ? "bg-[#E67E22] text-white" : "bg-[#EAE6DF] text-[#5C5650] border border-[#DDD8CC] hover:text-[#2D2A26]"}`}>
                      {s.title}
                    </button>
                  ))}
                  <button data-section="ranks" onClick={() => scrollTo("ranks")} className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === "ranks" ? "bg-[#E67E22] text-white" : "bg-[#EAE6DF] text-[#5C5650] border border-[#DDD8CC] hover:text-[#2D2A26]"}`}>Звания</button>
                  <button data-section="documents" onClick={() => scrollTo("documents")} className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeSection === "documents" ? "bg-[#E67E22] text-white" : "bg-[#EAE6DF] text-[#5C5650] border border-[#DDD8CC] hover:text-[#2D2A26]"}`}>Документы</button>
                </div>
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#F5F3EF] to-transparent z-10" />
                {canScrollRight && (
                  <button onClick={() => scrollNavBy("right")} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-lg bg-[#EAE6DF] border border-[#DDD8CC] text-[#9A9488] hover:text-[#2D2A26]">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {ruleSections.map((section, idx) => (
                <section key={section.id} id={section.id} className="scroll-mt-36">
                  <div className="border border-[#DDD8CC] rounded-xl p-6 bg-white shadow-sm">
                    <div className="mb-6">
                      <span className="text-xs font-medium text-[#E67E22] uppercase tracking-wider">Раздел {String(idx + 1).padStart(2, "0")}</span>
                      <h2 className="text-2xl font-semibold text-[#2D2A26] mt-2 font-serif">{section.title}</h2>
                      <p className="text-[#9A9488] mt-1">{section.subtitle}</p>
                    </div>
                    <div className="space-y-3">
                      {section.rules.map((rule, rIdx) => (
                        <div key={rIdx} className="flex gap-3 text-[#4A4540]">
                          <span className="text-[#9A9488] font-medium shrink-0 w-5">{rIdx + 1}.</span>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}

              <section id="ranks" className="scroll-mt-36">
                <div className="border border-[#DDD8CC] rounded-xl p-6 bg-white shadow-sm">
                  <span className="text-xs font-medium text-[#E67E22] uppercase tracking-wider">Раздел {String(ruleSections.length + 1).padStart(2, "0")}</span>
                  <h2 className="text-2xl font-semibold text-[#2D2A26] mt-2 mb-6 font-serif">Звания фракций</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ranks.map((faction, idx) => (
                      <div key={idx} className="border border-[#DDD8CC] rounded-lg p-4 bg-[#FAF9F7]">
                        <h3 className="text-sm font-medium text-[#2D2A26] mb-3 pb-2 border-b border-[#DDD8CC]">{faction.faction}</h3>
                        <div className="space-y-1">
                          {faction.list.map((rank, rIdx) => (
                            <div key={rIdx} className="flex justify-between text-sm text-[#5C5650]">
                              <span>{rank}</span>
                              <span className="text-[#9A9488] text-xs">{faction.list.length - rIdx}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section id="documents" className="scroll-mt-36">
                <div className="border border-[#DDD8CC] rounded-xl p-6 bg-white shadow-sm">
                  <span className="text-xs font-medium text-[#E67E22] uppercase tracking-wider">Раздел {String(ruleSections.length + 2).padStart(2, "0")}</span>
                  <h2 className="text-2xl font-semibold text-[#2D2A26] mt-2 mb-6 font-serif">Документы</h2>
                  <div className="space-y-4">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="border border-[#DDD8CC] rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#DDD8CC] bg-[#FAF9F7]">
                          <h3 className="text-sm font-medium text-[#2D2A26]">{doc.title}</h3>
                        </div>
                        <pre className="p-4 text-xs text-[#9A9488] whitespace-pre-wrap font-mono">{doc.content}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
          <footer className="py-8 text-center text-xs text-[#9A9488]">Балканский Конфликт · 2026</footer>
        </main>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} setSettings={(u) => setSettings(u(settings))} hasChats={chats.length > 0} onClearChats={clearChats} />
    </div>
  );
}