"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAtom } from "jotai";
import { shotsAtom, type Shot, SHOTS_STORAGE_KEY } from "@/lib/atoms";
import { projectsAtom, currentProjectIdAtom } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";

export default function EditShotPage() {
  const params = useParams();
  const shotId = params?.shotId as string | undefined;
  const router = useRouter();
  const [allShots, setAllShots] = useAtom(shotsAtom);
  const [brightness, setBrightness] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [vignette, setVignette] = useState<number>(0);
  const [prevEditedUrl, setPrevEditedUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [initialOriginalUrl, setInitialOriginalUrl] = useState<string | null>(
    null
  );
  const [editedPreviewUrl, setEditedPreviewUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<number>(Date.now());
  const pendingNavigationRef = useRef<string | null>(null);
  const originalRouterPushRef = useRef<
    ((href: string, options?: any) => void) | null
  >(null);
  const isConfirmingNavigationRef = useRef<boolean>(false);
  const PRESETS_STORAGE_KEY = "lumio_presets_v1";
  const PROJECTS_STORAGE_KEY = "lumio_projects_v2";

  // Track initial values to detect unsaved changes
  const initialBrightness = useRef<number>(100);
  const initialSaturation = useRef<number>(100);
  const initialVignette = useRef<number>(0);
  const initialEditedPreviewUrl = useRef<string | null>(null);

  type Preset = {
    id: string;
    name: string;
    brightness: number;
    saturation: number;
    vignette: number;
    custom?: boolean;
  };

  const defaultPresets: Preset[] = [
    {
      id: "natural",
      name: "Natural",
      brightness: 50,
      saturation: 50,
      vignette: 0,
    },
    {
      id: "bw",
      name: "Black-White",
      brightness: 100,
      saturation: 0,
      vignette: 10,
    },
    {
      id: "custom1",
      name: "Custom1",
      brightness: 110,
      saturation: 140,
      vignette: 8,
    },
  ];

  const [presets, setPresets] = useState<Preset[]>(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(PRESETS_STORAGE_KEY)
          : null;
      if (raw) {
        return JSON.parse(raw) as Preset[];
      }
    } catch (_e) {
      // ignore
    }
    return defaultPresets;
  });

  const [projects, setProjects] = useAtom(projectsAtom);
  const [currentProjectId] = useAtom(currentProjectIdAtom);

  const { shot } = useMemo(() => {
    if (!shotId) return { shot: null as Shot | null };
    for (const pid of Object.keys(allShots)) {
      const found = allShots[pid].find((s) => s.id === shotId);
      if (found) return { shot: found };
    }
    return { shot: null as Shot | null };
  }, [allShots, shotId]);

  // Apply current sliders to a canvas and return dataURL
  const renderWithFiltersToDataUrl = async (
    sourceUrl: string,
    extraFilters = ""
  ) => {
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
        ctx.filter =
          `brightness(${brightness}%) saturate(${saturation}%) ${extraFilters}`.trim();
        ctx.drawImage(img, 0, 0, w, h);

        // apply vignette as a radial gradient overlay
        if (vignette > 0) {
          const grad = ctx.createRadialGradient(
            w / 2,
            h / 2,
            0,
            w / 2,
            h / 2,
            Math.max(w, h) / 1.2
          );
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

  // Fallback: wrap an external image URL in an SVG that applies CSS filters.
  // This avoids touching pixel data on a tainted canvas and lets the browser render a filtered image.
  const makeSvgFilterDataUrl = (
    imageUrl: string,
    b: number,
    s: number,
    v: number
  ) => {
    const filterCss = `filter:brightness(${b}%) saturate(${s}%)`;
    const svg = `<?xml version='1.0' encoding='utf-8'?><svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800' viewBox='0 0 1200 800' preserveAspectRatio='xMidYMid slice'><style>img{${filterCss}}</style><image href='${imageUrl}' x='0' y='0' width='100%' height='100%' preserveAspectRatio='xMidYMid slice' style='${filterCss}'/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  // Convert image URL to data URL for AI processing
  const convertImageToDataUrl = async (imageUrl: string): Promise<string> => {
    // If it's already a data URL, return it
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    // Otherwise, fetch the image and convert to data URL
    try {
      // Handle relative URLs by converting to absolute
      const absoluteUrl = imageUrl.startsWith("/")
        ? `${window.location.origin}${imageUrl}`
        : imageUrl;

      const response = await fetch(absoluteUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === "string") {
            resolve(result);
          } else {
            reject(new Error("Failed to convert image to data URL"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`Failed to load image: ${error}`);
    }
  };

  // AI generation using Vertex AI: store previous edited url and replace with AI-edited image
  const generateWithAI = async () => {
    if (!shot || !shot.url || !promptText.trim()) {
      setErrorMessage("Please enter a prompt describing the edit you want.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    // preserve previous edited preview for undo
    setPrevEditedUrl(editedPreviewUrl ?? shot.url ?? null);

    try {
      // Get the current image to edit (use original or current edited preview)
      const sourceImageUrl = initialOriginalUrl ?? shot.url;

      // Convert image to data URL if needed
      const imageDataUrl = await convertImageToDataUrl(sourceImageUrl);

      // Create form data to send to API
      const formData = new FormData();
      formData.append("image", imageDataUrl);
      formData.append("prompt", promptText.trim());

      const response = await fetch("/api/edit-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Handle rate limit errors with a more user-friendly message
        if (response.status === 429 || errorData.code === "RATE_LIMIT") {
          throw new Error(
            errorData.error ||
              "Rate limit exceeded. Vertex AI is temporarily unavailable. Please wait a few minutes and try again."
          );
        }
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.editedImage) {
        throw new Error("No edited image received from API");
      }

      // Update the edited preview with the AI-generated image
      setEditedPreviewUrl(data.editedImage);
    } catch (error: any) {
      console.error("Error generating AI edit:", error);
      setErrorMessage(
        error.message || "Failed to generate AI edit. Please try again."
      );
      // Restore previous state on error
      if (prevEditedUrl) {
        setEditedPreviewUrl(prevEditedUrl);
        setPrevEditedUrl(null);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const undoGenerate = () => {
    if (!prevEditedUrl) return;
    setEditedPreviewUrl(prevEditedUrl);
    setPrevEditedUrl(null);
  };

  // Reset edits to original image and clear edited preview
  const resetEdits = () => {
    if (!shot) return;
    // Only reset sliders, keep the AI-edited preview if it exists
    setBrightness(100);
    setSaturation(100);
    setVignette(0);
    // Reset initial slider values to mark as "saved"
    initialBrightness.current = 100;
    initialSaturation.current = 100;
    initialVignette.current = 0;
    // Update timestamp to reflect the reset state
    setLastSavedTimestamp(Date.now());
  };

  // Add the current preview (or original) to the currently selected project
  const addToCurrentProject = async () => {
    // Determine if user has modified filter sliders from defaults
    const hasFilterChanges = brightness !== 100 || saturation !== 100 || vignette !== 0;

    let source: string | null = null;

    // If we have an AI-generated preview AND user has adjusted filters, bake filters on top of AI image
    if (editedPreviewUrl && editedPreviewUrl.startsWith("data:") && hasFilterChanges) {
      const baked = await renderWithFiltersToDataUrl(editedPreviewUrl);
      if (baked) {
        source = baked;
      } else {
        // Fallback: use SVG filter on the AI-generated image
        source = makeSvgFilterDataUrl(editedPreviewUrl, brightness, saturation, vignette);
      }
    }
    // If we have an AI-generated preview but NO filter changes, use it as-is
    else if (editedPreviewUrl && editedPreviewUrl.startsWith("data:")) {
      source = editedPreviewUrl;
    }
    // Otherwise bake from the original with current sliders
    else {
      const orig = initialOriginalUrl ?? shot?.url;
      if (!orig) {
        alert("No image to add.");
        return;
      }
      const baked = await renderWithFiltersToDataUrl(orig);
      if (baked) {
        source = baked;
      } else {
        source = makeSvgFilterDataUrl(orig, brightness, saturation, vignette);
      }
    }

    const pid = currentProjectId ?? null;
    if (!pid) {
      alert(
        "No current project selected. Select or create a project in Saved first."
      );
      return;
    }

    const newId = crypto.randomUUID();
    // Get the original unedited URL
    const originalUrl = initialOriginalUrl ?? shot?.url ?? "";
    const newShotFull = {
      id: newId,
      imageUrl: source,
      url: originalUrl,  // Always store the original URL so future edits preserve it
      title: "",
      year: "",
      timestamp: new Date().toISOString(),
      notes: "",
      ...(source.startsWith("data:")
        ? {}
        : { filters: { brightness, saturation, vignette } }),
    } as any;

    // Small metadata to store in the project (avoid saving large data URLs here)
    const newShotForProject = {
      id: newId,
      imageUrl: initialOriginalUrl ?? shot?.url ?? "",
      title: "",
      year: "",
      timestamp: new Date().toISOString(),
      notes: "",
    } as any;

    // Move any existing data-URL images from projects into shotsAtom to free project storage
    const nextAllShots = { ...allShots } as Record<string, any>;
    const cleanedProjects = projects.map((p) => {
      const nextShots = p.shots.map((s: any) => {
        try {
          if (
            typeof s.imageUrl === "string" &&
            s.imageUrl.startsWith("data:")
          ) {
            // ensure shotsAtom contains this image under the project's key
            nextAllShots[p.id] = nextAllShots[p.id] ?? [];
            const exists = nextAllShots[p.id].find(
              (x: any) => String(x.id) === String(s.id)
            );
            if (!exists) {
              nextAllShots[p.id].push({ ...s, url: s.imageUrl });
            }
            // replace project entry with lightweight reference (use original url if available)
            return { ...s, imageUrl: s.url ?? "" };
          }
        } catch (_e) {}
        return s;
      });
      return { ...p, shots: nextShots };
    });

    // append newShotForProject to the selected project's metadata
    const finalProjects = cleanedProjects.map((p) =>
      p.id === pid
        ? {
            ...p,
            shots: [...p.shots, newShotForProject],
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    // persist shotsAtom first (smaller data in projects helps avoid quota)
    const updatedAllShots = {
      ...nextAllShots,
      [pid]: [...(nextAllShots[pid] ?? []), newShotFull],
    } as Record<string, any>;
    setAllShots(updatedAllShots);
    try {
      localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(updatedAllShots));
    } catch (_e) {
      // ignore storage errors
    }

    // now update projectsAtom with the cleaned & appended metadata (should be much smaller)
    // As a safety, produce a minimized projects payload that removes any data URLs
    // and keeps only small metadata fields. This helps avoid localStorage quota errors.
    const minimizedProjects = finalProjects.map((p) => ({
      ...p,
      shots: (p.shots || []).map((s: any) => ({
        id: s.id,
        imageUrl:
          typeof s.imageUrl === "string" && s.imageUrl.startsWith("data:")
            ? s.url && typeof s.url === "string" && !s.url.startsWith("data:")
              ? s.url
              : ""
            : typeof s.imageUrl === "string"
            ? s.imageUrl
            : s.url && !String(s.url).startsWith("data:")
            ? s.url
            : "",
        title: s.title ?? "",
        year: s.year ?? "",
        timestamp: s.timestamp ?? new Date().toISOString(),
        notes: s.notes ?? "",
      })),
    }));

    try {
      // Quick writable check: try writing minimized payload to localStorage to detect quota issues early
      try {
        // Write to a temporary test key so we don't clobber the user's real projects value
        const testKey = PROJECTS_STORAGE_KEY + "_test";
        localStorage.setItem(testKey, JSON.stringify(minimizedProjects));
        // remove the test key after checking writability
        localStorage.removeItem(testKey);
      } catch (_e) {
        // If that fails, create an even smaller payload (drop imageUrl entirely)
        const tinyProjects = minimizedProjects.map((p) => ({
          ...p,
          shots: p.shots.map((s: any) => ({
            id: s.id,
            title: s.title,
            timestamp: s.timestamp,
          })),
        }));
        setProjects(tinyProjects as any);
        alert(
          "Saved minimal project metadata because localStorage quota was exceeded. Try clearing some large images in Saved to restore full thumbnails."
        );
        return;
      }

      setProjects(minimizedProjects as any);
    } catch (err) {
      console.error("Failed to update projects (quota?)", err);
      alert(
        "Unable to save to project: local storage quota exceeded. Try removing some saved projects or large images."
      );
      return;
    }

    alert("Saved to current project.");

    // Mark as saved - reset initial values to current state
    // This ensures the unsaved changes warning doesn't incorrectly appear
    initialBrightness.current = brightness;
    initialSaturation.current = saturation;
    initialVignette.current = vignette;
    initialEditedPreviewUrl.current = editedPreviewUrl;
    // Update timestamp to trigger hasUnsavedChanges recalculation
    setLastSavedTimestamp(Date.now());
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const brightnessChanged = brightness !== initialBrightness.current;
    const saturationChanged = saturation !== initialSaturation.current;
    const vignetteChanged = vignette !== initialVignette.current;
    const editedUrlChanged =
      editedPreviewUrl !== initialEditedPreviewUrl.current;
    return (
      brightnessChanged ||
      saturationChanged ||
      vignetteChanged ||
      editedUrlChanged
    );
  }, [brightness, saturation, vignette, editedPreviewUrl, lastSavedTimestamp]);

  // Initialize state when shot changes
  useEffect(() => {
    const f = (shot as any)?.filters;
    const initBrightness = f?.brightness ?? 100;
    const initSaturation = f?.saturation ?? 100;
    const initVignette = f?.vignette ?? 0;

    setBrightness(initBrightness);
    setSaturation(initSaturation);
    setVignette(initVignette);
    setPrevEditedUrl(null);

    // Store initial values for unsaved changes detection
    initialBrightness.current = initBrightness;
    initialSaturation.current = initSaturation;
    initialVignette.current = initVignette;

    // If the shot has a baked data URL (already edited), use that as the "original" for this editing session
    // Otherwise, use the raw database URL
    const imageIsData =
      typeof (shot as any)?.imageUrl === "string" &&
      (shot as any).imageUrl.startsWith("data:");
    const initOriginalUrl = imageIsData
      ? (shot as any).imageUrl
      : shot?.url ?? null;

    // Capture the "original" for this editing session
    setInitialOriginalUrl(initOriginalUrl);

    // Start with the same image in the edited preview
    setEditedPreviewUrl(initOriginalUrl);
    initialEditedPreviewUrl.current = initOriginalUrl;
    // Reset saved timestamp when loading a new shot
    setLastSavedTimestamp(Date.now());
  }, [shotId]);

  // Handle browser navigation (refresh, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
        return ""; // Some browsers require a return value
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Store original router.push on mount and restore on unmount
  useEffect(() => {
    // Store original router.push only once on mount
    if (!originalRouterPushRef.current) {
      originalRouterPushRef.current = router.push.bind(router);
    }

    return () => {
      // Always restore original on unmount
      if (originalRouterPushRef.current) {
        (router as any).push = originalRouterPushRef.current;
      }
    };
  }, [router]);

  // Intercept router.push calls to check for unsaved changes
  useEffect(() => {
    // Ensure we have the original stored
    if (!originalRouterPushRef.current) {
      originalRouterPushRef.current = router.push.bind(router);
    }

    const originalPush = originalRouterPushRef.current;

    if (!hasUnsavedChanges) {
      // Restore original if it's currently overridden
      // Check if current push is not the original (meaning it's overridden)
      if ((router as any).push !== originalPush) {
        (router as any).push = originalPush;
      }
      return;
    }

    // Override router.push to check for unsaved changes
    (router as any).push = (href: string, options?: any) => {
      // Allow navigation if we're explicitly confirming it
      if (isConfirmingNavigationRef.current && originalPush) {
        isConfirmingNavigationRef.current = false;
        originalPush(href, options);
        return;
      }

      // Check if this is a navigation we should intercept
      if (href && (href.startsWith("/") || href.startsWith("http"))) {
        pendingNavigationRef.current = href;
        setShowUnsavedWarning(true);
        return;
      }
      // For other cases, use original
      if (originalPush) {
        originalPush(href, options);
      }
    };

    return () => {
      // Restore original when effect cleans up or when hasUnsavedChanges becomes false
      if (
        originalRouterPushRef.current &&
        (router as any).push !== originalRouterPushRef.current
      ) {
        (router as any).push = originalRouterPushRef.current;
      }
    };
  }, [hasUnsavedChanges, router]);

  // Handle browser back/forward buttons
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handlePopState = () => {
      // Push the state back to prevent navigation
      window.history.pushState(null, "", window.location.href);
      pendingNavigationRef.current = "back";
      setShowUnsavedWarning(true);
    };

    // Push a state to enable popstate detection
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges]);

  // Intercept navigation attempts (both links and router.push calls via buttons)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Check for link clicks
      const link = target.closest("a");
      if (link) {
        const href = link.getAttribute("href");
        if (
          href &&
          !href.startsWith("#") &&
          !link.hasAttribute("data-ignore-warning")
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          pendingNavigationRef.current = href;
          setShowUnsavedWarning(true);
          return;
        }
      }

      // Check for button clicks that trigger router.push()
      // We need to intercept before the onClick handler runs (capture phase)
      const button = target.closest("button");
      if (button) {
        const buttonText = (button.textContent || "").trim();

        // Check if button is the Lumio button in PageHeader
        // The Lumio button contains "Lumio" text
        if (
          buttonText === "Lumio" ||
          (buttonText.includes("Lumio") && buttonText.length < 20)
        ) {
          // Verify it's in the header area by checking parent structure
          const headerArea = button.closest("div.p-6");
          if (headerArea) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            pendingNavigationRef.current = "/";
            setShowUnsavedWarning(true);
            return;
          }
        }

        // Check if button is the CurrentProjectIndicator button
        // It contains "Current Project" text
        if (
          buttonText.includes("Current Project") ||
          buttonText.includes("Current Project:")
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          if (currentProjectId) {
            const targetUrl = `/saved/${currentProjectId}`;
            pendingNavigationRef.current = targetUrl;
            setShowUnsavedWarning(true);
          }
          return;
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [hasUnsavedChanges, currentProjectId]);

  // Handle confirmation to proceed with navigation
  const handleConfirmExit = () => {
    const targetUrl = pendingNavigationRef.current;
    setShowUnsavedWarning(false);
    pendingNavigationRef.current = null;

    if (targetUrl) {
      // Special case for browser back/forward
      if (targetUrl === "back") {
        window.history.back();
      } else if (targetUrl.startsWith("/")) {
        // Relative path, use router.push
        // Set flag to bypass the override check
        isConfirmingNavigationRef.current = true;
        router.push(targetUrl);
      } else if (targetUrl.startsWith("http")) {
        // External URL
        window.location.href = targetUrl;
      }
    }
  };

  // Handle cancel - stay on page
  const handleCancelExit = () => {
    setShowUnsavedWarning(false);
    pendingNavigationRef.current = null;
  };

  // persist presets when they change
  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    } catch (_e) {}
  }, [presets]);

  if (!shotId) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
        <PageHeader title="Edit shot" path="/edit" />
        <div className="p-8 max-w-7xl mx-auto">
          <p>No shot specified.</p>
        </div>
      </div>
    );
  }

  if (!shot) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
        <PageHeader title="Edit shot" path="/edit" />
        <div className="p-8 max-w-7xl mx-auto">
          <p className="mt-6">Shot not found. It may have been deleted.</p>
          <div className="mt-4">
            <Button onClick={() => router.push("/saved")} className="mr-2">
              Back to Saved
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Edit shot" path="/edit" />

      <div className="mt-8 w-full max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Original */}
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-2">Original</h3>
            <div className="border p-4 rounded bg-white">
              <img
                src={initialOriginalUrl ?? shot.url}
                alt="Original"
                className="w-full h-56 object-contain rounded"
              />
            </div>
          </div>

          {/* Edited */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium mb-2">Edited</h3>
            </div>

            <div className="border p-4 rounded bg-white relative">
              <img
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
                  <label className="block text-sm font-medium">
                    Brightness
                  </label>
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
                  <label className="block text-sm font-medium">
                    Saturation
                  </label>
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
                      className="px-3 py-1 rounded bg-gray-200 cursor-pointer"
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
                              localStorage.setItem(
                                PRESETS_STORAGE_KEY,
                                JSON.stringify(next)
                              );
                            } catch (_e) {}
                            return next;
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-white rounded-full w-5 h-5 text-xs flex items-center justify-center cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="px-3 py-1 rounded bg-green-200 ml-2 cursor-pointer"
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
                        localStorage.setItem(
                          PRESETS_STORAGE_KEY,
                          JSON.stringify(next)
                        );
                      } catch (_e) {}
                      return next;
                    });
                  }}
                >
                  + Save settings
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2 mt-2">
                  <Button onClick={resetEdits} variant="outline">
                    Reset
                  </Button>
                  {prevEditedUrl && (
                    <Button onClick={undoGenerate} variant="outline">
                      Undo AI Edit
                    </Button>
                  )}
                  <Button onClick={addToCurrentProject} className="ml-2">
                    Add to Project
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free-text prompt area */}
        <div className="mt-6 w-full">
          <label className="block font-medium mb-2">
            Tell us what you are going for
          </label>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 p-3 rounded border bg-white"
              placeholder="Describe the look (e.g. brighter, softer shadows, add a spotlight effect)"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGenerating) {
                  generateWithAI();
                }
              }}
              disabled={isGenerating}
            />
            <button
              className="px-4 py-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: "#e34931ff" }}
              onClick={generateWithAI}
              disabled={isGenerating || !promptText.trim()}
            >
              {isGenerating ? "..." : <ArrowRight />}
            </button>
          </div>
          {errorMessage && (
            <div className="mt-2 text-sm text-red-600">{errorMessage}</div>
          )}
          {isGenerating && (
            <div className="mt-2 text-sm text-gray-600">
              Generating AI edit...
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              Are you sure you want to exit? You have unsaved changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={handleCancelExit}
              variant="outline"
              style={{ cursor: "pointer" }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmExit} style={{ cursor: "pointer" }}>
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
