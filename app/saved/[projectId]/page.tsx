"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;

  // Temporary client-side shots
  const [shots, setShots] = useState<{ id: string; url?: string }[]>([]);
  const router = useRouter();

  const addShot = () => {
    const newId = crypto.randomUUID();
    setShots((prev) => [...prev, { id: newId }]);
  };

  return (
    <div className="p-10 space-y-8">
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading text-plum">Project: {projectId}</h1>

        <Button onClick={addShot} className="bg-coral text-white hover:bg-wine">
          + Add Shot
        </Button>
      </div>

      {/* Shots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {shots.length === 0 && (
          <p className="text-wine text-lg">No shots yet. Click “Add Shot”.</p>
        )}

        {shots.map((shot) => (
          <Card
            key={shot.id}
            className="p-4 border-2 border-sage hover:border-coral cursor-pointer transition flex flex-col items-center justify-center h-48"
            onClick={() => alert(`Open shot: ${shot.id}`)}
          >
            {shot.url ? (
              <img src={shot.url} alt="Shot" className="w-full h-full object-cover rounded" />
            ) : (
              <div className="text-center text-wine">
                <div className="text-xl font-heading mb-2">Empty Shot</div>
                <div className="text-sm text-plum">Click to edit</div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
