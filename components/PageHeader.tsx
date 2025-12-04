"use client";

import { useRouter } from "next/navigation";
import { Ultra } from "next/font/google";
import CurrentProjectIndicator from "./CurrentProjectIndicator";

const ultra = Ultra({
  weight: "400",
  subsets: ["latin"],
});

interface PageHeaderProps {
  title: string;
}

export default function PageHeader({ title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push("/")}
            className={`text-xl hover:underline cursor-pointer ${ultra.className}`}
            style={{ color: "#472d30" }}
          >
            Lumio
          </button>
          <span className="text-xl" style={{ color: "#472d30" }}>
            {" "}
            | {title}
          </span>
        </div>
        <CurrentProjectIndicator />
      </div>
      <hr className="mt-4 mb-8" style={{ borderColor: "#472d30" }} />
    </div>
  );
}
