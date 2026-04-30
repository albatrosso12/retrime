import { useEffect, useState } from "react";

export type AppealStatus = "draft" | "sent";

export type Chat = {
  id: string;
  title: string;
  createdAt: number;
  status?: AppealStatus;
  sentAt?: number;
  draft?: {
    nickname?: string;
    faction?: string;
    contact?: string;
    category?: string;
    message?: string;
  };
};

const CHATS_STORAGE_KEY = "balkan-rules:chats";

let memoryChats: Chat[] = [];
let initialized = false;
const listeners = new Set<(chats: Chat[]) => void>();

function loadFromStorage(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Chat[];
  } catch {
    return [];
  }
}

function persist(chats: Chat[]) {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // ignore
  }
}

function emit() {
  for (const l of listeners) l(memoryChats);
}

export function useChats() {
  const [chats, setLocal] = useState<Chat[]>(() => {
    if (!initialized) {
      memoryChats = loadFromStorage();
      initialized = true;
    }
    return memoryChats;
  });

  useEffect(() => {
    const listener = (next: Chat[]) => setLocal(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setChats = (updater: Chat[] | ((prev: Chat[]) => Chat[])) => {
    const next =
      typeof updater === "function"
        ? (updater as (p: Chat[]) => Chat[])(memoryChats)
        : updater;
    memoryChats = next;
    persist(next);
    emit();
  };

  const createChat = (title?: string): Chat => {
    const next: Chat = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title ?? `Обращение №${memoryChats.length + 1}`,
      createdAt: Date.now(),
      status: "draft",
    };
    setChats([next, ...memoryChats]);
    return next;
  };

  const deleteChat = (id: string) => {
    setChats(memoryChats.filter((c) => c.id !== id));
  };

  const updateChat = (id: string, patch: Partial<Chat>) => {
    setChats(memoryChats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const clearChats = () => setChats([]);

  return { chats, setChats, createChat, deleteChat, updateChat, clearChats };
}
