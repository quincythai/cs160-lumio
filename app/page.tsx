"use client";

import { Ultra, Funnel_Display } from "next/font/google";
import { useRouter } from "next/navigation";

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
    <div className={`flex flex-col items-center justify-center min-h-screen bg-white ${funnelDisplay.className}`}>
      <h1 className={`text-8xl font-bold mb-16 ${ultra.className}`} style={{ color: "#472d30" }}>
        Lumio
      </h1>
      <p className="text-4xl mb-20" style={{ color: "#472d30" }}>
        What do you want to do?
      </p>

      <div className="flex gap-8">
        <button
          className="px-16 py-8 rounded text-3xl"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffe1a8")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#c9cba3")
          }
          onClick={() => {
            router.push("/search");
          }}
        >
          Search shots
        </button>
        <button
          className="px-16 py-8 rounded text-3xl"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffe1a8")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#c9cba3")
          }
          onClick={() => {
            router.push("/edit");
          }}
        >
          Edit Shots
        </button>
        <button
          className="px-16 py-8 rounded text-3xl"
          style={{ backgroundColor: "#c9cba3", color: "#472d30" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#ffe1a8")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#c9cba3")
          }
          onClick={() => {
            router.push("/saved");
          }}
        >
          Saved Shots
        </button>
      </div>
    </div>
  );
}
