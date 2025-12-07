// src/features/users-management/executors-list/ui/ExecutorsTable.tsx
import { useState, useMemo } from "react";
import { useExecutors } from "../model/useExecutors";
import { Button } from "../../../../shared/ui/Button";
import { CreateTaskModal } from "../../../tasks/create-task/ui/CreateTaskModal";
import { Input } from "../../../../shared/ui/Input";

export const ExecutorsTable = () => {
  const { data, isLoading, isError } = useExecutors();

  const [selectedExecutorId, setSelectedExecutorId] = useState<number | null>(
    null
  );
  const [selectedExecutorName, setSelectedExecutorName] = useState<
    string | null
  >(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [searchName, setSearchName] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchPosition, setSearchPosition] = useState("");

  const filteredExecutors = useMemo(() => {
    const list = data ?? [];
    const nameQ = searchName.trim().toLowerCase();
    const companyQ = searchCompany.trim().toLowerCase();
    const positionQ = searchPosition.trim().toLowerCase();

    return list.filter((ex) => {
      if (
        nameQ &&
        !(ex.full_name || ex.email || "")
          .toLowerCase()
          .includes(nameQ)
      ) {
        return false;
      }

      if (
        companyQ &&
        !(ex.company || "")
          .toLowerCase()
          .includes(companyQ)
      ) {
        return false;
      }

      if (
        positionQ &&
        !(ex.position || "")
          .toLowerCase()
          .includes(positionQ)
      ) {
        return false;
      }

      return true;
    });
  }, [data, searchName, searchCompany, searchPosition]);

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
    return (
      <div className="mt-4 text-sm text-[var(--text-secondary)]">
        Загружаем исполнителей…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mt-4 text-sm text-red-400">
        Не удалось загрузить список исполнителей.
      </div>
    );
  }

  if (!filteredExecutors.length) {
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
      {/* Фильтры */}
      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
        <Input
          label="ФИО / e-mail"
          placeholder="Фильтр по имени или e-mail"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <Input
          label="Компания"
          placeholder="Фильтр по компании"
          value={searchCompany}
          onChange={(e) => setSearchCompany(e.target.value)}
        />
        <Input
          label="Должность"
          placeholder="Фильтр по должности"
          value={searchPosition}
          onChange={(e) => setSearchPosition(e.target.value)}
        />
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-sm border border-[var(--border-subtle)] rounded-2xl overflow-hidden">
          <thead className="text-xs uppercase text-[var(--text-secondary)] border-b border-[var(--border-subtle)] bg-black/30">
            <tr>
              <th className="px-3 py-2 text-left">ФИО</th>
              <th className="px-3 py-2 text-left">Компания</th>
              <th className="px-3 py-2 text-left">Должность</th>
              <th className="px-3 py-2 text-left">E-mail</th>
              <th className="px-3 py-2 text-right">
                Удалить / Архивировать / Назначить
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExecutors.map((ex) => (
              <tr
                key={ex.id}
                className="border-b border-[var(--border-subtle)] last:border-b-0"
              >
                <td className="px-3 py-2">
                  {ex.full_name || "Не указано"}
                </td>
                <td className="px-3 py-2">{ex.company || "—"}</td>
                <td className="px-3 py-2">{ex.position || "—"}</td>
                <td className="px-3 py-2">{ex.email}</td>
                <td className="px-3 py-2 text-right space-x-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      // TODO: реализовать удаление, когда появится API
                      // eslint-disable-next-line no-alert
                      alert(
                        "Удаление исполнителя пока не реализовано на фронте.",
                      );
                    }}
                  >
                    Удалить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      // TODO: реализовать архивацию, когда появится API
                      // eslint-disable-next-line no-alert
                      alert(
                        "Архивация исполнителя пока не реализована на фронте.",
                      );
                    }}
                  >
                    Архивировать
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      openCreateTask(ex.id, ex.full_name || ex.email)
                    }
                  >
                    Назначить задачу
                  </Button>
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
