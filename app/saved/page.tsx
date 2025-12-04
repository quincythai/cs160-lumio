"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { projectsAtom, currentProjectIdAtom, type Project } from "@/lib/store";
import { shotsAtom, SHOTS_STORAGE_KEY } from "@/lib/atoms";

export default function SavedPage() {
  const router = useRouter();
  const [projects, setProjects] = useAtom(projectsAtom);
  const [currentProjectId, setCurrentProjectId] = useAtom(currentProjectIdAtom);
  const [allShots] = useAtom(shotsAtom);

  const [newProjectName, setNewProjectName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const newId = crypto.randomUUID();

    const newProject: Project = {
      id: newId,
      name: newProjectName,
      updatedAt: new Date().toISOString(),
      shots: [],
    };

    // Update state (Jotai handles localStorage persistence)
    setProjects([...projects, newProject]);
    // Auto-set as current project
    setCurrentProjectId(newId);
    setNewProjectName("");

    // Navigate to project page
    router.push(`/saved/${newId}`);
  };

  const deleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    // Clear current project if it was deleted
    if (currentProjectId === projectId) {
      setCurrentProjectId(null);
    }
  };

  return (
    <div
      className="min-h-screen p-10 max-w-7xl mx-auto"
      style={{ backgroundColor: "#ffe1a8" }}
    >
      <PageHeader title="Saved shots" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-plum">Your Projects</h1>
          <p className="text-sm text-wine mt-1">
            Saved shot collections and moodboards
          </p>
        </div>
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "#472d30" }}>
              Switch to:
            </span>
            <Select
              value={currentProjectId || undefined}
              onValueChange={setCurrentProjectId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="hidden md:block w-72"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="text-white"
                style={{
                  backgroundColor: "#c9cba3",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#ffe1a8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#c9cba3";
                }}
              >
                + New Project
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Project</DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <Input
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full"
                />
              </div>

              <DialogFooter className="mt-4 flex flex-col items-stretch gap-3">
                <Button
                  className="bg-coral text-white w-full"
                  onClick={createProject}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects
          .filter((p) =>
            p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
          )
          .map((project) => (
            <Card
              key={project.id}
              className="p-6 border-2 border-sage hover:border-coral transition transform hover:-translate-y-1 rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md"
              onClick={() => {
                setCurrentProjectId(project.id);
                router.push(`/saved/${project.id}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCurrentProjectId(project.id);
                  router.push(`/saved/${project.id}`);
                }
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-heading text-plum mb-2">
                    {project.name}
                  </h2>
                  <p className="text-sm text-wine">
                    Last updated: {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    className="text-sm px-3 py-1"
                    style={{
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const confirmDelete = window.confirm(
                        `Delete project "${project.name}"? This action cannot be undone and will not be backed up.`
                      );
                      if (confirmDelete) deleteProject(project.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-4 h-40 rounded overflow-hidden">
                {project.shots.length === 0 ? (
                  <div className="h-full bg-sage/20 flex items-center justify-center text-wine">
                    <span className="text-sm">No shots yet</span>
                  </div>
                ) : (
                  <div className="h-full grid grid-cols-2 gap-1">
                    {project.shots.slice(0, 4).map((shot) => {
                      const atomShot = (allShots[project.id] ?? []).find((s: any) => String(s.id) === String(shot.id));
                      const src = atomShot?.imageUrl ?? (shot as any).imageUrl ?? (shot as any).url ?? "";
                      const f = atomShot?.filters ?? (shot as any).filters;
                      const isData = typeof src === "string" && src.startsWith("data:");
                      const filterStyle = !isData && f ? `brightness(${f.brightness}%) saturate(${f.saturation}%)` : undefined;
                      return (
                        <div key={shot.id} className="relative w-full h-full bg-gray-200">
                          <Image
                            src={src}
                            alt={shot.title}
                            fill
                            className="object-cover"
                            unoptimized
                            style={filterStyle ? { filter: filterStyle } : undefined}
                          />
                        </div>
                      );
                    })}
                    {project.shots.length > 4 && (
                      <div className="relative w-full h-full bg-sage/40 flex items-center justify-center">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "#472d30" }}
                        >
                          +{project.shots.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
