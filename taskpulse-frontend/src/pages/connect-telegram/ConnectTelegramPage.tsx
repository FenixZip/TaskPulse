// src/pages/connect-telegram/ConnectTelegramPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../shared/ui/Button";
import { ROUTES } from "../../shared/config/routes";

import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { getTelegramConnectLink } from "../../entities/integrations/model/telegramApi";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60_000;

export const ConnectTelegramPage = () => {
  const navigate = useNavigate();

  const { data: telegramProfile, isLoading, isError, refetch } =
    useTelegramProfile();

  const telegramConfirmed = !!telegramProfile?.telegram_user_id;

  const [linkLoading, setLinkLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const pollStopTimerRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollStopTimerRef.current) {
      window.clearTimeout(pollStopTimerRef.current);
      pollStopTimerRef.current = null;
    }
    setChecking(false);
  };

  const startPolling = () => {
    stopPolling();
    setChecking(true);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        await refetch();
      } catch {
        // не спамим ошибками — пользователь увидит их при ручной проверке
      }
    }, POLL_INTERVAL_MS);

    pollStopTimerRef.current = window.setTimeout(() => {
      stopPolling();
      setMessage(
        "Если вы уже нажали /start в боте, нажмите «Проверить» или попробуйте открыть ссылку ещё раз.",
      );
    }, POLL_TIMEOUT_MS);
  };

  useEffect(() => {
    if (telegramConfirmed) {
      stopPolling();
      navigate(ROUTES.appRoot, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramConfirmed]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const statusText = useMemo(() => {
    if (isLoading) return "Проверяем статус Telegram…";
    if (telegramConfirmed) return "Telegram подключён. Перенаправляем…";
    if (isError) return "Не удалось проверить Telegram. Попробуйте ещё раз.";
    return "Telegram ещё не подтверждён.";
  }, [isLoading, isError, telegramConfirmed]);

  const handleOpenBot = async () => {
    setError(null);
    setMessage(null);
    setLinkLoading(true);

    try {
      const link = await getTelegramConnectLink();
      window.open(link, "_blank");
      setMessage(
        "Откройте бота в Telegram и нажмите /start. Мы автоматически проверим привязку.",
      );
      startPolling();
    } catch (e) {
      console.error(e);
      setError("Не удалось получить ссылку для подключения Telegram.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleManualCheck = async () => {
    setError(null);
    setMessage(null);

    try {
      setChecking(true);
      await refetch();
    } catch (e) {
      console.error(e);
      setError("Не удалось проверить статус Telegram.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-header-title">Подключение Telegram</h1>
        <p className="dashboard-header-subtitle">
          Чтобы продолжить работу в системе, необходимо подтвердить Telegram ID.
        </p>
      </div>

      <section className="landing-card">
        <div className="landing-card-body">
          <h2 className="landing-card-title">Шаг 1 — откройте бота</h2>
          <p className="landing-card-text">{statusText}</p>

          <ol className="landing-card-text" style={{ marginTop: 12 }}>
            <li>Нажмите кнопку «Открыть бота».</li>
            <li>В Telegram нажмите Start (или отправьте /start).</li>
            <li>Вернитесь сюда — статус обновится автоматически.</li>
          </ol>

          {error && <div className="form-error-message">{error}</div>}
          {message && <div className="form-success-message">{message}</div>}

          <div className="profile-actions" style={{ marginTop: 16 }}>
            <Button
              type="button"
              onClick={handleOpenBot}
              fullWidth
              disabled={linkLoading || telegramConfirmed}
            >
              {linkLoading ? "Получаем ссылку…" : "Открыть бота"}
            </Button>

            <Button
              type="button"
              onClick={handleManualCheck}
              fullWidth
              disabled={checking || telegramConfirmed}
            >
              {checking ? "Проверяем…" : "Проверить"}
            </Button>
          </div>

          <p className="landing-card-text" style={{ marginTop: 12, opacity: 0.85 }}>
            Если бот открылся, но вы раньше уже с ним общались, Telegram может
            отправить команду /start без токена. В этом случае откройте бота
            именно по ссылке «Открыть бота» ещё раз.
          </p>
        </div>
      </section>
    </div>
  );
};
