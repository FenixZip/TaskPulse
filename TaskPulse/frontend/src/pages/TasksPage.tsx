// @ts-nocheck
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks } from "../hooks/useTasks";
import { useExecutors } from "../hooks/useExecutors";
import {
  createTask,
  completeTask,
  uploadTaskResult,
} from "../api/tasksApi";
import { getCurrentUser } from "../api/auth";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Сделана",
  overdue: "Просрочена",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

const SORT_FIELD_TITLES: Record<string, string> = {
  executor: "Исполнитель",
  position: "Должность",
  title: "Название",
  description: "Описание задачи",
  priority: "Приоритет",
  due_at: "Дедлайн",
  status: "Статус",
};

export function TasksPage() {
  const user = getCurrentUser();
  const isCreator = user?.role === "CREATOR";
  const queryClient = useQueryClient();

  const [tab, setTab] = useState(0);

  // фильтры
  const [status, setStatus] = useState<string>("all");
  const [onlyMine, setOnlyMine] = useState<boolean>(true);
  const [search, setSearch] = useState("");

  const filters: Record<string, any> = {};
  if (status !== "all") filters.status = status;
  if (isCreator && onlyMine) filters.only_my = true;

  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
  } = useTasks(filters);

  const {
    data: executors = [],
    isLoading: execLoading,
    isError: execError,
  } = useExecutors();

  const executorById = useMemo(() => {
    const map = new Map<number, any>();
    (executors ?? []).forEach((ex: any) => map.set(ex.id, ex));
    return map;
  }, [executors]);

  // --- состояние формы создания задачи ---
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newAssigneeId, setNewAssigneeId] = useState<number | "">("");
  const [newDue, setNewDue] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  function openCreateTask(assigneeId?: number) {
    if (assigneeId) setNewAssigneeId(assigneeId);
    setCreateOpen(true);
  }

  async function handleCreateTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newAssigneeId) {
      setCreateError("Выберите исполнителя");
      return;
    }
    setCreateError(null);
    setCreateLoading(true);

    try {
      const dueIso = newDue ? new Date(newDue).toISOString() : null;
      await createTask({
        title: newTitle,
        description: newDescription || undefined,
        priority: newPriority,
        assignee: Number(newAssigneeId),
        due_at: dueIso,
        file: newFile,
      });

      await queryClient.invalidateQueries({ queryKey: ["tasks"] });

      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewAssigneeId("");
      setNewDue("");
      setNewFile(null);
      setCreateOpen(false);
    } catch (err: any) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors ||
        "Не удалось создать задачу.";
      setCreateError(
        typeof detail === "string" ? detail : "Не удалось создать задачу."
      );
    } finally {
      setCreateLoading(false);
    }
  }

  // --- приглашение исполнителя ---
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleInvite() {
    setInviteError(null);
    setInviteSuccess(null);

    if (!inviteEmail) {
      setInviteError("Укажите email исполнителя");
      return;
    }

    setInviteLoading(true);
    try {
      const { inviteExecutor } = await import("../api/executorsApi");
      await inviteExecutor(inviteEmail);

      setInviteSuccess("Приглашение отправлено");
      setInviteEmail("");
      await queryClient.invalidateQueries({ queryKey: ["executors"] });
    } catch (err: any) {
      console.error(err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.email ||
        "Не удалось отправить приглашение.";
      setInviteError(
        typeof detail === "string" ? detail : "Не удалось отправить приглашение."
      );
    } finally {
      setInviteLoading(false);
    }
  }

  // --- сортировка по заголовкам ---
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortAnchorEl, setSortAnchorEl] = useState<HTMLElement | null>(null);
  const [sortFieldKey, setSortFieldKey] = useState<string | null>(null);

  function openSortMenu(fieldKey: string) {
    return (event: React.MouseEvent<HTMLElement>) => {
      setSortFieldKey(fieldKey);
      setSortAnchorEl(event.currentTarget);
    };
  }

  function handleSort(order: "asc" | "desc") {
    if (sortFieldKey) {
      setSortField(sortFieldKey);
      setSortOrder(order);
    }
    setSortAnchorEl(null);
  }

  function handleSortReset() {
    setSortField(null);
    setSortAnchorEl(null);
  }

  const rawTasks = tasks ?? [];

  // общий поиск: ФИО/должность (для создателя — по исполнителю, для исполнителя — по создателю),
  // плюс название и описание
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase().trim();
    return rawTasks.filter((task: any) => {
      let personName = "";
      let personPosition = "";

      if (isCreator) {
        const exec =
          task.assignee && executorById.get(task.assignee)
            ? executorById.get(task.assignee)
            : null;
        personName = exec?.full_name || exec?.email || task.assignee || "";
        personPosition = exec?.position || "";
      } else {
        // для исполнителя ищем по Создателю
        personName = task.creator_name || "Создатель";
        // если хочешь — можно добавить creator_position, когда будет на бэке
        personPosition = "";
      }

      if (!q) return true;

      const haystack = `${task.title || ""} ${task.description || ""} ${
        personName || ""
      } ${personPosition || ""}`
        .toLowerCase()
        .trim();

      return haystack.includes(q);
    });
  }, [rawTasks, search, executorById, isCreator]);

  // сортировка
  const sortedTasks = useMemo(() => {
    const arr = [...filteredTasks];
    if (!sortField) return arr;

    const getVal = (task: any) => {
      switch (sortField) {
        case "executor": {
          if (isCreator) {
            const ex =
              task.assignee && executorById.get(task.assignee)
                ? executorById.get(task.assignee)
                : null;
            return (
              (ex?.full_name || ex?.email || task.assignee || "") as string
            );
          } else {
            // для исполнителя сортируем по ФИО создателя
            return (task.creator_name || "Создатель") as string;
          }
        }
        case "position": {
          if (isCreator) {
            const ex =
              task.assignee && executorById.get(task.assignee)
                ? executorById.get(task.assignee)
                : null;
            return (ex?.position || "") as string;
          }
          return "" as string;
        }
        case "title":
          return (task.title || "") as string;
        case "description":
          return (task.description || "") as string;
        case "priority":
          return (task.priority || "") as string;
        case "status":
          return (task.status || "") as string;
        case "due_at":
          return task.due_at ? new Date(task.due_at).getTime() : 0;
        default:
          return "";
      }
    };

    return arr.sort((a: any, b: any) => {
      const valA = getVal(a);
      const valB = getVal(b);

      if (sortField === "due_at") {
        const diff = (valA as number) - (valB as number);
        return sortOrder === "asc" ? diff : -diff;
      }

      const sa = String(valA).toLowerCase();
      const sb = String(valB).toLowerCase();
      const cmp = sa.localeCompare(sb, "ru");
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [filteredTasks, sortField, sortOrder, executorById, isCreator]);

  // --- фильтр исполнителей на вкладке 2 ---
  const [executorSearch, setExecutorSearch] = useState("");
  const filteredExecutors = useMemo(() => {
    const q = executorSearch.toLowerCase().trim();
    if (!q) return executors ?? [];
    return (executors ?? []).filter((ex: any) => {
      const haystack = `${ex.full_name || ""} ${ex.email || ""} ${
        ex.position || ""
      }`.toLowerCase();
      return haystack.includes(q);
    });
  }, [executors, executorSearch]);

  const currentSortTitle = sortField
    ? SORT_FIELD_TITLES[sortField]
    : "Поле";

  // --- обработчик "Выполнено" для исполнителя ---
  async function handleComplete(taskId: number) {
    try {
      await completeTask(taskId);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      console.error(err);
      alert("Не удалось обновить статус задачи");
    }
  }

  // --- обработчик загрузки файла исполнителем ---
  async function handleUploadResult(taskId: number, file: File | null) {
    if (!file) return;
    try {
      await uploadTaskResult(taskId, file);
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить файл");
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      {/* Вкладки */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isCreator ? "fullWidth" : "standard"}
        >
          <Tab label="ЗАДАЧИ" />
          {isCreator && <Tab label="ИСПОЛНИТЕЛИ" />}
        </Tabs>
      </Box>

      {/* --- Вкладка 0: ЗАДАЧИ --- */}
      {tab === 0 && (
        <Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" sx={{ mb: 0.5 }}>
                Задачи
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isCreator
                  ? "Просматривайте и создавайте задачи для своих исполнителей."
                  : "Здесь отображаются задачи, которые назначил вам Создатель."}
              </Typography>
            </Box>

            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel id="status-label">Статус</InputLabel>
                  <Select
                    labelId="status-label"
                    label="Статус"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <MenuItem value="all">Все</MenuItem>
                    <MenuItem value="new">Новые</MenuItem>
                    <MenuItem value="in_progress">В работе</MenuItem>
                    <MenuItem value="done">Сделанные</MenuItem>
                    <MenuItem value="overdue">Просроченные</MenuItem>
                  </Select>
                </FormControl>

                {isCreator && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2">Только мои</Typography>
                    <Switch
                      checked={onlyMine}
                      onChange={(e) => setOnlyMine(e.target.checked)}
                      color="primary"
                    />
                  </Stack>
                )}

                {isCreator && (
                  <Button
                    variant="contained"
                    onClick={() => openCreateTask()}
                  >
                    Новая задача
                  </Button>
                )}
              </Stack>

              <TextField
                size="small"
                label="Поиск по ФИО, должности, названию и описанию"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
              />
            </Stack>
          </Stack>

          {tasksLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {tasksError && (
            <Typography color="error">Ошибка загрузки задач</Typography>
          )}

          {!tasksLoading && !tasksError && sortedTasks.length === 0 && (
            <Typography color="text.secondary">
              Пока нет задач по выбранным фильтрам.
            </Typography>
          )}

          {!tasksLoading && !tasksError && sortedTasks.length > 0 && (
            <>
              {/* CREATOR VIEW */}
              {isCreator && (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell onClick={openSortMenu("executor")}>
                          Исполнитель
                        </TableCell>
                        <TableCell onClick={openSortMenu("position")}>
                          Должность
                        </TableCell>
                        <TableCell onClick={openSortMenu("title")}>
                          Название
                        </TableCell>
                        <TableCell onClick={openSortMenu("description")}>
                          Описание задачи
                        </TableCell>
                        <TableCell onClick={openSortMenu("priority")}>
                          Приоритет
                        </TableCell>
                        <TableCell onClick={openSortMenu("due_at")}>
                          Дедлайн
                        </TableCell>
                        <TableCell onClick={openSortMenu("status")}>
                          Статус
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedTasks.map((task: any) => {
                        const exec =
                          task.assignee && executorById.get(task.assignee)
                            ? executorById.get(task.assignee)
                            : null;

                        const assigneeName =
                          exec?.full_name ||
                          exec?.email ||
                          task.assignee ||
                          "—";

                        const assigneePosition = exec?.position || "—";

                        return (
                          <TableRow key={task.id} hover>
                            <TableCell>{assigneeName}</TableCell>
                            <TableCell>{assigneePosition}</TableCell>
                            <TableCell>{task.title}</TableCell>
                            <TableCell>
                              {task.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  PRIORITY_LABELS[task.priority] ??
                                  task.priority
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {task.due_at
                                ? new Date(task.due_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  STATUS_LABELS[task.status] ?? task.status
                                }
                                size="small"
                                color={
                                  task.status === "done"
                                    ? "success"
                                    : task.status === "in_progress"
                                    ? "primary"
                                    : task.status === "overdue"
                                    ? "error"
                                    : "warning"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}

              {/* EXECUTOR VIEW */}
              {!isCreator && (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell onClick={openSortMenu("executor")}>
                          Создатель
                        </TableCell>
                        <TableCell onClick={openSortMenu("title")}>
                          Название
                        </TableCell>
                        <TableCell onClick={openSortMenu("description")}>
                          Описание задачи
                        </TableCell>
                        <TableCell onClick={openSortMenu("priority")}>
                          Приоритет
                        </TableCell>
                        <TableCell onClick={openSortMenu("due_at")}>
                          Дедлайн
                        </TableCell>
                        <TableCell onClick={openSortMenu("status")}>
                          Статус
                        </TableCell>
                        <TableCell>Файл</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedTasks.map((task: any) => {
                        const creatorName =
                          task.creator_name || "Создатель";

                        return (
                          <TableRow key={task.id} hover>
                            <TableCell>{creatorName}</TableCell>
                            <TableCell>{task.title}</TableCell>
                            <TableCell>
                              {task.description || "—"}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  PRIORITY_LABELS[task.priority] ??
                                  task.priority
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {task.due_at
                                ? new Date(task.due_at).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {task.status === "done" ? (
                                <Chip
                                  label={
                                    STATUS_LABELS[task.status] ?? task.status
                                  }
                                  size="small"
                                  color="success"
                                />
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleComplete(task.id)}
                                >
                                  Выполнено
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Stack direction="column" spacing={1}>
                                {task.result_file && (
                                  <a
                                    href={task.result_file}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Открыть
                                  </a>
                                )}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  component="label"
                                >
                                  Прикрепить
                                  <input
                                    type="file"
                                    hidden
                                    onChange={(e) =>
                                      handleUploadResult(
                                        task.id,
                                        e.target.files?.[0] ?? null
                                      )
                                    }
                                  />
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}

              {/* меню сортировки по заголовкам */}
              <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={() => setSortAnchorEl(null)}
              >
                <MenuItem onClick={() => handleSort("asc")}>
                  {currentSortTitle} по возрастанию (A–Я)
                </MenuItem>
                <MenuItem onClick={() => handleSort("desc")}>
                  {currentSortTitle} по убыванию (Я–A)
                </MenuItem>
                <MenuItem onClick={handleSortReset}>
                  Сбросить сортировку
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      )}

      {/* --- Вкладка 1: ИСПОЛНИТЕЛИ --- */}
      {isCreator && tab === 1 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Исполнители
          </Typography>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Пригласить исполнителя
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  label="Email исполнителя"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={handleInvite}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? "Отправляем..." : "Отправить приглашение"}
                </Button>
              </Stack>
              {inviteError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {inviteError}
                </Alert>
              )}
              {inviteSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {inviteSuccess}
                </Alert>
              )}
            </Box>
          </Stack>

          <TextField
            size="small"
            label="Поиск по ФИО, email или должности"
            value={executorSearch}
            onChange={(e) => setExecutorSearch(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          {execLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {execError && (
            <Typography color="error">Ошибка загрузки исполнителей</Typography>
          )}

          {!execLoading && !execError && filteredExecutors.length === 0 && (
            <Typography color="text.secondary">
              Исполнителей пока нет. Пригласите первого по email.
            </Typography>
          )}

          {!execLoading && !execError && filteredExecutors.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ФИО</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Компания</TableCell>
                  <TableCell>Должность</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExecutors.map((ex: any) => (
                  <TableRow key={ex.id}>
                    <TableCell>{ex.full_name || "—"}</TableCell>
                    <TableCell>{ex.email}</TableCell>
                    <TableCell>{ex.company || "—"}</TableCell>
                    <TableCell>{ex.position || "—"}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openCreateTask(ex.id)}
                      >
                        Назначить задачу
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* --- Диалог создания задачи --- */}
      {isCreator && (
        <Dialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Новая задача</DialogTitle>
          <form onSubmit={handleCreateTaskSubmit}>
            <DialogContent sx={{ pt: 2 }}>
              <Stack spacing={2}>
                {createError && <Alert severity="error">{createError}</Alert>}

                <FormControl
                  fullWidth
                  disabled={execLoading || execError || !executors}
                >
                  <InputLabel id="assignee-label">Исполнитель</InputLabel>
                  <Select
                    labelId="assignee-label"
                    label="Исполнитель"
                    value={newAssigneeId}
                    onChange={(e) => setNewAssigneeId(e.target.value)}
                    required
                  >
                    {(executors ?? []).map((ex: any) => (
                      <MenuItem key={ex.id} value={ex.id}>
                        {ex.full_name || ex.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Название"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  fullWidth
                />

                <TextField
                  label="Описание"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                />

                <FormControl fullWidth>
                  <InputLabel id="priority-label">Приоритет</InputLabel>
                  <Select
                    labelId="priority-label"
                    label="Приоритет"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                  >
                    <MenuItem value="high">Высокий</MenuItem>
                    <MenuItem value="medium">Средний</MenuItem>
                    <MenuItem value="low">Низкий</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Дедлайн"
                  type="datetime-local"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <Box>
                  <Button variant="outlined" component="label">
                    {newFile ? "Изменить файл" : "Загрузить файл"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) =>
                        setNewFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </Button>
                  {newFile && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Файл: {newFile.name}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button type="submit" variant="contained" disabled={createLoading}>
                {createLoading ? "Создаём..." : "Создать"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Paper>
  );
}
