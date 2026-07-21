import { UploadCategoryPage } from "../../components/upload/UploadCategoryPage";

export function UrlAvailabilityUpload() {
  return (
    <UploadCategoryPage
      category="url-availability"
      title="Upload — URL Availability"
      description="Upload daily URL Availability status (Operational / Non Operational) per application."
    />
  );
}
