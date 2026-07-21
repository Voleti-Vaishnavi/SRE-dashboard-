import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import type { UploadCategory, UploadHistoryEntry, UploadResult } from "../../types";

export async function downloadTemplate(category: UploadCategory) {
  const response = await apiClient.get(`/templates/${category}`, { responseType: "blob" });
  const disposition = response.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? `${category}_template.xlsx`;

  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function useUploadFile(category: UploadCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<UploadResult>(`/uploads/${category}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload-history", category] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["health-summary"] });
      queryClient.invalidateQueries({ queryKey: ["health-trend"] });
      queryClient.invalidateQueries({ queryKey: ["change-summary"] });
      queryClient.invalidateQueries({ queryKey: ["change-trend"] });
      queryClient.invalidateQueries({ queryKey: ["monitoring-summary"] });
      queryClient.invalidateQueries({ queryKey: ["changes"] });
    },
  });
}

export function useUploadHistory(category: UploadCategory) {
  return useQuery({
    queryKey: ["upload-history", category],
    queryFn: async () =>
      (
        await apiClient.get<UploadHistoryEntry[]>("/uploads/history", {
          params: { category, limit: 10 },
        })
      ).data,
  });
}
