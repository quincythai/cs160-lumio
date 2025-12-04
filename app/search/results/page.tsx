"use client";

import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Spinner } from "@/components/ui/spinner";

import { projectsAtom, currentProjectIdAtom, type Shot, referenceImageAtom } from "@/lib/store";
import shotMetadata from "@/shot-database/metadata.json";

type ShotMetadata = {
  id: number;
  image_url: string;
  movie_title: string;
  year: number;
  shot_size: string;
  description: string;
  timestamp: string;
};

type SearchResult = {
  id: string;
  imageUrl: string;
  title: string;
  year: number;
  timestamp: string;
};

export default function SearchResultsPage() {
  const searchParams = useSearchParams();

  const projects = useAtomValue(projectsAtom);
  const [currentProjectId] = useAtom(currentProjectIdAtom);
  const [, setProjects] = useAtom(projectsAtom);
  const referenceImage = useAtomValue(referenceImageAtom);

  const [loading, setLoading] = useState<boolean>(true);
  const [matchingShotIds, setMatchingShotIds] = useState<number[]>([]);
  const searchResults: SearchResult[] = shotMetadata
    .filter((shot: ShotMetadata) => matchingShotIds.includes(shot.id))
    .map((shot: ShotMetadata) => ({
      id: String(shot.id),
      imageUrl: shot.image_url,
      title: shot.movie_title,
      year: shot.year,
      timestamp: shot.timestamp,
    }));

  const currentProject = projects.find((p) => p.id === currentProjectId);

  useEffect(() => {
    // Make backend API request
    const formData = new FormData();

    formData.append("referenceImage", referenceImage);
    formData.append("shotSize", searchParams.get("shotSize") || "");
    formData.append("startYear", searchParams.get("startYear") || "");
    formData.append("endYear", searchParams.get("endYear") || "");
    formData.append(
      "shotDescription",
      searchParams.get("shotDescription") || ""
    );

    fetch("/api/search", {
      method: "POST",
      body: formData,
    })
      .then((data) => data.json())
      .then((data) => {
        setMatchingShotIds(data.matchingShotIds);
        setLoading(false);
      });
  }, [referenceImage, searchParams]);

  const isShotInProject = (shotId: string): boolean => {
    if (!currentProject) return false;
    return currentProject.shots.some((shot) => shot.id === shotId);
  };

  const handleAddShot = (shot: Shot) => {
    if (!currentProjectId) {
      alert(
        "Please select a project first. Go to Saved shots to create or select a project."
      );
      return;
    }

    const isAlreadyAdded = isShotInProject(shot.id);

    if (isAlreadyAdded) {
      // Remove shot from project
      setProjects((prev) =>
        prev.map((project) =>
          project.id === currentProjectId
            ? {
                ...project,
                shots: project.shots.filter((s) => s.id !== shot.id),
                updatedAt: new Date().toISOString(),
              }
            : project
        )
      );
    } else {
      // Add shot to project
      setProjects((prev) =>
        prev.map((project) =>
          project.id === currentProjectId
            ? {
                ...project,
                shots: [...project.shots, shot],
                updatedAt: new Date().toISOString(),
              }
            : project
        )
      );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Search results" />

      <div className="p-8">
        {loading ? (
          <div className="flex justify-center">
            <Spinner className="size-25" />
          </div>
        ) : (
          //   <div className="mb-6">
          //   <Button
          //     className="flex items-center gap-2"
          //     style={{ backgroundColor: "#472d30", color: "#ffe1a8" }}
          //   >
          //     <Filter size={18} />
          //     Filter
          //   </Button>
          // </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.length === 0 && (
              <div>No matching shots in database</div>
            )}
            {searchResults.map((result) => (
              <Card
                key={result.id}
                className="overflow-hidden border-2 hover:shadow-lg transition-shadow bg-white"
                style={{ borderColor: "#472d30" }}
              >
                <div className="relative w-full aspect-video bg-gray-200">
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "#472d30" }}
                      >
                        {result.title}
                      </h3>
                      <span
                        className="text-sm"
                        style={{ color: "#472d30", opacity: 0.7 }}
                      >
                        {result.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddShot(result)}
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        style={{
                          color: isShotInProject(result.id)
                            ? "#22c55e"
                            : "#472d30",
                        }}
                        aria-label={
                          isShotInProject(result.id)
                            ? "Remove from project"
                            : "Add to project"
                        }
                      >
                        {isShotInProject(result.id) ? (
                          <Check size={20} />
                        ) : (
                          <Plus size={20} />
                        )}
                      </button>
                      {/* <button
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      style={{ color: "#472d30" }}
                      aria-label="Download"
                    >
                      <Download size={20} />
                    </button> */}
                    </div>
                  </div>
                  <span className="text-sm" style={{ color: "#472d30" }}>
                    {result.timestamp}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
