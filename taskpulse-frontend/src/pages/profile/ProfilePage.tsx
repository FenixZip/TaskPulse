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

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

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

  // ⬇⬇⬇ ЕДИНСТВЕННОЕ ЛОГИЧЕСКОЕ ИЗМЕНЕНИЕ
  const telegramLinked = !!telegramProfile?.telegram_user_id;
  // ⬆⬆⬆ Раньше было: const telegramLinked = !!telegramProfile;

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

  const handleTelegramConnect = async () => {
    setTelegramError(null);
    setTelegramMessage(null);
    setTelegramLinkLoading(true);

    try {
      const response = await fetch("/api/integrations/telegram/link-start/", {
        method: "POST",
        headers: {
          Authorization: `Token ${auth?.token}`,
        },
      });

      if (!response.ok) {
        setTelegramError("Не удалось получить ссылку для подключения Telegram.");
        return;
      }

      const data = await response.json();
      const link = data.link as string;

      window.open(link, "_blank");
      setTelegramMessage(
        "Откройте бота в Telegram и нажмите /start для завершения привязки.",
      );
    } catch (error) {
      console.error(error);
      setTelegramError("Произошла ошибка при подключении Telegram.");
    } finally {
      setTelegramLinkLoading(false);
    }
  };

  const handleTelegramRefresh = async () => {
    setTelegramError(null);
    setTelegramMessage(null);
    await refetchTelegram();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Личный кабинет</h1>
        <p className="dashboard-header-subtitle">
          Управляйте профилем, паролем и интеграцией с Telegram.
        </p>
      </div>

      <div className="dashboard-grid dashboard-grid--two-columns">
        <section className="landing-card">
          <div className="landing-card-body">
            <h2 className="landing-card-title">Профиль</h2>
            <p className="landing-card-subtitle">
              Обновите личные данные и аватар, чтобы коллегам было проще вас
              узнать.
            </p>

            {profileError && (
              <div className="form-error-message">{profileError}</div>
            )}
            {profileMessage && (
              <div className="form-success-message">{profileMessage}</div>
            )}

            <div className="profile-avatar-block">
              <div className="profile-avatar-wrapper">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={fullName}
                    className="profile-avatar-image"
                  />
                ) : profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={fullName}
                    className="profile-avatar-image"
                  />
                ) : (
                  <div className="profile-avatar-placeholder">
                    {fullName ? fullName[0]?.toUpperCase() : "?"}
                  </div>
                )}
              </div>

              <label className="profile-avatar-upload">
                <span>Загрузить новый аватар</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </label>
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

              <Button type="submit" fullWidth>
                Сохранить профиль
              </Button>
            </form>
          </div>
        </section>

        <section className="landing-card">
          <div className="landing-card-body">
            <h2 className="landing-card-title">Смена пароля</h2>
            <p className="landing-card-subtitle">
              Периодически обновляйте пароль, чтобы ваш аккаунт был в
              безопасности.
            </p>

            {passwordError && (
              <div className="form-error-message">{passwordError}</div>
            )}
            {passwordMessage && (
              <div className="form-success-message">{passwordMessage}</div>
            )}

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
                label="Подтверждение нового пароля"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
              />

              <Button type="submit" fullWidth>
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
                Telegram ещё не подтверждён. Нажмите кнопку ниже, чтобы
                привязать Telegram-аккаунт. После этого откройте бота и
                нажмите команду /start.
              </p>
            )}

            {telegramError && (
              <div className="form-error-message">{telegramError}</div>
            )}
            {telegramMessage && (
              <div className="form-success-message">{telegramMessage}</div>
            )}

            <div className="profile-actions">
              <Button
                type="button"
                onClick={handleTelegramConnect}
                fullWidth
                disabled={telegramLinkLoading}
              >
                {telegramLinked
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
