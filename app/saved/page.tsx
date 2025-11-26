"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

type Project = {
  id: string;
  name: string;
  updatedAt: string;
};

export default function SavedPage() {
  const router = useRouter();

  // Persistent client-side store using localStorage (replace with backend later)
  const STORAGE_KEY = "lumio_projects_v1";

  const seedProjects: Project[] = [
    { id: "p1", name: "My First Project", updatedAt: "2025-01-01" },
    { id: "p2", name: "Nature shots", updatedAt: "2025-01-12" },
  ];

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Project[];
      }
    } catch (e) {
      // ignore parse errors
    }
    return seedProjects;
  });

  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const createProject = () => {
    if (!newProjectName.trim()) return;

    const newId = crypto.randomUUID();

    const newProject: Project = {
      id: newId,
      name: newProjectName,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    // Update state and persist immediately so navigation back shows the new project
    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    } catch (e) {}
    setNewProjectName("");

    // Navigate to project page
    router.push(`/saved/${newId}`);
  };

  const deleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    if (editingProjectId === projectId) {
      cancelEdit();
    }
  };

  const startEdit = (projectId: string, currentName: string) => {
    setEditingProjectId(projectId);
    setEditName(currentName);
  };

  const saveEdit = () => {
    if (!editingProjectId) return;
    if (!editName.trim()) return;

    const updated = projects.map((p) =>
      p.id === editingProjectId ? { ...p, name: editName, updatedAt: new Date().toISOString().slice(0, 10) } : p
    );
    setProjects(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
    setEditingProjectId(null);
    setEditName("");
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditName("");
  };

  return (
    <div className="p-10 max-w-7xl mx-auto" style={{ backgroundColor: "#ffe1a8" }}>
      <div className="p-6">
        <button
          onClick={() => router.push("/")}
          className="text-xl hover:underline"
          style={{ color: "#472d30" }}
        >
          Lumio
        </button>
        <span className="text-xl" style={{ color: "#472d30" }}>
          {" "}| Saved shots
        </span>
        <hr className="mt-4 mb-8" style={{ borderColor: "#472d30" }} />
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-plum">Your Projects</h1>
          <p className="text-sm text-wine mt-1">Saved shot collections and moodboards</p>
        </div>

        <div className="flex items-center gap-3">
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="hidden md:block w-72"
            />
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-coral text-white hover:bg-wine">+ New Project</Button>
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
                <Button className="bg-coral text-white w-full" onClick={createProject}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.filter(p => p.name.toLowerCase().includes(searchTerm.trim().toLowerCase())).map((project) => (
          <Card
            key={project.id}
            className="p-6 border-2 border-sage hover:border-coral transition transform hover:-translate-y-1 rounded-lg shadow-sm bg-white cursor-pointer hover:shadow-md"
            onClick={() => router.push(`/saved/${project.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/saved/${project.id}`);
              }
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {editingProjectId === project.id ? (
                  <div>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full mb-3"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        className="bg-coral text-white px-3 py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveEdit();
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        className="bg-transparent border border-sage text-sage px-3 py-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEdit();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-heading text-plum mb-2">{project.name}</h2>
                    <p className="text-sm text-wine">Last updated: {project.updatedAt}</p>
                  </>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  className="text-sm bg-red-600 text-white hover:bg-red-700 px-3 py-1"
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
                <Button
                  className="text-sm bg-transparent border border-sage text-sage hover:bg-sage/10 px-3 py-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(project.id, project.name);
                  }}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="mt-4 h-40 bg-sage/20 rounded overflow-hidden flex items-center justify-center text-wine">
              <span className="text-sm">No preview</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
