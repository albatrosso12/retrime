import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sidebar, MobileMenuTrigger } from "@/components/Sidebar";
import { SettingsDialog } from "@/components/SettingsDialog";
import { useChats } from "@/hooks/useChats";
import { useSettings } from "@/hooks/useSettings";
import { useSubmitAppeal } from "@workspace/api-client-react";

const factions = ["Гражданские", "Сербская Армия", "НАТО / Канадцы", "Армия РФ"];
const categories = [
  "Жалоба на игрока",
  "Жалоба на администратора",
  "Предложение",
  "Вопрос",
  "Обжалование бана",
  "Другое",
];

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { chats, updateChat, clearChats } = useChats();
  const { settings, setSettings } = useSettings();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const chat = useMemo(() => chats.find((c) => c.id === params.id), [chats, params.id]);

  const [nickname, setNickname] = useState("");
  const [faction, setFaction] = useState(factions[0]);
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (chat && !hydrated) {
      setNickname(chat.draft?.nickname ?? "");
      setFaction(chat.draft?.faction ?? factions[0]);
      setContact(chat.draft?.contact ?? "");
      setCategory(chat.draft?.category ?? categories[0]);
      setMessage(chat.draft?.message ?? "");
      setHydrated(true);
    }
  }, [chat, hydrated]);

  useEffect(() => {
    if (!chat || !hydrated) return;
    const t = window.setTimeout(() => {
      updateChat(chat.id, {
        draft: { nickname, faction, contact, category, message },
      });
    }, 400);
    return () => window.clearTimeout(t);
  }, [chat?.id, hydrated, nickname, faction, contact, category, message]);

  const submitMutation = useSubmitAppeal({
    mutation: {
      onSuccess: () => {
        if (chat) {
          updateChat(chat.id, {
            status: "sent",
            sentAt: Date.now(),
            title:
              category && nickname
                ? `${category} — ${nickname}`
                : chat.title,
          });
        }
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chat) return;
    submitMutation.mutate({
      data: {
        chatId: chat.id,
        title: chat.title,
        nickname: nickname.trim(),
        faction,
        contact: contact.trim(),
        category,
        message: message.trim(),
      },
    });
  };

  const isSent = chat?.status === "sent";
  const isPending = submitMutation.isPending;
  const isError = submitMutation.isError;
  const errorText =
    submitMutation.error &&
    (submitMutation.error as { message?: string })?.message
      ? String((submitMutation.error as { message?: string }).message)
      : "Не удалось отправить обращение. Попробуйте ещё раз.";

  if (!chat) {
    return (
      <div className="min-h-screen bg-[#131314] text-[#E3E3E3] flex font-sans">
        <Sidebar
          expanded={sidebarExpanded}
          setExpanded={setSidebarExpanded}
          onOpenSettings={() => setSettingsOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <h2 className="text-2xl font-medium">Обращение не найдено</h2>
          <p className="text-[#9AA0A6] max-w-md">
            Возможно, оно было удалено или ещё не создано на этом устройстве.
          </p>
          <Button
            onClick={() => navigate("/")}
            className="rounded-full bg-[#282A2C] hover:bg-[#444746] text-[#E3E3E3] gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Button>
        </div>
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          setSettings={(u) => setSettings(u(settings))}
          hasChats={chats.length > 0}
          onClearChats={() => {
            clearChats();
            navigate("/");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131314] text-[#E3E3E3] flex font-sans selection:bg-[#8AB4F8] selection:text-[#131314]">
      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
        onOpenSettings={() => setSettingsOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-[#131314]">
        <header className="sticky top-0 z-30 flex items-center gap-3 p-4 bg-[#131314]/90 backdrop-blur">
          <MobileMenuTrigger onClick={() => setIsMobileMenuOpen(true)} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3]"
            aria-label="Назад"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-[#E3E3E3] text-xl font-medium tracking-tight truncate">
            {chat.title}
          </span>
          {isSent && (
            <span className="ml-auto text-xs uppercase tracking-wide text-[#8AB4F8] bg-[#8AB4F8]/10 rounded-full px-3 py-1">
              Отправлено
            </span>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="max-w-[760px] mx-auto px-4 md:px-8 py-6 md:py-10 pb-24 flex flex-col gap-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-3"
            >
              <h1 className="text-3xl md:text-4xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#8AB4F8] to-[#D7E3FC] tracking-tight">
                Подача обращения
              </h1>
              <p className="text-[#9AA0A6] text-sm md:text-base">
                Заполните форму. Обращение будет передано администрации, обработано
                нейросетью и доставлено в Telegram или Discord для рассмотрения.
              </p>
            </motion.div>

            <form
              onSubmit={handleSubmit}
              className="bg-[#1E1F20] rounded-3xl p-6 md:p-8 border border-[#282A2C] flex flex-col gap-5"
            >
              <Field label="Никнейм в игре" htmlFor="nickname">
                <input
                  id="nickname"
                  type="text"
                  required
                  minLength={1}
                  maxLength={100}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isSent || isPending}
                  placeholder="Например, Ivan_Petrov"
                  className="w-full bg-[#131314] border border-[#282A2C] rounded-2xl px-4 py-3 text-[#E3E3E3] placeholder:text-[#5F6368] focus:outline-none focus:border-[#8AB4F8] transition-colors disabled:opacity-60"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Сторона" htmlFor="faction">
                  <select
                    id="faction"
                    value={faction}
                    onChange={(e) => setFaction(e.target.value)}
                    disabled={isSent || isPending}
                    className="w-full bg-[#131314] border border-[#282A2C] rounded-2xl px-4 py-3 text-[#E3E3E3] focus:outline-none focus:border-[#8AB4F8] transition-colors disabled:opacity-60"
                  >
                    {factions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Категория" htmlFor="category">
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSent || isPending}
                    className="w-full bg-[#131314] border border-[#282A2C] rounded-2xl px-4 py-3 text-[#E3E3E3] focus:outline-none focus:border-[#8AB4F8] transition-colors disabled:opacity-60"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Контакт для ответа"
                htmlFor="contact"
                hint="Telegram (@username) или Discord (username#0000)"
              >
                <input
                  id="contact"
                  type="text"
                  required
                  minLength={1}
                  maxLength={200}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={isSent || isPending}
                  placeholder="@username или username#0000"
                  className="w-full bg-[#131314] border border-[#282A2C] rounded-2xl px-4 py-3 text-[#E3E3E3] placeholder:text-[#5F6368] focus:outline-none focus:border-[#8AB4F8] transition-colors disabled:opacity-60"
                />
              </Field>

              <Field
                label="Текст обращения"
                htmlFor="message"
                hint="Минимум 5 символов. Опишите ситуацию подробно."
              >
                <textarea
                  id="message"
                  required
                  minLength={5}
                  maxLength={5000}
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isSent || isPending}
                  placeholder="Подробное описание ситуации, время, место, никнеймы участников, ссылки на доказательства…"
                  className="w-full bg-[#131314] border border-[#282A2C] rounded-2xl px-4 py-3 text-[#E3E3E3] placeholder:text-[#5F6368] focus:outline-none focus:border-[#8AB4F8] transition-colors resize-y min-h-[160px] disabled:opacity-60"
                />
                <div className="text-xs text-[#5F6368] text-right mt-1">
                  {message.length} / 5000
                </div>
              </Field>

              <AnimatePresence>
                {isError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 rounded-2xl border border-[#5C2B29] bg-[#3C2A2A] text-[#F28B82] px-4 py-3 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{errorText}</span>
                  </motion.div>
                )}
                {isSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-2xl border border-[#1E3A2A] bg-[#1B2C22] text-[#81C995] px-4 py-3 text-sm"
                  >
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Обращение отправлено и передано на обработку. Ответ придёт
                      в указанный контакт.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/")}
                  className="rounded-full text-[#E3E3E3] hover:bg-[#282A2C] hover:text-[#E3E3E3]"
                >
                  Закрыть
                </Button>
                <Button
                  type="submit"
                  disabled={isSent || isPending}
                  className="rounded-full bg-[#8AB4F8] hover:bg-[#A8C7FA] text-[#131314] font-medium px-5 gap-2 disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Отправка…
                    </>
                  ) : isSent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Отправлено
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Отправить
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="text-xs text-[#5F6368] text-center">
              Обращения передаются через защищённый канал на сервер,
              а затем в Zapier для обработки нейросетью и доставки в
              Telegram / Discord.
            </div>
          </div>
        </main>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        setSettings={(u) => setSettings(u(settings))}
        hasChats={chats.length > 0}
        onClearChats={() => {
          clearChats();
          navigate("/");
        }}
      />
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-[#E3E3E3]">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-[#9AA0A6]">{hint}</p>}
    </div>
  );
}
