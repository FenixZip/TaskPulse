// src/pages/dashboard/StatsPage.tsx
import { useMemo, useState } from "react";
import { useAuth } from "../../shared/hooks/useAuth";
import { useTasks } from "../../features/tasks/list/model/useTasks";
import {
  useExecutors,
  type Executor,
} from "../../features/users-management/executors-list/model/useExecutors";

type NormalizedRole = "creator" | "executor" | null;

const normalizeRole = (value: string | null | undefined): NormalizedRole => {
  if (!value) return null;
  if (value === "CREATOR" || value === "creator") return "creator";
  if (value === "EXECUTOR" || value === "executor") return "executor";
  return null;
};

type Period = "current_month" | "all";

const getCurrentMonthBounds = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { from, to };
};

interface ExecutorStatRow {
  id: number;
  full_name: string;
  company: string;
  position: string;
  totalTasks: number;
  overdueTasks: number;
  efficiency: number; // %
}

export const StatsPage = () => {
  const { auth } = useAuth();
  const role = normalizeRole(auth.user?.role);

  const { data: tasks, isLoading: tasksLoading, isError: tasksError } = useTasks();
  const {
    data: executors,
    isLoading: execLoading,
    isError: execError,
  } = useExecutors();

  const [period, setPeriod] = useState<Period>("current_month");

  const { from, to } = useMemo(() => {
    if (period === "current_month") {
      return getCurrentMonthBounds();
    }
    return { from: null, to: null } as { from: Date | null; to: Date | null };
  }, [period]);

  const stats: ExecutorStatRow[] = useMemo(() => {
    if (!tasks || !executors) return [];

    const now = new Date();

    const execMap = new Map<number, ExecutorStatRow>(
      executors.map((e: Executor) => [
        e.id,
        {
          id: e.id,
          full_name: e.full_name || e.email,
          company: e.company || 'OOO "Pulse-zone.tech"',
          position: e.position || "—",
          totalTasks: 0,
          overdueTasks: 0,
          efficiency: 0,
        },
      ]),
    );

    for (const task of tasks) {
      if (!task.assignee) continue;

      const assigneeId = task.assignee;
      const row = execMap.get(assigneeId);
      if (!row) continue;

      // фильтр по периоду — используем дедлайн
      if (from || to) {
        if (!task.due_at) continue;
        const due = new Date(task.due_at);
        if (Number.isNaN(due.getTime())) continue;
        if (from && due < from) continue;
        if (to && due > to) continue;
      }

      row.totalTasks += 1;

      const due = task.due_at ? new Date(task.due_at) : null;
      const isOverdue =
        task.status === "overdue" ||
        (due && due < now && task.status !== "done");

      if (isOverdue) {
        row.overdueTasks += 1;
      }
    }

    for (const row of execMap.values()) {
      if (row.totalTasks > 0) {
        const doneCount = row.totalTasks - row.overdueTasks;
        row.efficiency = Math.round((doneCount / row.totalTasks) * 100);
      } else {
        row.efficiency = 0;
      }
    }

    return Array.from(execMap.values()).sort(
      (a, b) => b.efficiency - a.efficiency,
    );
  }, [tasks, executors, from, to]);

  const handleExport = () => {
    if (!stats.length) return;

    const header = [
      "ФИО",
      "Компания",
      "Должность",
      "Количество задач",
      "Дедлайны нарушены",
      "Процент эффективности",
    ];

    const rows = stats.map((s) => [
      s.full_name,
      s.company,
      s.position,
      String(s.totalTasks),
      String(s.overdueTasks),
      `${s.efficiency}%`,
    ]);

    const csvContent =
      [header, ...rows]
        .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
        .join("\n") + "\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stats_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== "creator") {
    return (
      <div className="page">
        <h1 className="page-title">Статистика</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
          Раздел доступен только создателям задач.
        </p>
      </div>
    );
  }

  if (tasksLoading || execLoading) {
    return <div className="page">Загружаем статистику…</div>;
  }

  if (tasksError || execError) {
    return (
      <div className="page">
        <h1 className="page-title">Статистика</h1>
        <p className="text-sm text-red-400 mt-1">
          Не удалось загрузить данные для отчёта.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex flex-col items-center gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Статистика исполнителей</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
            Эффективность по количеству задач и нарушенным дедлайнам за выбранный
            период.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <select
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)]"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            <option value="current_month">Текущий месяц</option>
            <option value="all">Всё время</option>
          </select>

          <button
            type="button"
            className="app-nav-link app-nav-link-primary"
            onClick={handleExport}
          >
            Выгрузить отчёт
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)]">
              <th className="px-3 py-2 text-left">ФИО</th>
              <th className="px-3 py-2 text-left">Компания</th>
              <th className="px-3 py-2 text-left">Должность</th>
              <th className="px-3 py-2 text-right">Количество задач</th>
              <th className="px-3 py-2 text-right">Дедлайны нарушены</th>
              <th className="px-3 py-2 text-right">Процент эффективности</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <td className="px-3 py-2">{row.full_name}</td>
                <td className="px-3 py-2">{row.company}</td>
                <td className="px-3 py-2">{row.position}</td>
                <td className="px-3 py-2 text-right">{row.totalTasks}</td>
                <td className="px-3 py-2 text-right">
                  {row.overdueTasks || "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  {row.totalTasks === 0 ? "—" : `${row.efficiency}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
