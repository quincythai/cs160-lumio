import { NextRequest, NextResponse } from "next/server";

import shotMetadata from '../../../shot-database/metadata.json';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const referenceImage = formData.get("referenceImage") as string | null; // expects data url
  const shotSize = formData.get("shotSize") as string | null;
  const startYear = formData.get("startYear") as string | null;
  const endYear = formData.get("endYear") as string | null;
  const shotDescription = formData.get("shotDescription") as string | null;

  if (!referenceImage && !shotSize && !startYear && !endYear && !shotDescription) {
    return NextResponse.json(
        { error: "Need to provide input for at least 1 search query field, but none provided" },
        { status: 400 }
    )
  }

  const matchingShotIds = new Set(shotMetadata.filter((shot) => {
    if (shotSize && shot.shot_size === shotSize) {
        return true;
    }

    if (startYear && endYear && (parseInt(startYear, 10) <= shot.year && shot.year <= parseInt(endYear, 10))) {
        return true;
    }

    if (startYear && !endYear && parseInt(startYear, 10) <= shot.year) {
        return true;
    }

    if (!startYear && endYear && shot.year <= parseInt(endYear, 10)) {
        return true;
    }

    return false;
  }).map((shot) => shot.id));

  if (referenceImage || shotDescription) {
    const shotIdsByDescriptionOrReferenceImage = await fetch(
    'https://noggin.rea.gent/expected-ostrich-1034',
    {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SHOT_SEARCH_SECRET_KEY}`,
        },
        body: JSON.stringify({
        // fill variables here.
        "shotDescription": shotDescription,
        // You can use an external URL or a data URL here.
        "referenceImage": referenceImage,
        "shotDatabase": JSON.stringify(shotMetadata),
        }),
    }
    ).then(response => response.json());

    for (const shotId of shotIdsByDescriptionOrReferenceImage) {
        matchingShotIds.add(shotId);
    }
  }

  return NextResponse.json({ matchingShotIds: Array.from(matchingShotIds) });
}
