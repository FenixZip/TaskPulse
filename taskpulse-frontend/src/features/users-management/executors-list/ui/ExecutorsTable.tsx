// src/features/users-management/executors-list/ui/ExecutorsTable.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExecutors } from "../model/useExecutors";
import { Button } from "../../../../shared/ui/Button";
import { CreateTaskModal } from "../../../tasks/create-task/ui/CreateTaskModal";

export const ExecutorsTable = () => {
  const { data, isLoading, isError } = useExecutors();
  const navigate = useNavigate();

  const [selectedExecutorId, setSelectedExecutorId] = useState<number | null>(
    null
  );
  const [selectedExecutorName, setSelectedExecutorName] = useState<
    string | null
  >(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const openCreateTask = (id: number, name: string | null) => {
    setSelectedExecutorId(id);
    setSelectedExecutorName(name);
    setIsCreateOpen(true);
  };

  const closeCreateTask = () => {
    setIsCreateOpen(false);
    setSelectedExecutorId(null);
    setSelectedExecutorName(null);
  };

  if (isLoading) {
    return <div className="tasks-empty">Загружаем исполнителей…</div>;
  }

  if (isError) {
    return (
      <div className="tasks-empty">
        Не удалось загрузить исполнителей. Попробуйте позже.
      </div>
    );
  }

  const executors = data ?? [];

  if (!executors.length) {
    return (
      <>
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--border-subtle)] px-6 py-5 max-w-xl">
          <h2 className="text-base font-semibold mb-1">
            Исполнителей пока нет
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Отправьте приглашение по e-mail, чтобы добавить первого исполнителя
            в команду.
          </p>
        </div>
        <CreateTaskModal
          isOpen={isCreateOpen}
          onClose={closeCreateTask}
          assigneeId={selectedExecutorId}
          assigneeName={selectedExecutorName ?? undefined}
        />
      </>
    );
  }

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-xs uppercase text-[var(--text-secondary)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-3 py-2 text-left">Имя и отчество</th>
              <th className="px-3 py-2 text-left">Должность</th>
              <th className="px-3 py-2 text-left">E-mail</th>
              <th className="px-3 py-2 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {executors.map((ex) => (
              <tr
                key={ex.id}
                className="border-b border-[var(--border-subtle)]"
              >
                <td className="px-3 py-2">
                  {ex.full_name || "Без имени"}
                </td>
                <td className="px-3 py-2">{ex.position || "—"}</td>
                <td className="px-3 py-2">{ex.email}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        navigate(`/app?assignee=${ex.id}`)
                      }
                    >
                      Показать задачи
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        openCreateTask(ex.id, ex.full_name || ex.email)
                      }
                    >
                      Назначить задачу
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        const search = new URLSearchParams();
                        search.set(
                          "name",
                          ex.full_name || ex.email || "Исполнитель"
                        );
                        navigate(
                          `/app/chat/${ex.id}?${search.toString()}`
                        );
                      }}
                    >
                      Открыть чат
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={closeCreateTask}
        assigneeId={selectedExecutorId}
        assigneeName={selectedExecutorName ?? undefined}
      />
    </>
  );
};
