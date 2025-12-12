import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "Nothing was uploaded. Get good bro." },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `uploaded-${file.name}`;
  const filepath = join(process.cwd(), "public", filename); // save in public folder for now we should change later to s3 bucket

  await writeFile(filepath, buffer);

  return NextResponse.json({ filename });
}
