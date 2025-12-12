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
  path: string;
}

export default function PageHeader({ title, path }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push("/")}
              className={`text-xl cursor-pointer ${ultra.className}`}
              style={{ color: "#472d30" }}
            >
              Lumio
            </button>
            <span className="text-xl" style={{ color: "#472d30" }}>
              {" "}
              |
              {" "}
              <button
                onClick={() => router.push(path)}
                className="cursor-pointer"
              >{title}</button>
            </span>
          </div>
          <CurrentProjectIndicator />
        </div>
        <hr className="mt-4 mb-8" style={{ borderColor: "#472d30" }} />
      </div>
    </div>
  );
}
