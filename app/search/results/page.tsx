"use client";

import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { Card } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { projectsAtom, currentProjectIdAtom, type Shot } from "@/lib/store";
import { useSearchParams } from 'next/navigation';

type SearchResult = {
  id: string;
  imageUrl: string;
  title: string;
  year: number;
  timestamp: string;
};

// Mock data for search results
const mockResults: SearchResult[] = [
  {
    id: "1",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+1",
    title: "The Godfather",
    year: 1972,
    timestamp: "01:30:26",
  },
  {
    id: "2",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+2",
    title: "Pulp Fiction",
    year: 1994,
    timestamp: "00:45:12",
  },
  {
    id: "3",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+3",
    title: "The Shawshank Redemption",
    year: 1994,
    timestamp: "02:15:43",
  },
  {
    id: "4",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+4",
    title: "Inception",
    year: 2010,
    timestamp: "00:23:58",
  },
  {
    id: "5",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+5",
    title: "The Dark Knight",
    year: 2008,
    timestamp: "01:52:07",
  },
  {
    id: "6",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+6",
    title: "Fight Club",
    year: 1999,
    timestamp: "00:38:34",
  },
  {
    id: "7",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+7",
    title: "Forrest Gump",
    year: 1994,
    timestamp: "02:07:19",
  },
  {
    id: "8",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+8",
    title: "The Matrix",
    year: 1999,
    timestamp: "01:14:52",
  },
  {
    id: "9",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+9",
    title: "Goodfellas",
    year: 1990,
    timestamp: "00:56:28",
  },
  {
    id: "10",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+10",
    title: "The Silence of the Lambs",
    year: 1991,
    timestamp: "01:41:15",
  },
  {
    id: "11",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+11",
    title: "Se7en",
    year: 1995,
    timestamp: "00:12:47",
  },
  {
    id: "12",
    imageUrl: "https://placehold.co/400x300/472d30/ffe1a8?text=Shot+12",
    title: "Interstellar",
    year: 2014,
    timestamp: "02:29:03",
  },
];

export default function SearchResultsPage() {
  const searchParams = useSearchParams();

  const projects = useAtomValue(projectsAtom);
  const [currentProjectId] = useAtom(currentProjectIdAtom);
  const [, setProjects] = useAtom(projectsAtom);

  // TODO display cards, make up timestamps
  const [matchingShotIds, setMatchingShotIds] = useState([]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // TODO loading indicator
  useEffect(() => {
    // Make backend API request
    const formData = new FormData();

    formData.append("referenceImage", searchParams.get("referenceImage") || "");
    formData.append("shotSize", searchParams.get("shotSize") || "");
    formData.append("startYear", searchParams.get("startYear") || "");
    formData.append("endYear", searchParams.get("endYear") || "");
    formData.append("shotDescription", searchParams.get("shotDescription") || "");

    fetch("/api/search", {
      method: "POST",
      body: formData,
    })
      .then((data) => data.json())
      .then((data) => {
        console.log("search results", data);
        setMatchingShotIds(data);
      });
  }, [searchParams]);

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

      <div className="p-6">
        {/* <div className="mb-6">
          <Button
            className="flex items-center gap-2"
            style={{ backgroundColor: "#472d30", color: "#ffe1a8" }}
          >
            <Filter size={18} />
            Filter
          </Button>
        </div> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockResults.map((result) => (
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
      </div>
    </div>
  );
}
