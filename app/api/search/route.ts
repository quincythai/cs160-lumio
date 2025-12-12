import { NextRequest, NextResponse } from "next/server";

import shotMetadata from "../../../shot-database/metadata.json";

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const referenceImage = formData.get("referenceImage") as string | null; // expects data url
  const shotSize = formData.get("shotSize") as string | null;
  const startYear = formData.get("startYear") as string | null;
  const endYear = formData.get("endYear") as string | null;
  const shotDescription = formData.get("shotDescription") as string | null;

  if (
    !referenceImage &&
    !shotSize &&
    !startYear &&
    !endYear &&
    !shotDescription
  ) {
    return NextResponse.json(
      {
        error:
          "Need to provide input for at least 1 search query field, but none provided",
      },
      { status: 400 }
    );
  }

  const matchingShotIds = new Set(
    shotMetadata
      .filter((shot) => {
        // Either shot size wasn't provided OR shot size provided and matches
        const shotSizeMatches =
          !shotSize || (shotSize && shot.shot_size === shotSize);

        // 4 scenarios:
        // 1. Both start and end year provided. We only include shots within this range
        // 2. Only start year provided. We only include shots after this year
        // 3. Only end year provided. We only include shots before this year
        // 4. Neither start nor end year provided
        // 2. Shot Time Period Check (Simplified)
        const shotYear = shot.year;
        const start = startYear ? parseInt(startYear, 10) : null;
        const end = endYear ? parseInt(endYear, 10) : null;

        // A shot year matches if:
        // a. No start year is provided OR the shot year is >= the start year
        const afterStart = start === null || shotYear >= start;

        // b. No end year is provided OR the shot year is <= the end year
        const beforeEnd = end === null || shotYear <= end;

        // The shot must satisfy BOTH conditions to be within the range (or unbounded)
        const shotTimePeriodMatches = afterStart && beforeEnd;

        return shotSizeMatches && shotTimePeriodMatches;
      })
      .map((shot) => shot.id)
  );

  if (referenceImage || shotDescription) {
    const MAX_SHOT_DATABASE_CHARS = 100000;

    // Only include subset of shots that are already matching by shot size and year (reduces context size)
    const shotMetadataSubset = shotMetadata.filter((shot, index) => matchingShotIds.has(index))
    const shotIdsByDescriptionOrReferenceImage = await fetch(
      "https://noggin.rea.gent/expected-ostrich-1034",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SHOT_SEARCH_SECRET_KEY}`,
        },
        body: JSON.stringify({
          // fill variables here.
          shotDescription: shotDescription,
          // You can use an external URL or a data URL here.
          referenceImage: referenceImage,
          shotDatabase: JSON.stringify(shotMetadataSubset).substring(0, MAX_SHOT_DATABASE_CHARS),
        }),
      }
    ).then((response) => response.json());

    matchingShotIds.clear();
    for (const shotId of shotIdsByDescriptionOrReferenceImage) {
      matchingShotIds.add(shotId);
    }
  }

  return NextResponse.json({ matchingShotIds: Array.from(matchingShotIds) });
}
