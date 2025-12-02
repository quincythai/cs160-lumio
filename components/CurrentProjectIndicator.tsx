"use client";

import { useAtomValue } from 'jotai';
import { useRouter } from 'next/navigation';
import { projectsAtom, currentProjectIdAtom } from '@/lib/store';

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
      className="fixed top-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
      style={{
        backgroundColor: '#472d30',
        color: '#ffe1a8',
      }}
    >
      <div className="flex flex-col items-start gap-1">
        <span className="text-xs opacity-70">Current Project</span>
        <span className="font-semibold text-sm">{currentProject.name}</span>
        <span className="text-xs opacity-70">
          {currentProject.shots.length} shot
          {currentProject.shots.length !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}

