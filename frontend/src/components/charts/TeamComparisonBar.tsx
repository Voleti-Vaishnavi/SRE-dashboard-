import { Column } from "@ant-design/plots";
import { HEALTH_COLORS } from "../../theme/colors";
import type { HealthStatus, Team } from "../../types";

const ORDER: HealthStatus[] = ["Green", "Amber", "Red", "No Data"];

export interface TeamComparisonBarProps {
  perTeam: Record<string, Record<string, number>>;
  teams: Team[];
}

export function TeamComparisonBar({ perTeam, teams }: TeamComparisonBarProps) {
  const teamNameById = new Map(teams.map((t) => [String(t.id), t.name]));
  const data = Object.entries(perTeam).flatMap(([teamId, counts]) =>
    ORDER.map((status) => ({
      team: teamNameById.get(teamId) ?? teamId,
      status,
      count: counts[status] ?? 0,
    }))
  );

  return (
    <Column
      data={data}
      xField="team"
      yField="count"
      colorField="status"
      stack
      scale={{
        color: { type: "ordinal", domain: ORDER, range: ORDER.map((s) => HEALTH_COLORS[s]) },
      }}
      legend={{ color: { position: "bottom", layout: { justifyContent: "center" } } }}
      autoFit
    />
  );
}
