"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";

export default function EditPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[] | undefined>();

  const handleDrop = async (droppedFiles: File[]) => {
    setFiles(droppedFiles);

    if (droppedFiles.length > 0) {
      const file = droppedFiles[0];
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      }); // send to API route to upload for now this is just saving to the public folder

      const data = await response.json();
      router.push(`/edit/display?image=${data.filename}`); // sending in the image to display as params in the URL
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Edit shots" />

      <div className="flex items-center justify-center min-h-[60vh] px-6 max-w-7xl mx-auto">
        <Dropzone
          accept={{ "image/*": [] }}
          maxFiles={1}
          maxSize={1024 * 1024 * 10}
          minSize={1024}
          onDrop={handleDrop}
          onError={console.error}
          src={files}
          className="w-full max-w-md"
        >
          <DropzoneEmptyState />
          <DropzoneContent />
        </Dropzone>
      </div>
    </div>
  );
}
