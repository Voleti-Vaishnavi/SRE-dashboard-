import { UploadCategoryPage } from "../../components/upload/UploadCategoryPage";

export function ChangeDeploymentsUpload() {
  return (
    <UploadCategoryPage
      category="change-deployments"
      title="Upload — Change Deployments"
      description="Upload Change Status and 4-Eye Review Status records (CR Number, Application, Assignment Group, etc.)."
    />
  );
}
