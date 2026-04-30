import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Settings } from "@/hooks/useSettings";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: Settings;
  setSettings: (updater: (s: Settings) => Settings) => void;
  hasChats: boolean;
  onClearChats: () => void;
};

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  setSettings,
  hasChats,
  onClearChats,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onCheckedChange={(v) => setSettings((s) => ({ ...s, reduceMotion: v }))}
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
              onCheckedChange={(v) => setSettings((s) => ({ ...s, compactMode: v }))}
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
              onCheckedChange={(v) => setSettings((s) => ({ ...s, notifications: v }))}
            />
          </div>

          {hasChats && (
            <div className="mt-4 pt-4 border-t border-[#282A2C]">
              <Button
                variant="ghost"
                onClick={onClearChats}
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
  );
}
