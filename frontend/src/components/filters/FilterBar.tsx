import { Segmented, Select, DatePicker, Space } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useApplications, useTeams } from "../../api/hooks/useReferenceData";
import type { DashboardFilters, Granularity } from "../../types";

const { RangePicker } = DatePicker;

const GRANULARITY_OPTIONS: { label: string; value: Granularity }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export interface FilterBarProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  showTeamFilter?: boolean;
  showApplicationFilter?: boolean;
  showGranularity?: boolean;
}

export function FilterBar({
  filters,
  onChange,
  showTeamFilter = true,
  showApplicationFilter = true,
  showGranularity = true,
}: FilterBarProps) {
  const { data: teams } = useTeams();
  const { data: applications } = useApplications(filters.teamId);

  const rangeValue: [Dayjs, Dayjs] | undefined =
    filters.startDate && filters.endDate
      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
      : undefined;

  return (
    <Space wrap size="middle" style={{ marginBottom: 16 }}>
      {showGranularity && (
        <Segmented
          options={GRANULARITY_OPTIONS}
          value={filters.granularity}
          onChange={(value) => onChange({ ...filters, granularity: value as Granularity })}
        />
      )}
      <RangePicker
        value={rangeValue}
        onChange={(values) =>
          onChange({
            ...filters,
            startDate: values?.[0]?.format("YYYY-MM-DD"),
            endDate: values?.[1]?.format("YYYY-MM-DD"),
          })
        }
      />
      {showTeamFilter && (
        <Select
          allowClear
          placeholder="All Teams"
          style={{ minWidth: 180 }}
          value={filters.teamId}
          options={(teams ?? []).map((t) => ({ label: t.name, value: t.id }))}
          onChange={(value) =>
            onChange({ ...filters, teamId: value, applicationId: undefined })
          }
        />
      )}
      {showApplicationFilter && (
        <Select
          allowClear
          placeholder="All Applications"
          style={{ minWidth: 220 }}
          value={filters.applicationId}
          options={(applications ?? []).map((a) => ({ label: a.name, value: a.id }))}
          onChange={(value) => onChange({ ...filters, applicationId: value })}
        />
      )}
    </Space>
  );
}
