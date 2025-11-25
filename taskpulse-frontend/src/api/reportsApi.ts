// src/api/reportsApi.ts

import api from "./axiosInstance";

export interface PriorityKpi {
  priority: string;
  total: number;
  done: number;
  done_on_time: number;
  done_late: number;
}

export interface MonthlyKpi {
  user_id: number;
  month: string; // "YYYY-MM"
  total: number;
  done: number;
  done_on_time: number;
  done_late: number;
  by_priority: PriorityKpi[];
}

export async function fetchMonthlyReport(
  month: string,
  user: "me" | number = "me"
): Promise<MonthlyKpi> {
  const response = await api.get<MonthlyKpi>("/reports/monthly/", {
    params: {
      month,
      user,
      format: "json",
    },
  });
  return response.data;
}

export async function downloadMonthlyReportCsv(
  month: string,
  user: "me" | number = "me"
): Promise<Blob> {
  const response = await api.get<Blob>("/reports/monthly/", {
    params: {
      month,
      user,
      format: "csv",
    },
    responseType: "blob",
  });
  return response.data;
}
