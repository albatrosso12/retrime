import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Scale, ArrowLeft, CheckCircle2, XCircle, HelpCircle, MessageSquare, AlertTriangle, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppealsForReview,
  submitVerdict,
  getVerdicts,
  getCurrentUser,
  type Appeal,
  type Verdict,
  setBaseUrl,
} from "@workspace/api-client-react";

const API_URL = import.meta.env.VITE_API_URL || "https://retrime.korsetov2009.workers.dev";
setBaseUrl(API_URL);

const verdictConfig = {
  guilty: { 
    label: "Виновен", 
    color: "text-red-400", 
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: XCircle 
  },
  not_guilty: { 
    label: "Не виновен", 
    color: "text-green-400", 
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: CheckCircle2 
  },
  insufficient_evidence: { 
    label: "Недостаточно доказательств", 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: HelpCircle 
  },
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
    if (!token) {
      setAuthError("Требуется авторизация");
      return;
    }

    getCurrentUser()
      .then((user) => {
        if (!user || !user.id) {
          localStorage.removeItem("auth_token");
          setAuthError("Требуется авторизация");
        }
      })
      .catch((err: any) => {
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("auth_token");
          setAuthError(err?.message || "Требуется авторизация");
        }
      });
  }, [navigate]);

  const { data: appeals = [], isLoading, error } = useQuery({
    queryKey: ["appealsForReview"],
    queryFn: () => getAppealsForReview({ status: "pending" }),
    enabled: !!getAuthToken(),
    retry: (failureCount, err: any) => {
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem("auth_token");
        navigate("/");
        return false;
      }
      return failureCount < 3;
    },
  });

  const { data: verdicts = [] } = useQuery({
    queryKey: ["verdicts", selectedAppeal?.id],
    queryFn: async () => {
      if (!selectedAppeal) return [];
      const v = await getVerdicts(selectedAppeal.id);
      
      const token = getAuthToken();
      if (token) {
        try {
          const user = await getCurrentUser();
          const currentUserVote = v.find((vv: Verdict) => {
            return v.filter((vvv: Verdict) => vvv.username === user.username).length > 0;
          });
          // Check if current user has voted - compare by username from current user
          const myVotes = v.filter((vv: Verdict) => vv.username === user.username);
          if (myVotes.length > 0) {
            setHasVoted(true);
          } else {
            setHasVoted(false);
          }
        } catch {
          setHasVoted(false);
        }
      }
      
      return v;
    },
    enabled: !!selectedAppeal && !!getAuthToken(),
  });

  const submitVerdictMutation = useMutation({
    mutationFn: (data: { appealId: number; verdict: string; reason: string }) =>
      submitVerdict(data.appealId, { verdict: data.verdict as any, reason: data.reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appealsForReview"] });
      queryClient.invalidateQueries({ queryKey: ["verdicts", selectedAppeal?.id] });
      setReason("");
      setHasVoted(true);
    },
  });

  const handleSubmitVerdict = () => {
    if (!selectedAppeal || hasVoted) return;
    submitVerdictMutation.mutate({
      appealId: selectedAppeal.id,
      verdict,
      reason,
    });
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-[#131314] text-[#E3E3E3] flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-[#1E1F20] rounded-2xl p-8 border border-[#282A2C]">
          <AlertTriangle className="h-14 w-14 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-semibold mb-2 text-[#E3E3E3]">Требуется авторизация</h2>
          <p className="text-[#9AA0A6] mb-6">{authError}</p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-[#8AB4F8] hover:bg-[#7AA4E8] text-[#131314] font-medium px-6"
          >
            На главную
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#131314] text-[#E3E3E3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-[#8AB4F8] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#9AA0A6]">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131314] text-[#E3E3E3]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#131314]/95 backdrop-blur-sm border-b border-[#282A2C]">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-full hover:bg-[#282A2C] text-[#9AA0A6] hover:text-[#E3E3E3]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8AB4F8] to-[#6B9DFC] flex items-center justify-center">
                <Scale className="h-5 w-5 text-[#131314]" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-[#E3E3E3]">Рассмотрение жалоб</h1>
                <p className="text-sm text-[#9AA0A6]">Оцените обращения игроков</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            {(error as any)?.message || "Ошибка загрузки жалоб"}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Appeals List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#E3E3E3]">Ожидают решения</h2>
              <Badge className="bg-[#282A2C] text-[#9AA0A6] border-0">
                {appeals.length}
              </Badge>
            </div>
            
            {appeals.length === 0 ? (
              <div className="bg-[#1E1F20] rounded-xl p-8 border border-[#282A2C] text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[#6B9DFC] opacity-50" />
                <p className="text-[#9AA0A6]">Нет жалоб для рассмотрения</p>
              </div>
            ) : (
              <div className="space-y-2">
                {appeals.map((appeal: Appeal, idx: number) => (
                  <motion.div
                    key={appeal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card
                      className={`bg-[#1E1F20] border-[#282A2C] cursor-pointer hover:border-[#8AB4F8]/50 transition-all duration-200 hover:bg-[#252629] ${
                        selectedAppeal?.id === appeal.id ? "border-[#8AB4F8] bg-[#252629]" : ""
                      }`}
                      onClick={() => {
                        setSelectedAppeal(appeal);
                        setHasVoted(false);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-[#E3E3E3] line-clamp-1">{appeal.title}</h3>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            (appeal.verdictsCount || 0) >= 5 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-[#282A2C] text-[#9AA0A6]"
                          }`}>
                            {appeal.verdictsCount || 0}/5
                          </div>
                        </div>
                        <p className="text-sm text-[#9AA0A6] mb-2">
                          {appeal.nickname} &middot; {appeal.faction || "—"}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[#282A2C] text-[#9AA0A6] text-xs border-0">
                            {appeal.category}
                          </Badge>
                          {(appeal.verdictsCount || 0) >= 5 && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs border-0">
                              На проверке
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Appeal Details */}
          <div className="lg:col-span-8">
            {selectedAppeal ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Main Appeal Card */}
                <Card className="bg-[#1E1F20] border-[#282A2C] overflow-hidden">
                  <div className="bg-gradient-to-r from-[#8AB4F8]/10 to-transparent px-6 py-4 border-b border-[#282A2C]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-[#E3E3E3]">
                        {selectedAppeal.title}
                      </CardTitle>
                      <Badge className="bg-[#282A2C] text-[#9AA0A6] border-0">
                        {selectedAppeal.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#282A2C]/50 rounded-lg p-3">
                        <p className="text-xs text-[#9AA0A6] mb-1">Никнейм</p>
                        <p className="text-[#E3E3E3] font-medium">{selectedAppeal.nickname}</p>
                      </div>
                      <div className="bg-[#282A2C]/50 rounded-lg p-3">
                        <p className="text-xs text-[#9AA0A6] mb-1">Фракция</p>
                        <p className="text-[#E3E3E3] font-medium">{selectedAppeal.faction || "—"}</p>
                      </div>
                      {selectedAppeal.contact && (
                        <div className="col-span-2 bg-[#282A2C]/50 rounded-lg p-3">
                          <p className="text-xs text-[#9AA0A6] mb-1">Контакт</p>
                          <p className="text-[#E3E3E3] font-medium">{selectedAppeal.contact}</p>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#282A2C]/30 rounded-lg p-4">
                      <p className="text-xs text-[#9AA0A6] mb-2">Сообщение</p>
                      <p className="text-[#E3E3E3] whitespace-pre-wrap leading-relaxed">{selectedAppeal.message}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Verdicts */}
                {verdicts.length > 0 && (
                  <Card className="bg-[#1E1F20] border-[#282A2C]">
                    <CardHeader className="px-6 py-4 border-b border-[#282A2C]">
                      <CardTitle className="text-base text-[#E3E3E3] flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#8AB4F8]" />
                        Текущие вердикты
                        <Badge className="bg-[#282A2C] text-[#9AA0A6] border-0 ml-auto">
                          {verdicts.length}/5
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      {verdicts.map((v: Verdict, idx: number) => {
                        const config = verdictConfig[v.verdict] || verdictConfig.insufficient_evidence;
                        const Icon = config.icon;
                        return (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}`}
                          >
                            <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={`font-medium ${config.color}`}>{config.label}</p>
                                <span className="text-xs text-[#9AA0A6]">&middot;</span>
                                <span className="text-xs text-[#9AA0A6]">{v.username}</span>
                              </div>
                              {v.reason && (
                                <p className="text-sm text-[#9AA0A6] line-clamp-2">{v.reason}</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Submit Verdict */}
                {hasVoted ? (
                  <Card className="bg-[#1E1F20] border-[#282A2C]">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                      <p className="text-[#E3E3E3] font-medium">Ваш вердикт учтён</p>
                      <p className="text-sm text-[#9AA0A6] mt-1">Вы уже голосовали за это обращение</p>
                    </CardContent>
                  </Card>
                ) : (selectedAppeal.verdictsCount || 0) >= 5 ? (
                  <Card className="bg-[#1E1F20] border-[#282A2C]">
                    <CardContent className="p-6 text-center">
                      <Loader2 className="h-12 w-12 mx-auto mb-3 text-[#8AB4F8] animate-pulse" />
                      <p className="text-[#E3E3E3] font-medium">Ожидается решение администрации</p>
                      <p className="text-sm text-[#9AA0A6] mt-1">5 вердиктов уже собрано</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-[#1E1F20] border-[#282A2C]">
                    <CardHeader className="px-6 py-4 border-b border-[#282A2C]">
                      <CardTitle className="text-base text-[#E3E3E3] flex items-center gap-2">
                        <Send className="h-4 w-4 text-[#8AB4F8]" />
                        Вынести вердикт
                      </CardTitle>
                      <CardDescription className="text-[#9AA0A6]">
                        Ваше решение повлияет на итоговое решение
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <RadioGroup value={verdict} onValueChange={setVerdict} className="space-y-2">
                        {Object.entries(verdictConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center">
                            <RadioGroupItem 
                              value={key} 
                              id={key} 
                              className="peer-data-[state=checked]:border-[#8AB4F8] peer-data-[state=checked]:bg-[#8AB4F8] border-[#3C4043]" 
                            />
                            <Label 
                              htmlFor={key} 
                              className="flex items-center gap-3 ml-3 cursor-pointer py-2 flex-1"
                            >
                              <config.icon className={`h-5 w-5 ${config.color}`} />
                              <span className={`${config.color} font-medium`}>{config.label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      <div>
                        <Label htmlFor="reason" className="text-[#9AA0A6] text-sm mb-2 block">
                          Причина (необязательно)
                        </Label>
                        <Textarea
                          id="reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Обоснуйте ваш вердикт..."
                          className="bg-[#282A2C] border-[#3C4043] text-[#E3E3E3] placeholder:text-[#6B9DFC]/50 focus:border-[#8AB4F8] min-h-[100px]"
                        />
                      </div>

                      <Button
                        onClick={handleSubmitVerdict}
                        disabled={submitVerdictMutation.isPending}
                        className="w-full bg-[#8AB4F8] hover:bg-[#7AA4E8] text-[#131314] font-medium h-11"
                      >
                        {submitVerdictMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Отправка...
                          </>
                        ) : (
                          "Отправить вердикт"
                        )}
                      </Button>

                      {submitVerdictMutation.isError && (
                        <div className="text-red-400 text-sm text-center p-3 bg-red-500/10 rounded-lg">
                          Ошибка: {(submitVerdictMutation.error as any)?.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#1E1F20] border border-[#282A2C] flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-[#6B9DFC] opacity-50" />
                  </div>
                  <p className="text-[#9AA0A6] text-lg">Выберите жалобу для рассмотрения</p>
                  <p className="text-[#6B9DFC] text-sm mt-2">Нажмите на обращение из списка</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}