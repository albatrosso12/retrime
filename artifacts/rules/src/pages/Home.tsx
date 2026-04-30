import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ruleSections, ranks } from "../data/rules";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Menu, ChevronUp } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const SidebarContent = () => (
    <div className="flex flex-col gap-1 py-4 h-full overflow-y-auto pr-4">
      <div className="mb-6 px-4">
        <h2 className="text-xl font-display text-primary tracking-widest">ОГЛАВЛЕНИЕ</h2>
        <div className="h-1 w-12 bg-destructive mt-2" />
      </div>
      {ruleSections.map((section, index) => {
        const num = String(index + 1).padStart(2, "0");
        return (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            className={`text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-4 ${
              activeSection === section.id
                ? "border-destructive text-foreground bg-accent/50"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
            }`}
          >
            <span className="text-destructive mr-2">{num}</span>
            {section.title}
          </button>
        );
      })}
      <button
        onClick={() => scrollTo("ranks")}
        className={`text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-4 ${
          activeSection === "ranks"
            ? "border-destructive text-foreground bg-accent/50"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
        }`}
      >
        <span className="text-destructive mr-2">{String(ruleSections.length + 1).padStart(2, "0")}</span>
        Звания
      </button>
      <button
        onClick={() => scrollTo("documents")}
        className={`text-left px-4 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-4 ${
          activeSection === "documents"
            ? "border-destructive text-foreground bg-accent/50"
            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20"
        }`}
      >
        <span className="text-destructive mr-2">{String(ruleSections.length + 2).padStart(2, "0")}</span>
        Шаблоны документов
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans selection:bg-destructive selection:text-white">
      
      {/* Mobile Header & Sidebar Drawer */}
      <div className="md:hidden sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border p-4 flex items-center justify-between">
        <div className="font-display text-xl tracking-widest text-primary flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="w-8 h-8 rounded object-cover border border-primary/30 grayscale contrast-125" />
          БАЛКАНСКИЙ КОНФЛИКТ
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="border-border rounded-none">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] border-border bg-background p-0 rounded-none">
            <SheetTitle className="sr-only">Оглавление</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[320px] shrink-0 border-r border-border h-screen sticky top-0 bg-sidebar/50 backdrop-blur-md">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col items-center">
        <div className="w-full max-w-4xl px-4 py-12 md:py-24 md:px-12 flex flex-col gap-24">
          
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center text-center gap-8 mb-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-destructive blur-2xl opacity-20 rounded-full" />
              <img 
                src={`${import.meta.env.BASE_URL}logo.jpg`} 
                alt="БАЛКАНСКИЙ КОНФЛИКТ" 
                className="w-32 h-32 md:w-48 md:h-48 object-cover rounded shadow-2xl border-2 border-primary/20 grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="rounded-none border-destructive/50 text-destructive font-mono px-3 py-1">ДОКУМЕНТ СЕКРЕТЕН / RESTRICTED</Badge>
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-foreground">
                БАЛКАНСКИЙ<br/><span className="text-primary">КОНФЛИКТ</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground italic font-serif">
                Свод правил военного RP-сервера Garry's Mod
              </p>
            </div>

            <Separator className="w-32 bg-border h-1" />

            <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
              {factions.map(faction => (
                <div key={faction} className="px-4 py-2 border border-border/50 bg-card/30 font-mono text-sm tracking-wider uppercase backdrop-blur-sm">
                  {faction}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rules Sections */}
          <div className="flex flex-col gap-32">
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
                  className="relative scroll-mt-24"
                >
                  <div className="absolute -left-4 md:-left-12 top-0 h-full w-1 bg-border" />
                  
                  <div className="mb-10 relative">
                    <div className="absolute -left-4 md:-left-12 top-2 h-12 w-1 bg-destructive" />
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-4xl md:text-6xl font-display font-bold text-muted/30 select-none">{num}</span>
                      <h2 className="text-3xl md:text-4xl font-display tracking-wide uppercase text-foreground">{section.title}</h2>
                    </div>
                    <p className="text-lg text-muted-foreground font-serif italic border-l-2 border-primary/30 pl-4 py-1">{section.subtitle}</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {section.rules.map((rule, ruleIdx) => (
                      <motion.div 
                        key={ruleIdx} 
                        variants={itemVariants}
                        className="flex gap-4 p-4 md:p-6 bg-card/40 border border-border/50 hover:border-primary/30 transition-colors group"
                      >
                        <div className="font-mono text-destructive/80 font-bold min-w-[2.5rem] mt-0.5">
                          {index + 1}.{ruleIdx + 1}
                        </div>
                        <div className="text-card-foreground leading-relaxed">
                          {rule}
                        </div>
                      </motion.div>
                    ))}
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
              className="relative scroll-mt-24"
            >
              <div className="absolute -left-4 md:-left-12 top-0 h-full w-1 bg-border" />
              
              <div className="mb-10 relative">
                <div className="absolute -left-4 md:-left-12 top-2 h-12 w-1 bg-destructive" />
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-4xl md:text-6xl font-display font-bold text-muted/30 select-none">
                    {String(ruleSections.length + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-display tracking-wide uppercase text-foreground">Звания всех фракций</h2>
                </div>
                <p className="text-lg text-muted-foreground font-serif italic border-l-2 border-primary/30 pl-4 py-1">
                  Иерархия вооруженных сил и гражданских групп.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {ranks.map((faction, idx) => (
                  <motion.div key={idx} variants={itemVariants} className="flex flex-col h-full bg-card border border-border">
                    <div 
                      className="p-4 font-display text-xl tracking-wider text-center text-white"
                      style={{ backgroundColor: faction.color }}
                    >
                      {faction.faction}
                    </div>
                    <div className="p-0 flex-1">
                      {faction.list.map((rank, rankIdx) => (
                        <div 
                          key={rankIdx} 
                          className="px-4 py-3 border-b border-border/50 last:border-0 text-sm font-medium hover:bg-muted/50 flex items-center justify-between"
                        >
                          <span>{rank}</span>
                          <span className="text-xs text-muted-foreground font-mono">{faction.list.length - rankIdx}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Documents Section */}
            <motion.section
              id="documents"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="relative scroll-mt-24"
            >
              <div className="absolute -left-4 md:-left-12 top-0 h-full w-1 bg-border" />
              
              <div className="mb-10 relative">
                <div className="absolute -left-4 md:-left-12 top-2 h-12 w-1 bg-destructive" />
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="text-4xl md:text-6xl font-display font-bold text-muted/30 select-none">
                    {String(ruleSections.length + 2).padStart(2, "0")}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-display tracking-wide uppercase text-foreground">Формат документов</h2>
                </div>
                <p className="text-lg text-muted-foreground font-serif italic border-l-2 border-primary/30 pl-4 py-1">
                  Стандартизированные бланки делопроизводства.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {documents.map((doc, idx) => (
                  <motion.div 
                    key={idx} 
                    variants={itemVariants}
                    className="bg-[#dcd8cc] dark:bg-[#1a1c1a] border border-[#a8a396] dark:border-[#2a2c2a] p-6 shadow-inner relative overflow-hidden"
                  >
                    <div className="absolute top-4 right-4 border-2 border-destructive/20 text-destructive/20 font-display text-2xl px-4 py-1 rotate-12 select-none">
                      КОПИЯ
                    </div>
                    <h3 className="font-display text-xl text-primary dark:text-primary-foreground mb-6 border-b border-black/10 dark:border-white/10 pb-2">
                      {doc.title}
                    </h3>
                    <pre className="font-mono text-sm whitespace-pre-wrap text-black/80 dark:text-white/70 leading-relaxed font-bold">
                      {doc.content}
                    </pre>
                  </motion.div>
                ))}
              </div>
            </motion.section>

          </div>

          <div className="flex justify-center mt-12 mb-8">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={scrollToTop}
              className="gap-2 rounded-none border-border font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-primary transition-all"
            >
              <ChevronUp className="w-4 h-4" /> Наверх
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full mt-auto border-t border-border bg-card/50 py-12 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 font-mono text-sm text-muted-foreground">
            <div className="flex flex-col gap-2 text-center md:text-left">
              <span className="font-bold text-foreground">БАЛКАНСКИЙ КОНФЛИКТ © 2026</span>
              <span>v1.0 — Официальный свод правил</span>
            </div>
            
            <div className="border-4 border-destructive/40 text-destructive/60 font-display text-3xl px-6 py-2 -rotate-2 select-none stamp-effect">
              УТВЕРЖДЕНО
            </div>
            
            <div className="text-center md:text-right">
              Военная Администрация<br/>
              Все права защищены
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
