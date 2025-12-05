import type { Task } from "../model/types";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";

interface Props {
  task: Task;
  // id собеседника (исполнитель для создателя или наоборот)
  counterpartyName: string;
  counterpartyPosition?: string | null;
  onOpenChat?: () => void;
}

export const TaskListItem = ({
  task,
  counterpartyName,
  counterpartyPosition,
  onOpenChat,
}: Props) => {
  return (
    <tr className="border-b border-slate-800/60">
      <td className="px-3 py-2">
        <div className="font-medium text-sm">{counterpartyName}</div>
        {counterpartyPosition && (
          <div className="text-xs text-slate-400">{counterpartyPosition}</div>
        )}
      </td>

      <td className="px-3 py-2 align-top">
        <div className="font-medium text-sm">{task.title}</div>
        {task.description && (
          <div className="text-xs text-slate-300 mt-0.5 line-clamp-3">
            {task.description}
          </div>
        )}
      </td>

      <td className="px-3 py-2 align-top">
        {task.priority && <TaskPriorityBadge priority={task.priority} />}
      </td>

      <td className="px-3 py-2 align-top">
        {task.status && <TaskStatusBadge status={task.status} />}
      </td>

      <td className="px-3 py-2 align-top text-right">
        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="text-xs px-3 py-1 rounded-full border border-yellow-400 hover:bg-yellow-400 hover:text-black transition-colors"
          >
            Уточнить детали
          </button>
        )}
      </td>
    </tr>
  );
};
