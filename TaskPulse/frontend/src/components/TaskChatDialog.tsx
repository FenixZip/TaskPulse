// @ts-nocheck
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useRef, useState } from "react";
import { useConversationMessages } from "../hooks/useConversationMessages";

interface TaskChatDialogProps {
  open: boolean;
  onClose: () => void;
  /** id собеседника (для создателя это исполнитель, для исполнителя — создатель) */
  otherUserId: number | null;
  /** текущая выбранная задача, откуда нажали "Уточнить задачу" */
  currentTask: { id: number; title: string } | null;
}

export function TaskChatDialog({
  open,
  onClose,
  otherUserId,
  currentTask,
}: TaskChatDialogProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
    sendMessage,
    sending,
  } = useConversationMessages(open && otherUserId ? otherUserId : undefined);

  const listRef = useRef<HTMLDivElement | null>(null);

  // автоскролл вниз при новых сообщениях
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  // при открытии диалога очищаем ввод
  useEffect(() => {
    if (!open) {
      setText("");
      setFile(null);
    }
  }, [open]);

  const handleSend = async () => {
    if (!otherUserId || !currentTask) return;
    if (!text && !file) return; // нечего отправлять

    try {
      await sendMessage({
        userId: otherUserId,
        taskId: currentTask.id,
        text: text || "",
        file,
      });
      setText("");
      setFile(null);
    } catch (e) {
      console.error(e);
      alert("Не удалось отправить сообщение");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Чат по задачам
        </Typography>
        {currentTask && (
          <Typography variant="body2" color="text.secondary">
            Текущая задача: {currentTask.title}
          </Typography>
        )}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        {isLoading && <LinearProgress />}

        {isError && (
          <Typography color="error">
            Не удалось загрузить сообщения.{" "}
            <Button size="small" onClick={() => refetch()}>
              Повторить
            </Button>
          </Typography>
        )}

        {/* Лента сообщений */}
        <Box
          ref={listRef}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            p: 1,
            height: 320,
            overflowY: "auto",
            mb: 1,
          }}
        >
          {messages.length === 0 && !isLoading && (
            <Typography color="text.secondary">
              Сообщений пока нет. Напишите первое сообщение.
            </Typography>
          )}

          {messages.length > 0 && (
            <List dense>
              {messages.map((msg) => (
                <ListItem
                  key={msg.id}
                  sx={{
                    alignItems: "flex-start",
                    justifyContent: msg.is_from_creator ? "flex-end" : "flex-start",
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: "75%",
                      bgcolor: msg.is_from_creator ? "primary.light" : "grey.100",
                      color: msg.is_from_creator ? "primary.contrastText" : "text.primary",
                      borderRadius: 2,
                      p: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, display: "block" }}
                    >
                      {msg.sender_name}
                    </Typography>

                    {/* Название задачи, к которой относится сообщение */}
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      Задача: {msg.task_title}
                    </Typography>

                    {msg.text && (
                      <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                        {msg.text}
                      </Typography>
                    )}

                    {msg.file_url && (
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "inherit", textDecoration: "underline" }}
                        >
                          Открыть файл
                        </a>
                      </Typography>
                    )}

                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                    >
                      {new Date(msg.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Поле ввода */}
        <Stack spacing={1}>
          <TextField
            label="Сообщение"
            multiline
            minRows={2}
            maxRows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <Button variant="outlined" component="label">
              {file ? "Изменить файл" : "Прикрепить файл"}
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            {file && (
              <Typography variant="body2" color="text.secondary">
                Файл: {file.name}
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending || !otherUserId || !currentTask || (!text && !file)}
        >
          {sending ? "Отправляем..." : "Отправить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
