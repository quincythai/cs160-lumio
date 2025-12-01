"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";

export default function DisplayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const imageName = searchParams.get("image"); // Get image using the search params in the URL

  if (!imageName) {
    return <div>Some sort of error message</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Edit shots" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="mb-8">
          <Image
            src={`/${imageName}`}
            alt="Uploaded image" // to make sure we are accessible
            width={800}
            height={600}
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
