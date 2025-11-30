// src/pages/dashboard/executor/ExecutorDashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { useExecutorTasks } from "../../../features/tasks/list/model/useExecutorTasks";
import { TaskListItem } from "../../../entities/task/ui/TaskListItem";
import type { Task } from "../../../entities/task/model/types";

export const ExecutorDashboardPage = () => {
  const { data: tasks, isLoading, isError } = useExecutorTasks();
  const navigate = useNavigate();

  const handleOpenChat = (creatorId: number) => {
    navigate(`/app/chat/${creatorId}`);
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
            Вам пока не назначили ни одной задачи
          </h2>
          <p className="text-sm text-slate-300">
            Как только создатель поставит первую задачу, она появится здесь, а вы
            получите уведомление в Telegram.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-slate-400 border-b border-slate-700">
            <tr>
              <th className="px-3 py-2 text-left">Постановщик (ФИО)</th>
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
                task.creator_name || "Постановщик не указан";
              const counterpartyPosition = task.creator_position || null;
              const creatorId = task.creator ?? null;

              return (
                <TaskListItem
                  key={task.id}
                  task={task}
                  counterpartyName={counterpartyName}
                  counterpartyPosition={counterpartyPosition}
                  onOpenChat={
                    creatorId ? () => handleOpenChat(creatorId) : undefined
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
      <h1 className="page-title">Мои задачи</h1>
      <p className="text-sm text-slate-300 mt-1 max-w-xl">
        Здесь вы видите все задачи, которые вам поставили. Меняйте статус и
        уточняйте детали напрямую с создателем в чате.
      </p>

      {renderContent()}
    </div>
  );
};
