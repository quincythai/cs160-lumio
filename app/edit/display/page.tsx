"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { useAtom } from "jotai";
import { shotsAtom, SHOTS_STORAGE_KEY } from "@/lib/atoms";
import { currentProjectIdAtom } from "@/lib/store";

export default function DisplayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageName = searchParams.get("image"); // Get image using the search params in the URL

  if (!imageName) {
    return <div>Some sort of error message</div>;
  }

  const [allShots, setAllShots] = useAtom(shotsAtom);
  const [currentProjectId] = useAtom(currentProjectIdAtom);

  const handleConfirm = () => {
    if (!imageName) return;
    const id = crypto.randomUUID();
    const newShot = {
      id,
      url: `/${imageName}`,
      title: "",
      year: "",
      timestamp: new Date().toISOString(),
      notes: "",
    };

    const pid = currentProjectId || "unsaved";
    const next = { ...allShots, [pid]: [...(allShots[pid] || []), newShot] };
    setAllShots(next);
    try {
      localStorage.setItem(SHOTS_STORAGE_KEY, JSON.stringify(next));
    } catch (_e) {
      // ignore
    }

    router.push(`/edit/${id}`);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Edit shots" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="mb-8 max-w-full">
          <Image
            src={`/${imageName}`}
            alt="Uploaded image" // to make sure we are accessible
            width={600}
            height={450}
            className="max-w-full h-auto object-contain"
            style={{ maxHeight: "60vh" }}
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/edit")}
            className="px-6 py-3 rounded border-2 hover:underline"
            style={{ borderColor: "#472d30", color: "#472d30" }}
          >
            ← Go back
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-3 rounded border-2 hover:underline"
            style={{ borderColor: "#472d30", color: "#472d30" }}
          >
            ✓ Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
