import { useNavigate } from "react-router-dom";
import { useCreatorTasks } from "../../../features/tasks/list/model/useCreatorTasks";
import { TaskListItem } from "../../../entities/task/ui/TaskListItem";
import type { Task } from "../../../entities/task/model/types";

export const CreatorDashboardPage = () => {
  const { data: tasks, isLoading, isError } = useCreatorTasks();
  const navigate = useNavigate();

  const handleOpenChat = (assigneeId: number) => {
    navigate(`/app/chat/${assigneeId}`);
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-sm text-slate-300">Загружаем задачи…</p>;
    }

    if (isError) {
      return (
        <p className="text-sm text-red-400">
          Не удалось загрузить задачи. Попробуйте обновить страницу.
        </p>
      );
    }

    const list = tasks ?? [];

    if (!list.length) {
      return (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700 px-6 py-5 max-w-xl">
          <h2 className="text-lg font-semibold mb-1">
            Задач для исполнителей пока нет
          </h2>
          <p className="text-sm text-slate-300">
            Как только вы создадите первую задачу, она появится здесь, а
            исполнители получат уведомление в Telegram.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Исполнитель (ФИО)</th>
              <th className="px-3 py-2 text-left">Должность</th>
              <th className="px-3 py-2 text-left">Задача</th>
              <th className="px-3 py-2 text-left">Приоритет</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-right">Уточнить детали</th>
            </tr>
          </thead>
          <tbody>
            {list.map((task: Task) => {
              const counterpartyName =
                task.assignee_name || "Не указан исполнитель";
              const counterpartyPosition = task.assignee_position || null;
              const assigneeId = task.assignee ?? null;

              return (
                <TaskListItem
                  key={task.id}
                  task={task}
                  counterpartyName={counterpartyName}
                  counterpartyPosition={counterpartyPosition}
                  onOpenChat={
                    assigneeId ? () => handleOpenChat(assigneeId) : undefined
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page">
      <h1 className="page-title">Задачи для исполнителей</h1>
      <p className="text-sm text-slate-300 mt-1 max-w-xl">
        Здесь собраны все задачи, которые вы уже поставили своей команде. Следите
        за прогрессом и обсуждайте детали в чате.
      </p>

      {renderContent()}
    </div>
  );
};
