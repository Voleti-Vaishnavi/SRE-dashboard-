import { useState } from "react";
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

const DATE_MODE_OPTIONS = [
  { label: "Range", value: "range" },
  { label: "Single Day", value: "single" },
] as const;

type DateMode = (typeof DATE_MODE_OPTIONS)[number]["value"];

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
  const [dateMode, setDateMode] = useState<DateMode>("range");

  const rangeValue: [Dayjs, Dayjs] | undefined =
    filters.startDate && filters.endDate
      ? [dayjs(filters.startDate), dayjs(filters.endDate)]
      : undefined;

  const singleValue: Dayjs | undefined =
    dateMode === "single" && filters.startDate ? dayjs(filters.startDate) : undefined;

  return (
    <Space wrap size="middle" style={{ marginBottom: 16 }}>
      {showGranularity && (
        <Segmented
          options={GRANULARITY_OPTIONS}
          value={filters.granularity}
          onChange={(value) => onChange({ ...filters, granularity: value as Granularity })}
        />
      )}

      <Segmented
        options={[...DATE_MODE_OPTIONS]}
        value={dateMode}
        onChange={(value) => {
          const mode = value as DateMode;
          setDateMode(mode);
          if (mode === "single") {
            const day = (filters.endDate ? dayjs(filters.endDate) : dayjs()).format("YYYY-MM-DD");
            onChange({ ...filters, granularity: "daily", startDate: day, endDate: day });
          } else {
            onChange({ ...filters, startDate: undefined, endDate: undefined });
          }
        }}
      />

      {dateMode === "single" ? (
        <DatePicker
          value={singleValue}
          onChange={(value) => {
            const day = value?.format("YYYY-MM-DD");
            onChange({ ...filters, startDate: day, endDate: day });
          }}
        />
      ) : (
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
      )}

      {showTeamFilter && (
        <Select
          allowClear
          placeholder="All Towers"
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
