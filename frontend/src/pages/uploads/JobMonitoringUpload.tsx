import { UploadCategoryPage } from "../../components/upload/UploadCategoryPage";

export function JobMonitoringUpload() {
  return (
    <UploadCategoryPage
      category="job-monitoring"
      title="Upload — Job Monitoring"
      description="Upload daily Job Monitoring status (Success / Failure / Yet to Run) per named job, per application."
    />
  );
}
