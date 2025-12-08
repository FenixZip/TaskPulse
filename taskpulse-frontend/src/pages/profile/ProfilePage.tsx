// src/pages/profile/ProfilePage.tsx
import { useState, type FormEvent, useEffect } from "react";
import { useProfile } from "../../entities/user/model/useProfile";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { useUpdateProfile } from "../../features/profile/model/useUpdateProfile";
import { useChangePassword } from "../../features/profile/model/useChangePassword";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { useAuth } from "../../shared/hooks/useAuth";

export const ProfilePage = () => {
  const { auth } = useAuth();

  const { data: profile, isLoading, isError } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const {
    data: telegramProfile,
    refetch: refetchTelegram,
    isLoading: telegramLoading,
  } = useTelegramProfile();

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Состояние для Telegram-части
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null);
  const [telegramLinkLoading, setTelegramLinkLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setCompany(profile.company);
      setPosition(profile.position);
    }
  }, [profile]);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    return undefined;
  }, [avatarFile]);

  const telegramLinked = !!telegramProfile;

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <p className="dashboard-header-subtitle">Загружаем профиль…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="dashboard-page">
        <h1 className="dashboard-header-title">Личный кабинет</h1>
        <p className="dashboard-header-subtitle text-red-400">
          Не удалось загрузить данные профиля.
        </p>
      </div>
    );
  }

  const handleAvatarChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const handleProfileSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName,
        company,
        position,
        avatar: avatarFile,
      });

      setProfileMessage("Профиль обновлён.");
      setAvatarFile(null);
    } catch (error) {
      console.error(error);
      setProfileError("Не удалось обновить профиль. Попробуйте ещё раз.");
    }
  };

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword1 !== newPassword2) {
      setPasswordError("Новые пароли не совпадают.");
      return;
    }

    if (!newPassword1) {
      setPasswordError("Введите новый пароль.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword1,
      });

      setPasswordMessage("Пароль успешно изменён.");
      setCurrentPassword("");
      setNewPassword1("");
      setNewPassword2("");
    } catch (error) {
      console.error(error);
      setPasswordError("Не удалось изменить пароль. Проверьте данные.");
    }
  };

  /**
   * Запрос на backend: создаём link-token и получаем ссылку на бота
   * POST /api/integrations/telegram/link-start/
   */
  const handleTelegramConnect = async () => {
    setTelegramError(null);
    setTelegramMessage(null);
    setTelegramLinkLoading(true);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (auth?.token) {
        headers.Authorization = `Token ${auth.token}`;
      }

      const response = await fetch(
        "/api/integrations/telegram/link-start/",
        {
          method: "POST",
          headers,
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || `Ошибка сервера: ${response.status}`,
        );
      }

      const data = await response.json();
      const link = data?.link as string | undefined;

      if (!link) {
        throw new Error("Сервер не вернул ссылку на Telegram-бота.");
      }

      // Переходим в бота – дальше пользователь жмёт /start
      window.location.href = link;
    } catch (error: any) {
      console.error(error);
      setTelegramError(
        error?.message ||
          "Не удалось получить ссылку на Telegram-бота.",
      );
    } finally {
      setTelegramLinkLoading(false);
    }
  };

  /**
   * После того как пользователь нажал /start в боте —
   * обновляем статус привязки на фронте.
   */
  const handleTelegramRefresh = async () => {
    setTelegramError(null);
    setTelegramMessage(null);

    try {
      await refetchTelegram();
      setTelegramMessage(
        "Статус Telegram обновлён. Если вы нажали /start в боте, привязка должна появиться.",
      );
    } catch (error) {
      console.error(error);
      setTelegramError("Не удалось обновить статус Telegram.");
    }
  };

  return (
    <div className="dashboard-page">
      <header>
        <h1 className="dashboard-header-title">Личный кабинет</h1>
        <p className="dashboard-header-subtitle">
          Управляйте данными профиля, подключите Telegram и настраивайте
          безопасность аккаунта.
        </p>
      </header>

      {/* две карточки рядом */}
      <div className="profile-grid">
        {/* Профиль */}
        <section className="dashboard-section profile-card">
          <h2 className="profile-card-title">Профиль</h2>
          <p className="profile-card-description">
            Обновите имя, компанию и должность, чтобы коллеги видели
            актуальную информацию.
          </p>

          <p className="landing-card-text">
            E-mail: <strong>{profile.email}</strong>
          </p>
          {profile.invited_by && (
            <p className="landing-card-text">
              Вас пригласил: <strong>{profile.invited_by}</strong>
            </p>
          )}

          <div className="profile-avatar">
            <div>
              {(avatarPreview || profile.avatar) && (
                <img
                  src={avatarPreview || profile.avatar || ""}
                  alt="Аватар"
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="profile-section-title">Аватар</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <p className="profile-card-description">
                Загрузите квадратное изображение, чтобы аватар выглядел
                лучше.
              </p>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleProfileSubmit}>
            <Input
              label="Имя и фамилия"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Компания"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="Должность"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />

            {profileError && (
              <p className="form-error-text">{profileError}</p>
            )}
            {profileMessage && (
              <p className="form-success-text">{profileMessage}</p>
            )}

            <Button
              type="submit"
              fullWidth
              loading={updateProfileMutation.isPending}
            >
              Сохранить профиль
            </Button>
          </form>
        </section>

        {/* Безопасность + Telegram */}
        <section className="dashboard-section profile-card">
          <h2 className="profile-card-title">Безопасность и уведомления</h2>
          <p className="profile-card-description">
            Управляйте паролем и подключите Telegram, чтобы получать
            уведомления о задачах и дедлайнах.
          </p>

          {/* Смена пароля */}
          <div className="profile-subsection">
            <h3 className="profile-section-title">Смена пароля</h3>

            <form className="auth-form" onSubmit={handlePasswordSubmit}>
              <Input
                label="Текущий пароль"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input
                label="Новый пароль"
                type="password"
                value={newPassword1}
                onChange={(e) => setNewPassword1(e.target.value)}
              />
              <Input
                label="Повторите новый пароль"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
              />

              {passwordError && (
                <p className="form-error-text">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="form-success-text">{passwordMessage}</p>
              )}

              <Button
                type="submit"
                fullWidth
                loading={changePasswordMutation.isPending}
              >
                Изменить пароль
              </Button>
            </form>
          </div>

          {/* Telegram */}
          <div className="profile-subsection">
            <h3 className="profile-section-title">Telegram</h3>
            <p className="profile-card-description">
              Подключите Telegram-бота, чтобы получать уведомления о задачах и
              дедлайнах.
            </p>

            {telegramLoading ? (
              <p className="landing-card-text">
                Проверяем статус Telegram…
              </p>
            ) : telegramLinked ? (
              <>
                <p className="landing-card-text">
                  Telegram подключён. ID:{" "}
                  <strong>
                    {telegramProfile?.telegram_user_id ??
                      telegramProfile?.chat_id}
                  </strong>
                </p>
                <p className="landing-card-text">
                  Вы будете получать уведомления о задачах и дедлайнах в
                  Telegram.
                </p>
              </>
            ) : (
              <p className="landing-card-text">
                Telegram ещё не подтверждён. Нажмите кнопку ниже, перейдите в
                бота и нажмите /start, затем вернитесь и обновите статус.
              </p>
            )}

            {telegramError && (
              <p className="form-error-text">{telegramError}</p>
            )}
            {telegramMessage && (
              <p className="form-success-text">{telegramMessage}</p>
            )}

            <div className="profile-telegram-actions">
              <Button
                type="button"
                onClick={handleTelegramConnect}
                fullWidth
                loading={telegramLinkLoading}
              >
                {telegramLinkLoading
                  ? "Получаем ссылку…"
                  : telegramLinked
                  ? "Перепривязать Telegram"
                  : "Привязать Telegram"}
              </Button>
              <Button
                type="button"
                onClick={handleTelegramRefresh}
                fullWidth
              >
                Обновить статус Telegram
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
