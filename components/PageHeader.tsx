"use client";

import { useRouter } from "next/navigation";

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="p-6">
      <button
        onClick={() => router.push("/")}
        className="text-xl hover:underline"
        style={{ color: "#472d30" }}
      >
        Lumio
      </button>
      <span className="text-xl" style={{ color: "#472d30" }}>
        {" "}
        | {title}
      </span>
      <hr className="mt-4 mb-8" style={{ borderColor: "#472d30" }} />
    </div>
  );
}
