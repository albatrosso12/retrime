import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, ArrowLeft, CheckCircle2, XCircle, HelpCircle, MessageSquare, AlertTriangle, Send, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppealsForReview, submitVerdict, getVerdicts, getCurrentUser, type Appeal, type Verdict, setBaseUrl } from "@workspace/api-client-react";

const API_URL = import.meta.env.VITE_API_URL || "https://retrime.korsetov2009.workers.dev";
setBaseUrl(API_URL);

const verdictConfig = {
  guilty: { label: "Виновен", color: "#DC2626", icon: XCircle },
  not_guilty: { label: "Не виновен", color: "#16A34A", icon: CheckCircle2 },
  insufficient_evidence: { label: "Недостаточно доказательств", color: "#CA8A04", icon: HelpCircle },
};

function getAuthToken(): string | null {
  const local = localStorage.getItem("auth_token");
  if (local) return local;
  const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function ReviewAppealsPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [verdict, setVerdict] = useState("guilty");
  const [reason, setReason] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) { setAuthError("Требуется авторизация"); return; }
    getCurrentUser().then((user) => { if (!user?.id) { localStorage.removeItem("auth_token"); setAuthError("Требуется авторизация"); } }).catch((err: any) => { if (err?.status === 401 || err?.status === 403) { localStorage.removeItem("auth_token"); setAuthError("Требуется авторизация"); } });
  }, [navigate]);

  const { data: appeals = [], isLoading, error } = useQuery({
    queryKey: ["appealsForReview"],
    queryFn: () => getAppealsForReview({ status: "pending" }),
    enabled: !!getAuthToken(),
    retry: (failureCount, err: any) => { if (err?.status === 401 || err?.status === 403) { localStorage.removeItem("auth_token"); navigate("/"); return false; } return failureCount < 3; },
  });

  const { data: verdicts = [] } = useQuery({
    queryKey: ["verdicts", selectedAppeal?.id],
    queryFn: async () => {
      if (!selectedAppeal) return [];
      const v = await getVerdicts(selectedAppeal.id);
      const token = getAuthToken();
      if (token) { try { const user = await getCurrentUser(); setHasVoted(v.filter((vv: Verdict) => vv.username === user.username).length > 0); } catch { setHasVoted(false); } }
      return v;
    },
    enabled: !!selectedAppeal && !!getAuthToken(),
  });

  const submitVerdictMutation = useMutation({
    mutationFn: (data: { appealId: number; verdict: string; reason: string }) => submitVerdict(data.appealId, { verdict: data.verdict as any, reason: data.reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appealsForReview"] }); queryClient.invalidateQueries({ queryKey: ["verdicts", selectedAppeal?.id] }); setReason(""); setHasVoted(true); },
  });

  const handleSubmitVerdict = () => { if (!selectedAppeal || hasVoted) return; submitVerdictMutation.mutate({ appealId: selectedAppeal.id, verdict, reason }); };

  if (authError) return (<div className="min-h-screen bg-[#F5F3EF] text-[#2D2A26] flex items-center justify-center p-4"><div className="text-center max-w-md"><AlertTriangle className="h-12 w-12 mx-auto mb-4 text-[#E67E22]" /><h2 className="text-2xl font-semibold mb-2">Требуется авторизация</h2><p className="text-[#9A9488] mb-6">{authError}</p><Button onClick={() => navigate("/")} className="bg-[#E67E22] hover:bg-[#D35400] text-white font-medium">На главную</Button></div></div>);
  if (isLoading) return (<div className="min-h-screen bg-[#F5F3EF] text-[#2D2A26] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#E67E22]" /></div>);

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#2D2A26]">
      <div className="sticky top-0 z-50 bg-[#F5F3EF]/95 backdrop-blur border-b border-[#E8E4DD]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-lg text-[#9A9488] hover:text-[#2D2A26] hover:bg-[#EAE6DF]"><ArrowLeft className="h-5 w-5" /></Button>
            <Scale className="h-6 w-6 text-[#E67E22]" />
            <h1 className="text-xl font-semibold text-[#2D2A26] font-serif">Рассмотрение жалоб</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {error && (<div className="flex items-center gap-3 p-4 mb-6 rounded-lg bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /><span>{(error as any)?.message || "Ошибка"}</span></div>)}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-[#9A9488] uppercase tracking-wider mb-4">Ожидают решения</h2>
            {appeals.length === 0 ? (<div className="text-center py-12 text-[#9A9488]"><MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Нет обращений</p></div>) : (
              appeals.map((appeal: Appeal) => (
                <button key={appeal.id} onClick={() => { setSelectedAppeal(appeal); setHasVoted(false); }} className={`w-full text-left p-4 rounded-lg border transition-all ${selectedAppeal?.id === appeal.id ? "border-[#E67E22] bg-white" : "border-[#DDD8CC] bg-white hover:border-[#E67E22]/50"}`}>
                  <div className="flex items-start justify-between mb-2"><h3 className="font-medium text-[#2D2A26] text-sm">{appeal.title}</h3><span className="text-xs text-[#9A9488]">{appeal.verdictsCount || 0}/5</span></div>
                  <p className="text-xs text-[#9A9488]">{appeal.nickname} · {appeal.faction || "—"}</p>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedAppeal ? (
                <motion.div key={selectedAppeal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="border border-[#DDD8CC] rounded-lg p-6 bg-white">
                    <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-[#2D2A26] font-serif">{selectedAppeal.title}</h2><Badge className="bg-[#EAE6DF] text-[#5C5650]">{selectedAppeal.category}</Badge></div>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm"><div><span className="text-[#9A9488]">Никнейм:</span> <span className="text-[#2D2A26]">{selectedAppeal.nickname}</span></div><div><span className="text-[#9A9488]">Фракция:</span> <span className="text-[#2D2A26]">{selectedAppeal.faction || "—"}</span></div>{selectedAppeal.contact && <div className="col-span-2"><span className="text-[#9A9488]">Контакт:</span> <span className="text-[#2D2A26]">{selectedAppeal.contact}</span></div>}</div>
                    <div className="text-sm text-[#5C5650] whitespace-pre-wrap">{selectedAppeal.message}</div>
                  </div>

                  {verdicts.length > 0 && (
                    <div className="border border-[#DDD8CC] rounded-lg p-4 bg-white">
                      <h3 className="text-sm font-medium text-[#9A9488] mb-3">Вердикты ({verdicts.length}/5)</h3>
                      <div className="space-y-2">
                        {verdicts.map((v: Verdict, idx: number) => { const config = verdictConfig[v.verdict] || verdictConfig.insufficient_evidence; const Icon = config.icon; return (<div key={idx} className="flex items-start gap-3 p-2 rounded border border-[#DDD8CC]"><Icon className="h-4 w-4 mt-0.5" style={{ color: config.color }} /><div><span className="text-sm font-medium" style={{ color: config.color }}>{config.label}</span><span className="text-xs text-[#9A9488]"> · {v.username}</span>{v.reason && <p className="text-xs text-[#9A9488] mt-1">{v.reason}</p>}</div></div>); })}
                      </div>
                    </div>
                  )}

                  {hasVoted ? (<div className="text-center py-8 text-[#9A9488]"><CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" /><p>Ваш вердикт учтён</p></div>) : (selectedAppeal.verdictsCount || 0) >= 5 ? (<div className="text-center py-8 text-[#9A9488]"><Shield className="h-8 w-8 mx-auto mb-2 text-[#E67E22]" /><p>Ожидается решение</p></div>) : (
                    <div className="border border-[#DDD8CC] rounded-lg p-6 bg-white">
                      <h3 className="text-sm font-medium text-[#2D2A26] mb-4">Вынести вердикт</h3>
                      <RadioGroup value={verdict} onValueChange={setVerdict} className="space-y-2 mb-4">
                        {Object.entries(verdictConfig).map(([key, config]) => { const Icon = config.icon; return (<label key={key} className="flex items-center gap-3 p-3 rounded border border-[#DDD8CC] cursor-pointer hover:border-[#E67E22]/50"><RadioGroupItem value={key} /><Icon className="h-4 w-4" style={{ color: config.color }} /><span className="text-sm" style={{ color: config.color }}>{config.label}</span></label>); })}
                      </RadioGroup>
                      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Причина (необязательно)" className="mb-4 bg-[#FAF9F7] border-[#DDD8CC] text-[#2D2A26] placeholder:text-[#9A9488]" />
                      <Button onClick={handleSubmitVerdict} disabled={submitVerdictMutation.isPending} className="w-full bg-[#E67E22] hover:bg-[#D35400] text-white font-medium">{submitVerdictMutation.isPending ? "Отправка..." : "Отправить"}</Button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#9A9488]"><p>Выберите обращение из списка</p></div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}