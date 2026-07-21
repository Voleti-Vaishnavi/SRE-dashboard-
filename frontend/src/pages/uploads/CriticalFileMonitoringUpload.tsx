import { UploadCategoryPage } from "../../components/upload/UploadCategoryPage";

export function CriticalFileMonitoringUpload() {
  return (
    <UploadCategoryPage
      category="critical-file-monitoring"
      title="Upload — Critical File Monitoring"
      description="Upload daily Critical File Monitoring status (Success / Failure / Yet to Run) per named file, per application."
    />
  );
}
