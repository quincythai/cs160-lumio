"use client";

import { Ultra, Funnel_Display } from "next/font/google";
import { useRouter } from "next/navigation";
import CurrentProjectIndicator from "@/components/CurrentProjectIndicator";

const ultra = Ultra({
  weight: "400",
  subsets: ["latin"],
});

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();
  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-white ${funnelDisplay.className} relative`}
    >
      <div className="absolute top-6 right-6">
        <CurrentProjectIndicator />
      </div>
      <h1
        className={`text-8xl font-bold mb-16 ${ultra.className}`}
        style={{ color: "#472d30" }}
      >
        Lumio
      </h1>
      <p className="text-4xl mb-20" style={{ color: "#472d30" }}>
        What do you want to do?
      </p>

      <div className="flex gap-8">
        <button
          className="group px-16 py-8 rounded text-3xl cursor-pointer relative transition-all duration-300 hover:shadow-lg hover:shadow-[#472d30]/30 overflow-hidden"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ffe1a8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#c9cba3";
          }}
          onClick={() => {
            router.push("/search");
          }}
        >
          Search shots
          <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#472d30] transition-all duration-300 group-hover:w-full"></span>
        </button>
        <button
          className="group px-16 py-8 rounded text-3xl cursor-pointer relative transition-all duration-300 hover:shadow-lg hover:shadow-[#472d30]/30 overflow-hidden"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ffe1a8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#c9cba3";
          }}
          onClick={() => {
            router.push("/edit");
          }}
        >
          Edit Shots
          <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#472d30] transition-all duration-300 group-hover:w-full"></span>
        </button>
        <button
          className="group px-16 py-8 rounded text-3xl cursor-pointer relative transition-all duration-300 hover:shadow-lg hover:shadow-[#472d30]/30 overflow-hidden"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ffe1a8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#c9cba3";
          }}
          onClick={() => {
            router.push("/saved");
          }}
        >
          Saved Shots
          <span className="absolute bottom-0 left-0 w-0 h-1 bg-[#472d30] transition-all duration-300 group-hover:w-full"></span>
        </button>
      </div>
    </div>
  );
}
