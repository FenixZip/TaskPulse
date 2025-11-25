export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "new" | "in_progress" | "done" | "overdue";

export interface TaskAttachment {
  id: number;
  file: string;      // относительный путь
  file_url: string;  // абсолютный URL (сериализатор делает)
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  executor_comment: string | null;
  priority: TaskPriority;
  priority_display: string;
  status: TaskStatus;
  status_display: string;
  due_at: string | null;
  creator: number;
  creator_name: string;
  assignee: number | null;
  created_at: string;
  updated_at: string;
  attachments: TaskAttachment[];
  result_file: string | null;
}

export interface TaskMessage {
  id: number;
  task: number;
  text: string;
  file_url: string | null;
  sender: number;
  sender_name: string;
  is_from_creator: boolean;
  is_from_executor: boolean;
  created_at: string;
  task_title: string;
}
