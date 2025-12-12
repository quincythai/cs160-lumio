"use client";

import { useEffect, use, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { X, Download, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { projectsAtom, currentProjectIdAtom } from "@/lib/store";
import { shotsAtom, SHOTS_STORAGE_KEY } from "@/lib/atoms";

export default function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();

  const projects = useAtomValue(projectsAtom);
  const [currentProjectId, setCurrentProjectId] = useAtom(currentProjectIdAtom);
  const [, setProjects] = useAtom(projectsAtom);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const [allShots, setAllShots] = useAtom(shotsAtom);
  const shots = project?.shots || [];

  const [editedTitle, setEditedTitle] = useState("");

  const formatShotTimestamp = (ts: any) => {
    if (!ts) return "";
    const s = String(ts);
    // ISO-like timestamps (e.g. 2025-12-05T20:18:36.276Z)
    const isoRegex = /^\d{4}-\d{2}-\d{2}T/;
    if (isoRegex.test(s)) {
      try {
        return `Saved: ${new Date(s).toLocaleString()}`;
      } catch (_e) {
        return s;
      }
    }

    // Film time like HH:MM:SS or MM:SS
    const filmTimeRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
    if (filmTimeRegex.test(s)) {
      return `Film time: ${s}`;
    }

    // Fallback: return as-is
    return s;
  };

  // Auto-set current project when page loads
  useEffect(() => {
    if (projectId && currentProjectId !== projectId) {
      setCurrentProjectId(projectId);
    }
  }, [projectId, currentProjectId, setCurrentProjectId]);

  // Initialize editedTitle when project changes and not editing
  useEffect(() => {
    if (project && !isEditingTitle) {
      setEditedTitle(project.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isEditingTitle]);

  const handleNotesChange = (shotId: string, notes: string) => {
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              shots: p.shots.map((shot) =>
                shot.id === shotId ? { ...shot, notes } : shot,
              ),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  const handleRemoveShot = (shotId: string) => {
    if (!project) return;

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              shots: p.shots.filter((shot) => shot.id !== shotId),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  };

  const handleTitleEdit = () => {
    if (!project) return;
    setIsEditingTitle(true);
    setEditedTitle(project.name);
  };

  const handleTitleSave = () => {
    if (!project || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              name: editedTitle.trim(),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    if (project) {
      setEditedTitle(project.name);
    }
  };

  const handleExport = () => {
    if (!project) return;

    const exportData = {
      projectName: project.name,
      projectId: project.id,
      updatedAt: project.updatedAt,
      exportedAt: new Date().toISOString(),
      shots: project.shots.map((shot) => ({
        id: shot.id,
        title: shot.title,
        year: shot.year,
        timestamp: shot.timestamp,
        imageUrl: shot.imageUrl,
        notes: shot.notes || "",
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name.replace(/[^a-z0-9]/gi, "_")}_export_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
        <PageHeader title="Saved shots" path="/saved" />
        <div className="p-8">
          <p className="text-wine text-lg">Project not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Saved shots" path="/saved" />
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleSave();
                    } else if (e.key === "Escape") {
                      handleTitleCancel();
                    }
                  }}
                  className="text-3xl font-heading"
                  style={{ color: "#472d30" }}
                  autoFocus
                />
                <Button
                  onClick={handleTitleSave}
                  className="px-3 py-1 text-sm"
                  style={{ backgroundColor: "#472d30", color: "#ffe1a8" }}
                >
                  Save
                </Button>
                <Button
                  onClick={handleTitleCancel}
                  className="px-3 py-1 text-sm bg-transparent border"
                  style={{ borderColor: "#472d30", color: "#472d30" }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  className="text-3xl font-heading text-plum cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleTitleEdit}
                >
                  {project.name}
                </h1>
                <button
                  onClick={handleTitleEdit}
                  className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  style={{ color: "#472d30" }}
                  aria-label="Edit project name"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            )}
            <Button
              onClick={handleExport}
              className="flex items-center gap-2"
              style={{ backgroundColor: "#472d30", color: "#ffe1a8" }}
            >
              <Download size={18} />
              Export
            </Button>
            {projects.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "#472d30" }}>
                  Switch to:
                </span>
                <Select
                  value={currentProjectId || undefined}
                  onValueChange={(value) => {
                    setCurrentProjectId(value);
                    router.push(`/saved/${value}`);
                  }}
                >
                  <SelectTrigger className="w-[200px] bg-white">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Shots Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {shots.length === 0 && (
            <p className="text-wine text-lg">
              No shots yet. Add shots from search results.
            </p>
          )}

          {shots.map((shot) => {
            const atomShot = (allShots[projectId] ?? []).find(
              (s: any) => String(s.id) === String(shot.id),
            );
            const src =
              atomShot?.imageUrl ??
              (shot as any).imageUrl ??
              (shot as any).url ??
              "";
            const f = atomShot?.filters ?? (shot as any).filters;
            const isData = typeof src === "string" && src.startsWith("data:");
            const filterStyle =
              !isData && f
                ? `brightness(${f.brightness}%) saturate(${f.saturation}%)`
                : undefined;

            return (
              <Card
                key={shot.id}
                className="overflow-hidden border-2 hover:shadow-lg transition-shadow bg-white relative"
                style={{ borderColor: "#472d30" }}
              >
                <button
                  onClick={() => handleRemoveShot(shot.id)}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-colors cursor-pointer"
                  style={{ color: "#472d30" }}
                  aria-label="Remove shot from project"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => {
                    const pid = projectId || "unsaved";

                    // Ensure there is a normalized copy of this shot in shotsAtom
                    const atomList = allShots[pid] ?? [];
                    const existsInAtom = atomList.find(
                      (s: any) => String(s.id) === String(shot.id),
                    );
                    if (!existsInAtom) {
                      // normalize image path and fields
                      let src =
                        (shot as any).imageUrl ?? (shot as any).url ?? "";
                      if (
                        src &&
                        !src.startsWith("/") &&
                        !src.startsWith("http")
                      ) {
                        src = `/shot-database/images/${src}`;
                      }

                      const normalized = {
                        id: String(shot.id),
                        url: src,
                        imageUrl: src,
                        title: shot.title ?? "",
                        year: shot.year !== undefined ? String(shot.year) : "",
                        timestamp: shot.timestamp ?? new Date().toISOString(),
                        notes: shot.notes ?? "",
                        ...((shot as any).filters
                          ? { filters: (shot as any).filters }
                          : {}),
                      } as any;

                      const next = {
                        ...allShots,
                        [pid]: [...atomList, normalized],
                      };
                      try {
                        localStorage.setItem(
                          SHOTS_STORAGE_KEY,
                          JSON.stringify(next),
                        );
                      } catch (err) {
                        console.warn(
                          "Failed to persist shots to localStorage",
                          err,
                        );
                      }
                      setAllShots(next);
                    }

                    // Navigate to editor in all cases
                    router.push(`/edit/${String(shot.id)}`);
                  }}
                  className="absolute top-2 left-2 z-10 p-2 rounded-full bg-[#472d30] text-[#ffe1a8] hover:bg-white hover:text-[#472d30] shadow-md transition-colors cursor-pointer"
                  aria-label="Edit shot"
                >
                  Edit
                </button>
                <div className="relative w-full aspect-video bg-gray-200">
                  <Image
                    src={src}
                    alt={shot.title}
                    fill
                    className="object-cover"
                    unoptimized
                    style={filterStyle ? { filter: filterStyle } : undefined}
                  />
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "#472d30" }}
                      >
                        {shot.title}
                      </h3>
                      <span
                        className="text-sm"
                        style={{ color: "#472d30", opacity: 0.7 }}
                      >
                        {shot.year}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: "#472d30" }}>
                    {formatShotTimestamp(atomShot?.timestamp ?? shot.timestamp)}
                  </span>
                  <div className="mt-2">
                    <Textarea
                      placeholder="Add notes about this shot..."
                      value={shot.notes || ""}
                      onChange={(e) =>
                        handleNotesChange(shot.id, e.target.value)
                      }
                      className="w-full min-h-20 text-sm resize-none"
                      style={{
                        borderColor: "#472d30",
                        color: "#472d30",
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
