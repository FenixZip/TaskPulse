import type { TaskStatus } from "../model/types";

interface Props {
  status: TaskStatus;
}

const labelMap: Partial<Record<TaskStatus, string>> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
  overdue: "Нарушение",
};

export const TaskStatusBadge = ({ status }: Props) => {
  let borderClass = "border-slate-400";
  if (status === "in_progress") borderClass = "border-blue-400";
  if (status === "done") borderClass = "border-green-400";
  if (status === "overdue") borderClass = "border-red-500";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${borderClass}`}
    >
      {labelMap[status] ?? status}
    </span>
  );
};
