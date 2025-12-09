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
      setFullName(profile.full_name ?? "");
      setCompany(profile.company ?? "");
      setPosition(profile.position ?? "");
      if (profile.avatar) {
        setAvatarPreview(profile.avatar);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) return;

    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

  // Telegram считаем подключённым только если есть telegram_user_id
  const telegramLinked = !!telegramProfile?.telegram_user_id;

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setAvatarFile(file);
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName,
        company,
        position,
        avatar: avatarFile,
      });

      setProfileMessage("Профиль успешно обновлён.");
      setAvatarFile(null);
    } catch (error) {
      console.error(error);
      setProfileError("Не удалось обновить профиль. Попробуйте ещё раз.");
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

      const data = (await response.json()) as { link: string };
      const link = data.link;

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

  if (!auth?.user) {
    return (
      <div className="page">
        <h1 className="page-title">Личный кабинет</h1>
        <p className="page-subtitle">
          Для просмотра профиля необходимо войти в систему.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page">
        <p className="page-subtitle">Загружаем профиль…</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="page">
        <h1 className="page-title">Личный кабинет</h1>
        <p className="page-subtitle text-red-400">
          Не удалось загрузить данные профиля.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Личный кабинет</h1>
        <p className="page-subtitle">
          Управляйте профилем, паролем и интеграцией с Telegram.
        </p>
      </div>

      <div className="profile-grid">
        {/* Профиль */}
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

            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Аватар" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.full_name?.[0] ?? "?"}
                </div>
              )}
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

              <Button
                type="submit"
                fullWidth
                loading={updateProfileMutation.isPending}
              >
                Сохранить профиль
              </Button>
            </form>
          </div>
        </section>

        {/* Смена пароля + Telegram */}
        <section className="landing-card">
          <div className="landing-card-body">
            <h2 className="landing-card-title">Безопасность и Telegram</h2>
            <p className="landing-card-subtitle">
              Управляйте паролем и интеграцией с Telegram-ботом.
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
                label="Повторите новый пароль"
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
              />

              <Button
                type="submit"
                fullWidth
                loading={changePasswordMutation.isPending}
              >
                Изменить пароль
              </Button>
            </form>

            <div className="profile-section">
              <h3 className="profile-section-title">Telegram</h3>

              {telegramLoading ? (
                <p className="landing-card-subtitle">
                  Проверяем статус Telegram…
                </p>
              ) : telegramLinked ? (
                <>
                  <p className="landing-card-subtitle">
                    Telegram подключён. ID:{" "}
                    <strong>
                      {telegramProfile?.telegram_user_id ??
                        telegramProfile?.chat_id}
                    </strong>
                  </p>
                  <p className="landing-card-subtitle">
                    Вы будете получать уведомления о задачах и дедлайнах в
                    Telegram.
                  </p>
                </>
              ) : (
                <p className="landing-card-subtitle">
                  Telegram ещё не подтверждён. Нажмите кнопку ниже, чтобы
                  привязать Telegram-аккаунт. После этого откройте бота и
                  нажмите команду <code>/start</code>.
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
                  loading={telegramLinkLoading}
                >
                  {telegramLinked
                    ? "Перепривязать Telegram"
                    : "Привязать Telegram"}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleTelegramRefresh()}
                  fullWidth
                  variant="ghost"
                >
                  Обновить статус Telegram
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
