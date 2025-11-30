import type { TaskPriority } from "../model/types";

interface Props {
  priority: TaskPriority;
}

const labelMap: Record<TaskPriority, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

export const TaskPriorityBadge = ({ priority }: Props) => {
  let borderClass = "border-green-400";
  if (priority === "medium") borderClass = "border-yellow-400";
  if (priority === "high") borderClass = "border-red-500";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${borderClass}`}
    >
      {labelMap[priority] ?? priority}
    </span>
  );
};
