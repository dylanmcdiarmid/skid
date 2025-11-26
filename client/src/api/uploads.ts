import { postForm } from "./utils";

export type UploadResult = {
  message: string;
  inserted: number;
  locationId: string;
};

export const uploadsApi = {
  upload(params: {
    file: File;
    locationId?: string;
    locationJson?: string; // JSON string of location when creating new
  }) {
    const fd = new FormData();
    fd.append("file", params.file);
    if (params.locationId) {
      fd.append("locationId", params.locationId);
    }
    if (params.locationJson) {
      fd.append("location", params.locationJson);
    }
    return postForm<UploadResult>("/api/upload", fd);
  },
};
