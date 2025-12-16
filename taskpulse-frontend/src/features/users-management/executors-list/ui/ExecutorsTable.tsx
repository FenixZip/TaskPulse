// src/features/users-management/executors-list/ui/ExecutorsTable.tsx
import { useState } from "react";
import { useExecutors, type Executor } from "../model/useExecutors";
import { Button } from "../../../../shared/ui/Button";
import { CreateTaskModal } from "../../../tasks/create-task/ui/CreateTaskModal";

export const ExecutorsTable = () => {
  const { data, isLoading, isError } = useExecutors();
  const executors = data ?? [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);

  const openAssignTask = (ex: Executor) => {
    setAssigneeId(ex.id);
    setAssigneeName(ex.full_name || ex.email);
    setIsCreateOpen(true);
  };

  const closeAssignTask = () => {
    setIsCreateOpen(false);
    setAssigneeId(null);
    setAssigneeName(null);
  };

  const handleDelete = (ex: Executor) => {
    // здесь можно будет повесить реальное удаление, когда появится API
    // eslint-disable-next-line no-alert
    alert(`Удаление исполнителя "${ex.full_name || ex.email}" пока не реализовано.`);
  };

  const handleArchive = (ex: Executor) => {
    // eslint-disable-next-line no-alert
    alert(
      `Архивирование исполнителя "${ex.full_name || ex.email}" пока не реализовано.`,
    );
  };

  const handleOpenChat = (ex: Executor) => {
    const event = new CustomEvent("open-chat-from-task", {
      detail: {
        peerId: ex.id,
      },
    });

    window.dispatchEvent(event);
  };

  if (isLoading) {
    return <div className="executors-table-message">Загружаем исполнителей…</div>;
  }

  if (isError) {
    return (
      <div className="executors-table-message executors-table-message--error">
        Не удалось загрузить список исполнителей.
      </div>
    );
  }

  if (!executors.length) {
    return (
      <div className="executors-table-message">
        Исполнителей пока нет. Отправьте приглашение по e-mail, чтобы добавить первого.
      </div>
    );
  }

  return (
    <>
      <div className="executors-table-wrapper">
        <table className="executors-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Компания</th>
              <th>Должность</th>
              <th>E-mail</th>
              <th className="executors-table__actions-header">Действия</th>
            </tr>
          </thead>

          <tbody>
            {executors.map((ex) => (
              <tr key={ex.id}>
                <td>{ex.full_name || "Не указано"}</td>
                <td>{ex.company || "—"}</td>
                <td>{ex.position || "—"}</td>
                <td>{ex.email}</td>

                <td>
                  <div className="executors-table__actions">
                    <Button type="button" variant="ghost" onClick={() => handleDelete(ex)}>
                      Удалить
                    </Button>

                    <Button type="button" variant="ghost" onClick={() => handleArchive(ex)}>
                      Архивировать
                    </Button>

                    <Button type="button" variant="primary" onClick={() => handleOpenChat(ex)}>
                      Написать
                    </Button>

                    {/* + = назначить задачу (открыть модалку с уже выбранным исполнителем) */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openAssignTask(ex)}
                      aria-label={`Назначить задачу: ${ex.full_name || ex.email}`}
                      title="Назначить задачу"
                    >
                      +
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
        onClose={closeAssignTask}
        assigneeId={assigneeId}
        assigneeName={assigneeName}
      />
    </>
  );
};
