import type { RouteObject } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DashboardOverview } from "../pages/DashboardOverview";
import { TeamDetail } from "../pages/TeamDetail";
import { ApplicationsReference } from "../pages/ApplicationsReference";
import { ApplicationDetail } from "../pages/ApplicationDetail";
import { ChangeExplorer } from "../pages/ChangeExplorer";
import { ChangeDeploymentsUpload } from "../pages/uploads/ChangeDeploymentsUpload";
import { UrlAvailabilityUpload } from "../pages/uploads/UrlAvailabilityUpload";
import { JobMonitoringUpload } from "../pages/uploads/JobMonitoringUpload";
import { InterfaceMonitoringUpload } from "../pages/uploads/InterfaceMonitoringUpload";
import { CriticalFileMonitoringUpload } from "../pages/uploads/CriticalFileMonitoringUpload";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardOverview /> },
      { path: "teams/:teamId", element: <TeamDetail /> },
      { path: "applications", element: <ApplicationsReference /> },
      { path: "applications/:appId", element: <ApplicationDetail /> },
      { path: "changes", element: <ChangeExplorer /> },
      { path: "uploads/change-deployments", element: <ChangeDeploymentsUpload /> },
      { path: "uploads/url-availability", element: <UrlAvailabilityUpload /> },
      { path: "uploads/job-monitoring", element: <JobMonitoringUpload /> },
      { path: "uploads/interface-monitoring", element: <InterfaceMonitoringUpload /> },
      { path: "uploads/critical-file-monitoring", element: <CriticalFileMonitoringUpload /> },
    ],
  },
];
