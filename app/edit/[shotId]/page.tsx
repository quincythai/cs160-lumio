"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAtom } from "jotai";
import { shotsAtom, type Shot } from "@/lib/atoms";
import { projectsAtom } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function EditShotPage() {
  const params = useParams();
  const shotId = params?.shotId as string | undefined;
  const router = useRouter();
  const [allShots, setAllShots] = useAtom(shotsAtom);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [vignette, setVignette] = useState<number>(0);
  const [prevEditedUrl, setPrevEditedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialOriginalUrl, setInitialOriginalUrl] = useState<string | null>(null);
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const PRESETS_STORAGE_KEY = "lumio_presets_v1";
  const PROJECTS_STORAGE_KEY = "lumio_projects_v2";

  type Preset = {
    id: string;
    name: string;
    brightness: number;
    saturation: number;
    vignette: number;
    custom?: boolean;
  };

  const defaultPresets: Preset[] = [
    { id: "natural", name: "Natural", brightness: 50, saturation: 50, vignette: 0 },
    { id: "bw", name: "Black-White", brightness: 100, saturation: 0, vignette: 10 },
    { id: "custom1", name: "Custom1", brightness: 110, saturation: 140, vignette: 8 },
  ];

  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(PRESETS_STORAGE_KEY) : null;
      if (raw) {
        return JSON.parse(raw) as Preset[];
      }
    } catch (_e) {
      // ignore
    }
    return defaultPresets;
  });

  const [projects, setProjects] = useAtom(projectsAtom);

  // keep a ref to the edited preview img element for sizing when saving
  const editedImgRef = useRef<HTMLImageElement | null>(null);

  // Find shot anywhere in the projects map
  const { shot, projectId } = useMemo(() => {
    if (!shotId) return { shot: null as Shot | null, projectId: null as string | null };
    for (const pid of Object.keys(allShots)) {
      const found = allShots[pid].find((s) => s.id === shotId);
      if (found) return { shot: found, projectId: pid };
    }
    return { shot: null as Shot | null, projectId: null as string | null };
  }, [allShots, shotId]);

  const replaceWithFile = (file?: File) => {
    if (!file || !shotId || !projectId) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAllShots((prev) => {
        const prevList = prev[projectId] ?? [];
        const nextList = prevList.map((s) => (s.id === shotId ? { ...s, url: dataUrl } : s));
        return { ...prev, [projectId]: nextList };
      });
      // when user replaces the file, reset sliders and clear previous generated state
      setBrightness(100);
      setSaturation(100);
      setVignette(0);
      setPrevEditedUrl(null);
    };
    reader.readAsDataURL(file);
  };

  // Apply current sliders to a canvas and return dataURL (used for Save and simulated Generate)
  const renderWithFiltersToDataUrl = async (sourceUrl: string, extraFilters = "") => {
    return new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        // apply CSS-like filters via ctx.filter
        ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) ${extraFilters}`.trim();
        ctx.drawImage(img, 0, 0, w, h);

        // apply vignette as a radial gradient overlay
        if (vignette > 0) {
          const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 1.2);
          // vignette intensity mapped to alpha
          const alpha = Math.min(0.9, vignette / 100);
          grad.addColorStop(0, `rgba(0,0,0,0)`);
          grad.addColorStop(1, `rgba(0,0,0,${alpha})`);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);
        }

        const dataUrl = canvas.toDataURL("image/png");
        resolve(dataUrl);
      };
      img.onerror = () => resolve(null);
      img.src = sourceUrl;
    });
  };

  // Save current slider edits into the shot (persist)
  // Save edits locally to the preview (does NOT modify saved shots)
  const saveEditsToPreview = async () => {
    if (!shot || !shot.url) return;
    // preserve previous edited preview so Undo can restore it
    setPrevEditedUrl(editedPreviewUrl ?? shot.url);
    // Use the original image as the rendering source to avoid re-applying
    // previously baked edits (which would make the effect more dramatic).
    const source = initialOriginalUrl ?? shot.url;
    const dataUrl = await renderWithFiltersToDataUrl(source);
    if (!dataUrl) return;
    setEditedPreviewUrl(dataUrl);
  };

  // Simulate AI generation: store previous edited url and replace with a generated variant
  const simulateGenerate = async () => {
    if (!shot || !shot.url) return;
    setIsGenerating(true);
    // preserve previous edited preview
    setPrevEditedUrl(editedPreviewUrl ?? shot.url ?? null);
    // simulate generation from the current edited preview (or original if none)
    const source = editedPreviewUrl ?? shot.url!;
    const generated = await renderWithFiltersToDataUrl(source, "blur(0px)");
    if (generated) {
      setEditedPreviewUrl(generated);
    }
    setIsGenerating(false);
  };

  const undoGenerate = () => {
    if (!prevEditedUrl) return;
    setEditedPreviewUrl(prevEditedUrl);
    setPrevEditedUrl(null);
  };

  // Add current preview (or url) to a chosen project (prompt-based chooser)
  const addToProjectFlow = (url?: string | null) => {
    if (!url) {
      alert("No image to add.");
      return;
    }
    try {
      if (!projects || projects.length === 0) {
        alert("No projects found. Create a project first in Saved.");
        return;
      }
      const list = projects.map((p) => `${p.name} (${p.id})`).join("\n");
      const pick = prompt(`Choose a project to save to by typing its id:\n\n${list}`, projects[0].id);
      if (!pick) return;
      const found = projects.find((p) => p.id === pick);
      if (!found) {
        alert("Project id not found.");
        return;
      }

      const newShot = {
        id: crypto.randomUUID(),
        url: url,
        imageUrl: url,
        title: "",
        year: "",
        timestamp: new Date().toISOString(),
        notes: "",
      } as any;

      // Prepare updated projects list and attempt to persist to storage first.
      const nextProjects = projects.map((p) =>
        p.id === found.id ? { ...p, shots: [...p.shots, newShot], updatedAt: new Date().toISOString() } : p
      );

      try {
        // try writing to localStorage to detect quota issues early
        const serialized = JSON.stringify(nextProjects);
        try {
          localStorage.setItem(PROJECTS_STORAGE_KEY, serialized);
        } catch (err) {
          // storage quota exceeded or other localStorage write error
          console.error("Failed to persist projects to localStorage:", err);
          alert(
            "Unable to save project: local storage quota exceeded. Try removing some saved projects or images and try again."
          );
          return;
        }

        // If storage succeeded, update the atom so the UI state reflects the change.
        setProjects(nextProjects);

        // Also keep shotsAtom in sync for other components using it
        setAllShots((prev: Record<string, any>) => {
          const prevList = prev[found.id] ?? [];
          return { ...prev, [found.id]: [...prevList, newShot] };
        });
      } catch (err) {
        console.error("Failed to prepare project save:", err);
        alert("Failed to save to project.");
      }

      alert(`Saved to project "${found.name}".`);
    } catch (err) {
      console.error(err);
      alert("Failed to save to project.");
    }
  };

  // reset sliders when the shotId (selected shot) changes
  // we intentionally do NOT clear `prevEditedUrl` when the image URL changes
  // so Undo can restore the previous generated version after `simulateGenerate`.
  useEffect(() => {
    setBrightness(100);
    setSaturation(100);
    setVignette(0);
    setPrevEditedUrl(null);
    // capture the original image URL when entering this shot edit page
    setInitialOriginalUrl(shot?.url ?? null);
    setEditedPreviewUrl(shot?.url ?? null);
  }, [shotId]);

  // persist presets when they change
  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (_e) {}
  }, [presets]);

  if (!shotId) {
    return <div className="p-8">No shot specified.</div>;
  }

  if (!shot) {
    return (
      <div className="p-8">
        <PageHeader title="Edit shot" />
        <p className="mt-6">Shot not found. It may have been deleted.</p>
        <div className="mt-4">
          <Button onClick={() => router.push("/saved")} className="mr-2">
            Back to Saved
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Edit shot" />

      <div className="mt-8 w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Original */}
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Original</h3>
            <div className="border p-4 rounded bg-white">
              <img src={initialOriginalUrl ?? shot.url} alt="Original" className="w-full h-56 object-cover rounded" />
            </div>
          </div>

          {/* Edited */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium mb-2">Edited</h3>
              <div className="flex gap-2">
                <Button onClick={() => addToProjectFlow(editedPreviewUrl ?? shot.url)}>Add to Project</Button>
              </div>
            </div>

            <div className="border p-4 rounded bg-white relative">
              <img
                ref={editedImgRef}
                src={editedPreviewUrl ?? shot.url}
                alt="Edited preview"
                className="w-full h-56 object-contain rounded"
                style={{
                  filter: `brightness(${brightness}%) saturate(${saturation}%)`,
                }}
              />

              {/* vignette overlay */}
              {vignette > 0 && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 8,
                    pointerEvents: "none",
                    background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,${Math.min(
                      0.9,
                      vignette / 100
                    )}) 100%)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Full-width controls (sliders + presets + actions) */}
        <div className="mt-8 bg-white border rounded p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Brightness</label>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Saturation</label>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Vignette</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vignette}
                    onChange={(e) => setVignette(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 font-medium">Presets</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <div key={p.id} className="relative">
                    <button
                      className="px-3 py-1 rounded bg-gray-200"
                      onClick={() => {
                        setBrightness(p.brightness);
                        setSaturation(p.saturation);
                        setVignette(p.vignette);
                      }}
                    >
                      {p.name}
                    </button>
                    {p.custom && (
                      <button
                        title="Delete preset"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPresets((prev) => {
                            const next = prev.filter((x) => x.id !== p.id);
                            try {
                              localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next));
                            } catch (_e) {}
                            return next;
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="px-3 py-1 rounded bg-green-200 ml-2"
                  onClick={() => {
                    // Save current slider settings as a custom preset
                    const name = prompt("Preset name:");
                    if (!name) return;
                    const newPreset: Preset = {
                      id: crypto.randomUUID(),
                      name,
                      brightness,
                      saturation,
                      vignette,
                      custom: true,
                    };
                    setPresets((prev) => {
                      const next = [...prev, newPreset];
                      try {
                        localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(next));
                      } catch (_e) {}
                      return next;
                    });
                  }}
                >
                  + Save settings
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button onClick={simulateGenerate} disabled={isGenerating}>
                  {isGenerating ? "Generating…" : "Generate"}
                </Button>
                <div className="flex gap-2 mt-2">
                  <Button onClick={saveEditsToPreview}>Save Image</Button>
                  <Button onClick={() => { setBrightness(100); setSaturation(100); setVignette(0); setEditedPreviewUrl(initialOriginalUrl ?? shot.url ?? null); setPrevEditedUrl(null); }} variant="outline">
                    Reset
                  </Button>
                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      if (!prevEditedUrl) return;
                      undoGenerate();
                    }}
                    className={`ml-2 ${!prevEditedUrl ? "opacity-50" : ""}`}
                  >
                    Undo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Free-text prompt area */}
        <div className="mt-6 w-full">
          <label className="block font-medium mb-2">Tell us what you are going for</label>
          <div className="flex items-center gap-2">
            <input className="flex-1 p-3 rounded border bg-white" placeholder="Describe the look (e.g. brighter, softer shadows)" />
            <button className="px-4 py-2 rounded bg-coral text-white" style={{ backgroundColor: '#e26d5c' }}>→</button>
          </div>
        </div>

        {/* AI-generated graph / metrics (placeholder) - below controls */}
        <div className="mt-8 border rounded p-6 bg-white">
          <h4 className="font-medium mb-2">Generated Graph / Metrics</h4>
          <div className="h-40 border-dashed border-2 border-gray-200 rounded flex items-center justify-center text-gray-400">
            AI-generated graph will appear here (placeholder)
          </div>
        </div>
      </div>
    </div>
  );
}
