"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAtom } from "jotai";
import { shotsAtom, SHOTS_STORAGE_KEY, type Shot } from "@/lib/atoms";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string | undefined;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [allShots, setAllShots] = useAtom(shotsAtom);
  const shots = projectId ? allShots[projectId] ?? [] : [];

  // load global shots map from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SHOTS_STORAGE_KEY);
      if (raw) {
        setAllShots(JSON.parse(raw) as Record<string, Shot[]>);
      }
    } catch (_e) {
      // ignore
    }
  }, [setAllShots]);

  // persist global shots map when it changes
  useEffect(() => {
    try {
      localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(allShots));
    } catch (_e) {
      // ignore
    }
  }, [allShots]);
  // Read projects from localStorage to map id -> name for display
  const STORAGE_KEY = "lumio_projects_v1";
  const [projectName, setProjectName] = useState<string | undefined>(undefined);

  // load project name from storage on mount and when storage changes
  React.useEffect(() => {
    const loadName = () => {
      if (!projectId) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const projects = JSON.parse(raw) as Array<{ id: string; name: string }>;
          const found = projects.find((p) => p.id === projectId);
          if (found) setProjectName(found.name);
          else setProjectName(projectId);
        } else {
          setProjectName(projectId);
        }
      } catch (_e) {
        setProjectName(projectId);
      }
    };

    loadName();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadName();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [projectId]);

  const addShot = () => {
    // trigger file picker
    fileInputRef.current?.click();
  };

  // dialog state for showing a larger image
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  const handleFile = (file?: File) => {
    if (!file || !projectId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newShot: Shot = { id: crypto.randomUUID(), url: dataUrl };
      setAllShots((prev: Record<string, Shot[]>) => {
        const prevList = prev[projectId] ?? [];
        return { ...prev, [projectId]: [...prevList, newShot] };
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-10 space-y-8" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Saved shots" />
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-plum">
          Project: {projectName ?? projectId}
        </h1>

        <Button onClick={addShot} className="bg-coral text-white hover:bg-wine" style={{ backgroundColor: "#e26d5c" }}>
          + Add Shot
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {/* Shots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shots.length === 0 && (
          <p className="text-wine text-lg">No shots yet. Click “Add Shot”.</p>
        )}

        {shots.map((shot: Shot) => (
          <Card
            key={shot.id}
            className="p-2 border-2 border-sage hover:border-coral cursor-pointer transition flex flex-col items-stretch h-48"
            onClick={() => {
              // open dialog with full-size image
              setSelectedShot(shot);
              setDialogOpen(true);
            }}
          >
            {shot.url ? (
              <div className="flex-1 overflow-hidden rounded">
                <img
                  src={shot.url}
                  alt="Shot"
                  className="w-full h-36 object-cover rounded"
                />
              </div>
            ) : (
              <div className="text-center text-wine flex-1 flex items-center justify-center">
                <div>
                  <div className="text-xl font-heading mb-2">Empty Shot</div>
                  <div className="text-sm text-plum">Click to edit</div>
                </div>
              </div>
            )}

            {/* Controls: Edit & Delete - stop propagation so they don't open the dialog */}
            <div className="mt-2 flex items-center justify-between gap-2">
              <Button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  // navigate to edit page (to be implemented)
                  if (!projectId) return;
                  router.push(`/edit/${shot.id}`);
                }}
                className="text-plum border bg-sage hover:bg-coral hover:bg-gray-100"
              >
                Edit
              </Button>

              <Button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  if (!projectId) return;
                  const ok = confirm("Delete this shot? This cannot be undone.");
                  if (!ok) return;
                  setAllShots((prev: Record<string, Shot[]>) => {
                    const prevList = prev[projectId] ?? [];
                    const nextList = prevList.filter((s) => s.id !== shot.id);
                    return { ...prev, [projectId]: nextList };
                  });
                  // close dialog if the deleted shot was selected
                  if (selectedShot?.id === shot.id) {
                    setSelectedShot(null);
                    setDialogOpen(false);
                  }
                }}
                className="text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Image dialog popout */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] p-4 bg-transparent shadow-none"
          showCloseButton={true}
        >
          <div className="flex flex-col items-center justify-center">
            <DialogTitle className="sr-only">Shot preview</DialogTitle>
            {selectedShot?.url && (
              <img
                src={selectedShot.url}
                alt="Shot large"
                className="max-w-[90vw] max-h-[80vh] object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
