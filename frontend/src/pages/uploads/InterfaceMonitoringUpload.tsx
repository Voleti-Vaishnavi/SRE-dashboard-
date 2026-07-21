import { UploadCategoryPage } from "../../components/upload/UploadCategoryPage";

export function InterfaceMonitoringUpload() {
  return (
    <UploadCategoryPage
      category="interface-monitoring"
      title="Upload — Interface Monitoring"
      description="Upload daily Interface Monitoring status (Success / Failure / Yet to Run) per named interface, per application."
    />
  );
}
