import { atom } from "jotai";

export type Shot = { id: string; url?: string; modifiedAt?: string };

// Global shots store keyed by projectId
export const SHOTS_STORAGE_KEY = "lumio_shots_v1";

export const shotsAtom = atom<Record<string, Shot[]>>({});

// (We persist from components using this atom.)
