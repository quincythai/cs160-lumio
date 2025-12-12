import { atomWithStorage } from "jotai/utils";
import { atom } from "jotai";

export type Shot = {
  id: string;
  imageUrl: string;
  title: string;
  year: number;
  timestamp: string;
  notes?: string;
};

export type Project = {
  id: string;
  name: string;
  updatedAt: string;
  shots: Shot[];
};

// Default project for initial state
const DEFAULT_PROJECT_ID = "default-project";
const createDefaultProject = (): Project => ({
  id: DEFAULT_PROJECT_ID,
  name: "My Project",
  updatedAt: new Date().toISOString(),
  shots: [],
});

// Projects atom with localStorage persistence
// Initialize with default project if empty
export const projectsAtom = atomWithStorage<Project[]>("lumio_projects_v2", [
  createDefaultProject(),
]);

// Current project ID atom with localStorage persistence
// Initialize with default project ID
export const currentProjectIdAtom = atomWithStorage<string | null>(
  "lumio_current_project",
  DEFAULT_PROJECT_ID,
);

export const referenceImageAtom = atom<string>("");
