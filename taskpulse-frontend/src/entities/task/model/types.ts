// src/entities/task/model/types.ts

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "new" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;

  // бэкендовые поля могут отличаться, поэтому делаем всё опциональным
  creator?: number;
  assignee?: number | null;

  creator_name?: string;
  creator_position?: string;
  assignee_name?: string;
  assignee_position?: string;

  // display-поля если бэк их отдаёт
  priority_display?: string;
  status_display?: string;
}
