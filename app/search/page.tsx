"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [files, setFiles] = useState<File[] | undefined>();
  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Search shots" />

      <div className="pr-6 pl-6 min-h-[60vh]">
        <h1 className="text-xl col-span-5 pb-5">
          <strong>
            Tell us what you&apos;re looking for or upload a similar shot
          </strong>
        </h1>

        <div className="grid grid-cols-5 grid-rows-4 gap-5">
          <div className="col-span-1">Image Upload</div>
          <Dropzone
            accept={{ "image/*": [] }}
            maxFiles={10}
            maxSize={1024 * 1024 * 10}
            minSize={1024}
            onDrop={handleDrop}
            onError={console.error}
            src={files}
            className="col-span-4"
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          <div className="col-span-1">Shot Size</div>
          <div className="col-span-4">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="extreme close up">
                  Extreme Close Up
                </SelectItem>
                <SelectItem value="close up">Close Up</SelectItem>
                <SelectItem value="medium close up">Medium Close Up</SelectItem>
                <SelectItem value="medium shot">Medium Shot</SelectItem>
                <SelectItem value="cowboy shot">Cowboy Shot</SelectItem>
                <SelectItem value="medium full shot">
                  Medium Full Shot
                </SelectItem>
                <SelectItem value="full shot">Full Shot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">Time Period</div>
          <div className="col-span-2">
            <Label htmlFor="number">Start Year</Label>
            <Input type="number" placeholder="2025" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="number">End Year</Label>
            <Input type="number" placeholder="2025" />
          </div>

          <div className="col-span-1">Description</div>
          <div className="col-span-4">
            <Label htmlFor="text">
              What does your shot look or feel like? Let your imagination run
              wild!
            </Label>
            <Textarea placeholder="A dark and stormy night" />
          </div>
        </div>

        <div className="flex justify-end pb-5">
          <Button>Search</Button>
        </div>
      </div>
    </div>
  );
}
