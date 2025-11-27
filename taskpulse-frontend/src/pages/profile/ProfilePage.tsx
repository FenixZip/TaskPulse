// src/pages/profile/ProfilePage.tsx
import { useState, type FormEvent, useEffect } from "react";
import { useProfile } from "../../entities/user/model/useProfile";
import { Input } from "../../shared/ui/Input";
import { Button } from "../../shared/ui/Button";
import { useUpdateProfile } from "../../features/profile/model/useUpdateProfile";
import { useChangePassword } from "../../features/profile/model/useChangePassword";
import { useTelegramProfile } from "../../shared/hooks/useTelegramProfile";
import { TELEGRAM_BOT_URL } from "../../shared/config/env";

export const ProfilePage = () => {
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const { data: telegramProfile, refetch: refetchTelegram } = useTelegramProfile();

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile && !fullName && !company && !position) {
      setFullName(profile.full_name || "");
      setCompany(profile.company || "");
      setPosition(profile.position || "");
    }
  }, [profile]);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  if (isLoading || !profile) {
    return <div className="tasks-empty">Загружаем профиль…</div>;
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName,
        company,
        position,
        avatar: avatarFile ?? undefined,
      });
      setProfileMessage("Профиль обновлён.");
    } catch {
      setProfileMessage("Не удалось обновить профиль.");
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage("Пароль изменён.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPasswordMessage("Не удалось изменить пароль. Проверьте текущий пароль.");
    }
  };

  const handleTelegramConfirm = () => {
    // открываем бота в новой вкладке
    window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
    // пользователь жмёт Start, бэк через webhook создаёт TelegramProfile
    // после этого можно ручками обновить данные
    setTimeout(() => {
      refetchTelegram();
    }, 3000);
  };

  const telegramLinked = !!telegramProfile;

  return (
    <div className="tasks-root">
      <h1 className="landing-title">Личный кабинет</h1>
      <p className="landing-subtitle">
        Управляйте данными профиля, подключите Telegram для уведомлений о задачах.
      </p>

      {/* Профиль */}
      <div className="landing-card profile-section">
        <h2 className="landing-card-title">Профиль</h2>
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
              <img src={avatarPreview || profile.avatar || ""} alt="Аватар" />
            )}
          </div>
          <div style={{ flex: 1 }}>
            <label className="profile-section-title">Аватар</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setAvatarFile(file);
              }}
            />
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

          {profileMessage && (
            <div className="text-xs" style={{ color: "#34d399" }}>
              {profileMessage}
            </div>
          )}

          <Button type="submit" fullWidth loading={updateProfileMutation.isPending}>
            Сохранить профиль
          </Button>
        </form>
      </div>

      {/* Telegram */}
      <div className="landing-card profile-section">
        <h2 className="landing-card-title">Telegram</h2>
        {telegramLinked ? (
          <>
            <p className="landing-card-text">
              Telegram подключён. ID:{" "}
              <strong>{telegramProfile?.telegram_user_id}</strong>
            </p>
            <p className="landing-card-text">
              Вы будете получать уведомления о задачах и дедлайнах в Telegram.
            </p>
          </>
        ) : (
          <>
            <p className="landing-card-text">
              Telegram ещё не подтверждён. Без подтверждённого Telegram вы не
              можете получать задачи и работать с ними.
            </p>
            <p className="landing-card-text">
              Нажмите кнопку ниже, откройте бота и нажмите <strong>Start</strong>.
            </p>
            <Button type="button" onClick={handleTelegramConfirm}>
              Подтвердить Telegram
            </Button>
          </>
        )}
      </div>

      {/* Смена пароля */}
      <div className="landing-card">
        <h2 className="landing-card-title">Смена пароля</h2>

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
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          {passwordMessage && (
            <div className="text-xs" style={{ color: "#f97316" }}>
              {passwordMessage}
            </div>
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
    </div>
  );
};
