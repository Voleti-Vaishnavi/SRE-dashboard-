import { Tooltip } from "antd";
import { HEALTH_COLORS } from "../../theme/colors";
import type { HealthCalendarEntry } from "../../types";

export interface HealthCalendarHeatmapProps {
  entries: HealthCalendarEntry[];
  year: number;
}

const EMPTY_CELL = "#e1e0d9";

export function HealthCalendarHeatmap({ entries, year }: HealthCalendarHeatmapProps) {
  const statusByDate = new Map(entries.map((e) => [e.date, e.health_status]));

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  const startWeekday = (start.getUTCDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(start);
  gridStart.setUTCDate(start.getUTCDate() - startWeekday);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div style={{ display: "flex", gap: 3, overflowX: "auto", padding: 4 }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {week.map((d, di) => {
            const inYear = d.getUTCFullYear() === year;
            const iso = d.toISOString().slice(0, 10);
            const status = statusByDate.get(iso);
            const color = !inYear ? "transparent" : status ? HEALTH_COLORS[status] : EMPTY_CELL;
            const cell = (
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: color,
                  visibility: inYear ? "visible" : "hidden",
                }}
              />
            );
            return inYear ? (
              <Tooltip key={di} title={`${iso}: ${status ?? "No Data"}`}>
                {cell}
              </Tooltip>
            ) : (
              <div key={di}>{cell}</div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
