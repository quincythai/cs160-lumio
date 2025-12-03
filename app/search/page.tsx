"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Field, FieldError } from "@/components/ui/field";

import { useAtom } from 'jotai';
import { searchResultsAtom } from "@/lib/store";
import { fileToDataUrl } from "@/lib/utils";

const YEAR_OF_FIRST_MOVIE = 1878;
const SHOT_SIZES = [
  { label: "Extreme Close Up", value: "extreme close up" },
  { label: "Close Up", value: "close up" },
  { label: "Medium Close Up", value: "medium close up" },
  { label: "Medium Shot", value: "medium shot" },
  { label: "Cowboy Shot", value: "cowboy shot" },
  { label: "Medium Full Shot", value: "medium full shot" },
  { label: "Full Shot", value: "full shot" },
];

export default function SearchPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[] | undefined>();
  const [shotSize, setShotSize] = useState<string>("");
  const [startYear, setStartYear] = useState<string>("");
  const [endYear, setEndYear] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [searchResults, setSearchResults] = useAtom<number[]>(searchResultsAtom);

  const handleDrop = (files: File[]) => {
    console.log(files);
    setFiles(files);
  };

  // TODO loading indicator
  const handleSearch = async () => {
    // TODO move this logic to search results page and pass params through search query params below
    // Make backend API request
    const formData = new FormData();
    const fileDataUrl = (files && files.length > 0 ? await fileToDataUrl(files[0]) : "") as string;
    formData.append("referenceImage", fileDataUrl);
    formData.append("shotSize", shotSize);
    formData.append("startYear", startYear);
    formData.append("endYear", endYear);
    formData.append("shotDescription", description);

    await fetch("/api/search", {
      method: "POST",
      body: formData,
    })
      .then(data => data.json())
      .then(data => {
        console.log('search results', data);
        setSearchResults(data);
  });

    // Build query parameters
    const params = new URLSearchParams();
    if (shotSize) params.append("shotSize", shotSize);
    if (startYear) params.append("startYear", startYear);
    if (endYear) params.append("endYear", endYear);
    if (description) params.append("description", description);
    if (files && files.length > 0) {
      params.append("hasFiles", "true");
    }

    // Redirect to results page
    router.push(`/search/results?${params.toString()}`);
  };

  const handleReset = () => {
    setFiles(undefined);
    setShotSize("");
    setStartYear("");
    setEndYear("");
    setDescription("");
  };

  const getStartYearFieldErrors = () => {
    const errors = [];
    if (parseInt(startYear, 10) < YEAR_OF_FIRST_MOVIE) {
      errors.push({
        message: `Start year must be greater than or equal to ${YEAR_OF_FIRST_MOVIE}`,
      });
    }
    const currentYear = new Date().getFullYear();
    if (parseInt(startYear, 10) > currentYear) {
      errors.push({
        message: `Start year must be less than or equal to ${currentYear}`,
      });
    }
    if (parseInt(startYear, 10) > parseInt(endYear, 10)) {
      errors.push({
        message: "Start year must be less than or equal to end year",
      });
    }
    return errors;
  };

  const getEndYearFieldErrors = () => {
    const errors = [];
    if (parseInt(endYear, 10) < YEAR_OF_FIRST_MOVIE) {
      errors.push({
        message: `End year must be greater than or equal to ${YEAR_OF_FIRST_MOVIE}`,
      });
    }
    const currentYear = new Date().getFullYear();
    if (parseInt(endYear, 10) > currentYear) {
      errors.push({
        message: `End year must be less than or equal to ${currentYear}`,
      });
    }
    if (parseInt(startYear, 10) > parseInt(endYear, 10)) {
      errors.push({
        message: "End year must be greater than or equal to start year",
      });
    }
    return errors;
  };

  const isSearchFormInvalid = () => {
    if ((files && files.length > 0) || shotSize || startYear || endYear || description) {
      return false;
    }
    return true;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffe1a8" }}>
      <PageHeader title="Search shots" />

      <div className="pr-6 pl-6 min-h-[60vh]">
        <h1 className="text-xl col-span-5 pb-5">
          <strong>
            Tell us what you&apos;re looking for or upload a similar shot
          </strong>
        </h1>

        <div className="grid grid-cols-5 grid-rows-[auto_auto_auto_auto] gap-5">
          <div className="col-span-1">Image Upload</div>
          <Dropzone
            accept={{ "image/*": [] }}
            maxFiles={1}
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
            <Select value={shotSize} onValueChange={setShotSize}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {SHOT_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1">Time Period</div>
          <div className="col-span-2">
            <Field data-invalid={getStartYearFieldErrors().length > 0}>
              <Label htmlFor="startYear" className="pb-2">
                Start Year
              </Label>
              <Input
                id="startYear"
                type="number"
                placeholder="1878"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                className="bg-white"
              />
              <FieldError errors={getStartYearFieldErrors()} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field data-invalid={getEndYearFieldErrors().length > 0}>
              <Label htmlFor="endYear" className="pb-2">
                End Year
              </Label>
              <Input
                id="endYear"
                type="number"
                placeholder="2025"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
                className="bg-white"
              />
              <FieldError errors={getEndYearFieldErrors()} />
            </Field>
          </div>

          <div className="col-span-1">Description</div>
          <div className="col-span-4">
            <Label htmlFor="description" className="pb-2">
              What does your shot look or feel like? Let your imagination run
              wild!
            </Label>
            <Textarea
              id="description"
              placeholder="A dark and stormy night"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-white"
            />
            {/* TODO input validation: max 1000 characters */}
          </div>
        </div>

        <div className="flex justify-end pb-5 pt-5 gap-5">
          <Button onClick={handleReset} variant="outline" type="reset">
            Reset
          </Button>
          <Button onClick={handleSearch} type="submit" disabled={getStartYearFieldErrors().length > 0 || getEndYearFieldErrors().length > 0 || isSearchFormInvalid()}>
            Search
          </Button>
        </div>

        {isSearchFormInvalid() && <FieldError errors={[{message: "Need to fill out at least 1 search query field"}]} className="flex justify-end" />}
      </div>
    </div>
  );
}
