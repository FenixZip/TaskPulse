 import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { updateProfile, changePassword } from "../../api/authApi";
import { fetchTelegramProfile, type TelegramProfile } from "../../api/integrationsApi";

export const ProfilePage: React.FC = () => {
  const { user, reloadProfile } = useAuth();

  // форма профиля
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // форма смены пароля
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Telegram
  const [tgProfile, setTgProfile] = useState<TelegramProfile | null>(null);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setCompany(user.company ?? "");
      setPosition(user.position ?? "");
    }
  }, [user]);

  useEffect(() => {
    const loadTg = async () => {
      setTgLoading(true);
      setTgError(null);
      try {
        const prof = await fetchTelegramProfile();
        setTgProfile(prof);
      } catch (err: any) {
        setTgError(
          err?.response?.data?.detail ??
            "Ошибка при получении статуса Telegram."
        );
      } finally {
        setTgLoading(false);
      }
    };
    void loadTg();
  }, []);

  if (!user) return <div>Профиль не найден</div>;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    try {
      await updateProfile({
        full_name: fullName,
        company,
        position,
      });
      await reloadProfile();
      setProfileMessage("Профиль обновлён");
    } catch (err: any) {
      setProfileError(
        err?.response?.data?.detail ?? "Ошибка обновления профиля"
      );
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    setPasswordLoading(true);
    try {
      const res = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPasswordMessage(res.detail ?? "Пароль изменён");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPasswordError(
        err?.response?.data?.detail ??
          err?.response?.data?.old_password ??
          err?.response?.data?.new_password ??
          "Ошибка при смене пароля"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>Профиль</h1>
      <p>Email: {user.email}</p>
      <p>Роль: {user.role}</p>

      <section style={{ marginTop: 16, marginBottom: 32 }}>
        <h2>Данные профиля</h2>
        <form onSubmit={handleProfileSubmit}>
          <div>
            <label>ФИО</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label>Компания</label>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
          <div>
            <label>Должность</label>
            <input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>
          {profileError && (
            <div style={{ color: "red", marginTop: 8 }}>{profileError}</div>
          )}
          {profileMessage && (
            <div style={{ color: "green", marginTop: 8 }}>
              {profileMessage}
            </div>
          )}
          <button type="submit" style={{ marginTop: 8 }}>
            Сохранить профиль
          </button>
        </form>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Смена пароля</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div>
            <label>Текущий пароль</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>
          <div>
            <label>Новый пароль</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {passwordError && (
            <div style={{ color: "red", marginTop: 8 }}>{passwordError}</div>
          )}
          {passwordMessage && (
            <div style={{ color: "green", marginTop: 8 }}>
              {passwordMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={passwordLoading}
            style={{ marginTop: 8 }}
          >
            {passwordLoading ? "Сохраняем..." : "Сменить пароль"}
          </button>
        </form>
      </section>

      <section>
        <h2>Интеграция с Telegram</h2>
        {tgLoading && <div>Проверяем статус...</div>}
        {tgError && <div style={{ color: "red" }}>{tgError}</div>}
        {!tgLoading && !tgError && (
          <>
            {tgProfile ? (
              <div>
                <p>Telegram уже привязан.</p>
                <p>
                  chat_id: <code>{tgProfile.chat_id}</code>, user_id:{" "}
                  <code>{tgProfile.telegram_user_id}</code>
                </p>
                <p style={{ fontSize: 12, opacity: 0.7 }}>
                  Отключение привязки делается на бэкенде (удалением
                  TelegramProfile) или через бота.
                </p>
              </div>
            ) : (
              <div>
                <p>Telegram ещё не привязан к вашему аккаунту.</p>
                <p style={{ fontSize: 14 }}>
                  Чтобы привязать, откройте вашего Telegram-бота (того, который
                  подключён к этому проекту) и выполните команду{" "}
                  <code>/start</code> с тем email, который указан в профиле.
                  После успешной привязки обновите эту страницу.
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
