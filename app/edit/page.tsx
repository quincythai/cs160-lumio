"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function EditPage() {
  const router = useRouter();

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    }); // send to API route to upload for now this is just saving to the public folder

    const data = await response.json();
    router.push(`/edit/display?image=${data.filename}`); // sending in the image to display as params in the URL
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <div className="p-6">
        <button
          onClick={() => router.push("/")}
          className="text-xl hover:underline"
          style={{ color: "#472d30" }}
        >
          Lumio
        </button>
        <span className="text-xl" style={{ color: "#472d30" }}>
          {" "}| Edit shots
        </span>
        <hr className="mt-4 mb-8" style={{ borderColor: "#472d30" }} />
      </div>

      <div className="flex items-center justify-center min-h-[60vh]">
        <label
          className="border-2 border-dashed p-12 rounded"
          style={{ borderColor: "#472d30" }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
            className="hidden"
          />
          <div className="flex justify-center">
            <Image
              src="/upload.png"
              alt="Upload"
              width={50}
              height={50}
              className="mb-4"
            />
          </div>
          <p style={{ color: "#472d30" }}>
            Click to upload
          </p>
        </label>
      </div>
    </div>
  );
}
