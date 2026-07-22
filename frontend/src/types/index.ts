export interface Team {
  id: number;
  name: string;
}

export interface ApplicationRef {
  id: number;
  name: string;
  team_id: number;
  team_name: string;
  medal_category: "Gold" | "Silver" | "Bronze" | "Tin";
}

export type HealthStatus = "Green" | "Amber" | "Red" | "No Data";

export interface DailyHealth {
  application_id: number;
  application_name: string;
  team_id: number;
  date: string;
  health_status: HealthStatus;
  categories_evaluated: number;
  categories_failing: number;
  url_failing: boolean | null;
  job_failing: boolean | null;
  interface_failing: boolean | null;
  critical_file_failing: boolean | null;
}

export interface Period {
  start_date: string;
  end_date: string;
}

export interface KpiResponse {
  period: Period;
  total_applications: number;
  pct_green_latest: number;
  latest_health_date: string;
  change_success_rate: number;
  change_success_rate_delta: number;
  four_eye_completion_rate: number;
  four_eye_completion_rate_delta: number;
}

export interface HealthSummaryResponse {
  period: Period;
  overall: Record<HealthStatus, number>;
  overall_entities: Record<HealthStatus, string[]>;
  per_team: Record<string, Record<HealthStatus, number>>;
  per_team_entities: Record<string, Record<HealthStatus, string[]>>;
}

export interface TrendBucket {
  bucket: string;
  counts: Record<string, number>;
  entities?: Record<string, string[]>;
}

export interface TrendResponse {
  granularity: Granularity;
  period: Period;
  buckets: TrendBucket[];
}

export interface ChangeSummaryResponse {
  period: Period;
  total_changes: number;
  change_status: Record<string, number>;
  change_status_entities: Record<string, string[]>;
  four_eye_status: Record<string, number>;
  four_eye_status_entities: Record<string, string[]>;
}

export interface ChangeItem {
  id: number;
  cr_number: string;
  application_id: number;
  application_name: string;
  tower_name: string;
  assignment_group: string | null;
  description: string | null;
  assigned_to: string | null;
  change_status: string;
  four_eye_status: string;
  date: string;
}

export interface ChangesResponse {
  total: number;
  page: number;
  page_size: number;
  items: ChangeItem[];
}

export interface MonitoringSummaryResponse extends TrendResponse {
  category: string;
}

export interface MonitoringItem {
  item_name: string;
  date: string;
  status: string;
}

export interface HealthCalendarEntry {
  date: string;
  health_status: HealthStatus;
}

export interface UploadResult {
  rows_read: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
  affected_app_dates: number;
}

export interface UploadHistoryEntry {
  id: number;
  category: string;
  filename: string;
  uploaded_at: string;
  rows_read: number;
  rows_inserted: number;
  rows_updated: number;
  rows_skipped: number;
}

export type Granularity = "daily" | "weekly" | "monthly" | "yearly";

export type UploadCategory =
  | "change-deployments"
  | "url-availability"
  | "job-monitoring"
  | "interface-monitoring"
  | "critical-file-monitoring";

export interface DashboardFilters {
  granularity: Granularity;
  startDate?: string;
  endDate?: string;
  teamId?: number;
  applicationId?: number;
}
