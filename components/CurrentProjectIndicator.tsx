"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { projectsAtom, currentProjectIdAtom } from "@/lib/store";

export default function CurrentProjectIndicator() {
  const router = useRouter();
  const projects = useAtomValue(projectsAtom);
  const currentProjectId = useAtomValue(currentProjectIdAtom);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  if (!currentProject) {
    return null; // Don't show if no project selected
  }

  return (
    <button
      onClick={() => router.push(`/saved/${currentProjectId}`)}
      className="px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer font-sans"
      style={{
        backgroundColor: "#472d30",
        color: "#ffe1a8",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs opacity-70 whitespace-nowrap">
          Current Project:
        </span>
        <span className="font-semibold text-sm whitespace-nowrap">
          {currentProject.name}
        </span>
        <span className="text-xs opacity-70 whitespace-nowrap">
          ({currentProject.shots.length} shot
          {currentProject.shots.length !== 1 ? "s" : ""})
        </span>
      </div>
    </button>
  );
}
