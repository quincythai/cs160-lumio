import { atom } from "jotai";

export type Shot = {
  id: string;
  url?: string;
  imageUrl?: string;
  title?: string;
  year?: string;
  timestamp?: string;
  notes?: string;
  [k: string]: any;
};

export const SHOTS_STORAGE_KEY = "lumio_shots_v1";

// Global shots store keyed by projectId
export const shotsAtom = atom<Record<string, Shot[]>>({});
