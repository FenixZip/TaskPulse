import React, { useEffect, useState } from "react";
import {
  fetchMonthlyReport,
  downloadMonthlyReportCsv,
  type MonthlyKpi,
} from "../../api/reportsApi";
import { useAuth } from "../../hooks/useAuth";

export const MonthlyReportPage: React.FC = () => {
  const { user } = useAuth();

  const [month, setMonth] = useState(() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${now.getFullYear()}-${mm}`;
  });

  const [report, setReport] = useState<MonthlyKpi | null>(null);
  const [loading, setLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMonthlyReport(month, "me");
      setReport(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось загрузить отчёт."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadReport();
  };

  const handleDownloadCsv = async () => {
    setCsvLoading(true);
    setError(null);
    try {
      const blob = await downloadMonthlyReportCsv(month, "me");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-report-${month}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? "Не удалось скачать CSV отчёт."
      );
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div>
      <h1>Отчёт за месяц</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <label>
          Месяц:{" "}
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button type="submit" style={{ marginLeft: 8 }}>
          Обновить
        </button>
        <button
          type="button"
          onClick={handleDownloadCsv}
          disabled={csvLoading}
          style={{ marginLeft: 8 }}
        >
          {csvLoading ? "Скачиваем..." : "Скачать CSV"}
        </button>
      </form>

      {user && (
        <p>
          Отчёт по пользователю: {user.full_name} (id: {user.id})
        </p>
      )}

      {loading && <div>Загрузка отчёта...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {!loading && !error && report && (
        <div>
          <h2>Итого за {report.month}</h2>
          <p>Всего задач с дедлайном в этом месяце: {report.total}</p>
          <p>Выполнено: {report.done}</p>
          <p>Выполнено вовремя: {report.done_on_time}</p>
          <p>Выполнено с опозданием: {report.done_late}</p>

          <h3 style={{ marginTop: 16 }}>По приоритетам</h3>
          <table
            style={{
              borderCollapse: "collapse",
              minWidth: 400,
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid #ccc", padding: 4 }}>
                  Приоритет
                </th>
                <th style={{ border: "1px solid #ccc", padding: 4 }}>Всего</th>
                <th style={{ border: "1px solid #ccc", padding: 4 }}>
                  Выполнено
                </th>
                <th style={{ border: "1px solid #ccc", padding: 4 }}>
                  Вовремя
                </th>
                <th style={{ border: "1px solid #ccc", padding: 4 }}>
                  С опозданием
                </th>
              </tr>
            </thead>
            <tbody>
              {report.by_priority.map((p) => (
                <tr key={p.priority}>
                  <td style={{ border: "1px solid #ccc", padding: 4 }}>
                    {p.priority}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 4 }}>
                    {p.total}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 4 }}>
                    {p.done}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 4 }}>
                    {p.done_on_time}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: 4 }}>
                    {p.done_late}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
