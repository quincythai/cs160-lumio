import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // If less than 1 hour ago, show minutes
  if (diffHours < 1) {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
  }

  // If less than 24 hours ago, show hours
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  // If less than 7 days ago, show days
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  // Otherwise, show formatted date with time
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Converts a File object (from an input or drag-and-drop)
 * into a Base64 encoded Data URL string.
 * @param {File} file The File object to convert.
 * @returns {Promise<string>} A promise that resolves with the Data URL string.
 */
export function fileToDataUrl(file: File) {
  return new Promise((resolve, reject) => {
    // 1. Create a new FileReader instance
    const reader = new FileReader();

    // 2. Define the callback for a successful read
    reader.onload = (event: ProgressEvent<FileReader>) => {
      // The result property contains the Data URL
      const result = event.target?.result;
      if (typeof result === "string") resolve(result);
      else resolve("");
    };

    // 3. Define the callback for an error
    reader.onerror = (error) => {
      reject(error);
    };

    // 4. Start reading the file
    // This is the method that initiates the conversion to a Data URL
    reader.readAsDataURL(file);
  });
}
