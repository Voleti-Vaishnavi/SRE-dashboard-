import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { ApplicationRef, Team } from "../../types";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => (await apiClient.get<Team[]>("/teams")).data,
    staleTime: Infinity,
  });
}

export function useApplications(teamId?: number) {
  return useQuery({
    queryKey: ["applications", teamId],
    queryFn: async () =>
      (
        await apiClient.get<ApplicationRef[]>("/applications", {
          params: teamId ? { team_id: teamId } : {},
        })
      ).data,
    staleTime: Infinity,
  });
}

export function useApplication(applicationId?: number) {
  return useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () =>
      (await apiClient.get<ApplicationRef>(`/applications/${applicationId}`)).data,
    enabled: applicationId !== undefined,
  });
}
