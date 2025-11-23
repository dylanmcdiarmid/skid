import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { locationsApi } from "@/api/locations";
import type { LocationItem } from "@/api/types";
import { uploadsApi } from "@/api/uploads";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const schema = z.object({
  file: z
    .custom<FileList>((v) => v instanceof FileList && v.length > 0, {
      message: "File is required",
    })
    .optional(),
  name: z.string().optional(),
  country: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function Upload() {
  const LATITUDE_MIN = -90;
  const LATITUDE_MAX = 90;
  const LONGITUDE_MIN = -180;
  const LONGITUDE_MAX = 180;
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [createNew, setCreateNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New location fields
  const [name] = useState("");
  const [country] = useState("");
  const [latitude] = useState("");
  const [longitude] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {},
  });

  useEffect(() => {
    locationsApi
      .list({ limit: 100 })
      .then((r) => setLocations(r.items))
      .catch(() => {
        /* no-op */
      });
  }, []);

  const isValid = useMemo(() => {
    const files = form.watch("file");
    const hasFile = Boolean(files && files.length > 0);
    if (!hasFile) {
      return false;
    }
    if (!createNew) {
      return selectedLocationId !== "";
    }
    const lat = Number(latitude);
    const lon = Number(longitude);
    const isLatValid =
      !Number.isNaN(lat) && lat >= LATITUDE_MIN && lat <= LATITUDE_MAX;
    const isLonValid =
      !Number.isNaN(lon) && lon >= LONGITUDE_MIN && lon <= LONGITUDE_MAX;
    return (
      name !== "" &&
      country !== "" &&
      latitude !== "" &&
      longitude !== "" &&
      isLatValid &&
      isLonValid
    );
  }, [form, createNew, name, country, latitude, longitude, selectedLocationId]);

  const onSubmit = async (values: FormValues) => {
    if (!isValid) {
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const locationJson = createNew
        ? JSON.stringify({
            name,
            country,
            latitude: Number(latitude),
            longitude: Number(longitude),
          })
        : undefined;
      const selectedFile = values.file?.item(0) as File | null;
      const res = await uploadsApi.upload({
        file: selectedFile as File,
        locationId: createNew ? undefined : selectedLocationId,
        locationJson,
      });
      setMessage(
        `Uploaded ${res.inserted} records to location ${res.locationId}`
      );
      form.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data file</FormLabel>
                  <FormControl>
                    <Input
                      accept="application/json,text/csv,.csv,application/vnd.ms-excel"
                      aria-describedby="file-help"
                      onChange={(e) => field.onChange(e.target.files)}
                      ref={fileInputRef}
                      type="file"
                    />
                  </FormControl>
                  <FormDescription id="file-help">
                    Upload JSON or CSV. Required fields: sensorName, metricKey,
                    value, unit, recordedAt.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <fieldset className="space-y-2">
            <legend>Target location</legend>
            <div>
              <label htmlFor="existing-location">
                <input
                  checked={!createNew}
                  id="existing-location"
                  onChange={() => setCreateNew(false)}
                  type="radio"
                />
                Existing
              </label>
              <label htmlFor="new-location">
                <input
                  checked={createNew}
                  id="new-location"
                  onChange={() => setCreateNew(true)}
                  type="radio"
                />
                New
              </label>
            </div>

            {createNew ? (
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Downtown" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. US" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder="e.g. 37.7749"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          inputMode="decimal"
                          placeholder="e.g. -122.4194"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="location-select">Location</Label>
                <Select
                  id="location-select"
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  required
                  value={selectedLocationId}
                >
                  <option disabled value="">
                    Select a location
                  </option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} —{" "}
                      {[l.city, l.region, l.country].filter(Boolean).join(", ")}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="pt-2">
              <Button disabled={!isValid || isSubmitting} type="submit">
                {isSubmitting ? "Uploading…" : "Upload"}
              </Button>
            </div>
          </fieldset>

          {message ? <div>{message}</div> : null}
          {error ? <div>{error}</div> : null}
        </form>
      </Form>
    </div>
  );
}
