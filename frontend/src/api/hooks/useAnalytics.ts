import { useQuery } from "@tanstack/react-query";
import { apiClient, buildParams } from "../client";
import type {
  ChangeSummaryResponse,
  ChangesResponse,
  DailyHealth,
  DashboardFilters,
  HealthCalendarEntry,
  HealthSummaryResponse,
  KpiResponse,
  MonitoringItem,
  MonitoringSummaryResponse,
  TrendResponse,
} from "../../types";

function filterParams(filters: DashboardFilters) {
  return buildParams({
    granularity: filters.granularity,
    start_date: filters.startDate,
    end_date: filters.endDate,
    team_id: filters.teamId,
    application_id: filters.applicationId,
  });
}

export function useKpis(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["kpis", filters],
    queryFn: async () =>
      (await apiClient.get<KpiResponse>("/analytics/kpis", { params: filterParams(filters) })).data,
  });
}

export function useHealthSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["health-summary", filters],
    queryFn: async () =>
      (
        await apiClient.get<HealthSummaryResponse>("/analytics/health-summary", {
          params: filterParams(filters),
        })
      ).data,
  });
}

export function useHealthTrend(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["health-trend", filters],
    queryFn: async () =>
      (
        await apiClient.get<TrendResponse>("/analytics/health-trend", {
          params: filterParams(filters),
        })
      ).data,
  });
}

export function useChangeSummary(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["change-summary", filters],
    queryFn: async () =>
      (
        await apiClient.get<ChangeSummaryResponse>("/analytics/change-summary", {
          params: filterParams(filters),
        })
      ).data,
  });
}

export function useChangeTrend(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["change-trend", filters],
    queryFn: async () =>
      (
        await apiClient.get<TrendResponse>("/analytics/change-trend", {
          params: filterParams(filters),
        })
      ).data,
  });
}

export function useMonitoringSummary(category: string, filters: DashboardFilters) {
  return useQuery({
    queryKey: ["monitoring-summary", category, filters],
    queryFn: async () =>
      (
        await apiClient.get<MonitoringSummaryResponse>("/analytics/monitoring-summary", {
          params: { ...filterParams(filters), category },
        })
      ).data,
  });
}

export interface ChangesQuery extends DashboardFilters {
  page: number;
  pageSize: number;
  sort?: string;
  changeStatus?: string;
  fourEyeStatus?: string;
}

export function useChanges(query: ChangesQuery) {
  return useQuery({
    queryKey: ["changes", query],
    queryFn: async () =>
      (
        await apiClient.get<ChangesResponse>("/analytics/changes", {
          params: buildParams({
            start_date: query.startDate,
            end_date: query.endDate,
            team_id: query.teamId,
            application_id: query.applicationId,
            change_status: query.changeStatus,
            four_eye_status: query.fourEyeStatus,
            page: query.page,
            page_size: query.pageSize,
            sort: query.sort,
          }),
        })
      ).data,
  });
}

export function useDailyHealth(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["health-daily", filters],
    queryFn: async () =>
      (
        await apiClient.get<DailyHealth[]>("/health/daily", {
          params: filterParams(filters),
        })
      ).data,
  });
}

/** Reduces a list of daily health rows to the single latest row per application. */
export function latestHealthByApplication(rows: DailyHealth[] | undefined): Map<number, DailyHealth> {
  const latest = new Map<number, DailyHealth>();
  for (const row of rows ?? []) {
    const current = latest.get(row.application_id);
    if (!current || row.date > current.date) {
      latest.set(row.application_id, row);
    }
  }
  return latest;
}

export function useMonitoringItems(
  category: "job" | "interface" | "critical_file",
  applicationId: number | undefined
) {
  return useQuery({
    queryKey: ["monitoring-items", category, applicationId],
    queryFn: async () =>
      (
        await apiClient.get<MonitoringItem[]>("/analytics/monitoring-items", {
          params: { category, application_id: applicationId },
        })
      ).data,
    enabled: applicationId !== undefined,
  });
}

/** Reduces raw item rows (multiple dates per item) to the latest status per item name. */
export function latestByItemName(rows: MonitoringItem[] | undefined): MonitoringItem[] {
  const latest = new Map<string, MonitoringItem>();
  for (const row of rows ?? []) {
    const current = latest.get(row.item_name);
    if (!current || row.date > current.date) {
      latest.set(row.item_name, row);
    }
  }
  return Array.from(latest.values()).sort((a, b) => a.item_name.localeCompare(b.item_name));
}

export function useHealthCalendar(applicationId: number | undefined, year: number) {
  return useQuery({
    queryKey: ["health-calendar", applicationId, year],
    queryFn: async () =>
      (
        await apiClient.get<HealthCalendarEntry[]>(
          `/analytics/application/${applicationId}/health-calendar`,
          { params: { year } }
        )
      ).data,
    enabled: applicationId !== undefined,
  });
}
