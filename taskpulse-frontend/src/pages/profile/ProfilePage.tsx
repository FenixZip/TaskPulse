// src/pages/profile/ProfilePage.tsx
import { useState, type FormEvent, useEffect } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";
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
  const { data: telegramProfile, refetch: refetchTelegram } =
    useTelegramProfile();

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
  }, [profile, fullName, company, position]);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [avatarFile]);

  if (isLoading || !profile) {
    return <div className="dashboard-page">Загружаем профиль…</div>;
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
      setPasswordMessage(
        "Не удалось изменить пароль. Проверьте текущий пароль."
      );
    }
  };

  const handleTelegramConfirm = () => {
    window.open(TELEGRAM_BOT_URL, "_blank", "noopener,noreferrer");
    setTimeout(() => {
      refetchTelegram();
    }, 3000);
  };

  const telegramLinked = !!telegramProfile;

  return (
    <div className="dashboard-page">
      <header>
        <h1 className="dashboard-header-title">Личный кабинет</h1>
        <p className="dashboard-header-subtitle">
          Управляйте данными профиля, подключите Telegram и настраивайте
          безопасность аккаунта.
        </p>
      </header>

      {/* быстрый переход обратно к задачам */}
      <div style={{ marginTop: "1rem" }}>
        <Link
          className="landing-hero-btn landing-hero-btn-secondary"
          to={ROUTES.appRoot}
        >
          ← К задачам
        </Link>
      </div>

      {/* две карточки рядом */}
      <div className="profile-grid">
        {/* Профиль */}
        <section className="dashboard-section profile-card">
          <h2 className="profile-card-title">Профиль</h2>
          <p className="profile-card-description">
            Обновите имя, компанию и должность, чтобы коллеги видели актуальную
            информацию.
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
              <div className="text-xs" style={{ color: "#a3ff12" }}>
                {profileMessage}
              </div>
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

        {/* Telegram / интеграция */}
        <section className="dashboard-section profile-card">
          <h2 className="profile-card-title">Telegram</h2>
          <p className="profile-card-description">
            Подключите Telegram, чтобы получать уведомления о задачах и
            дедлайнах.
          </p>

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
                Нажмите кнопку ниже, откройте бота и нажмите{" "}
                <strong>Start</strong>.
              </p>
            </>
          )}

          <Button type="button" onClick={handleTelegramConfirm} fullWidth>
            {telegramLinked ? "Обновить статус Telegram" : "Подтвердить Telegram"}
          </Button>
        </section>
      </div>

      {/* Смена пароля — отдельная карточка снизу */}
      <section className="dashboard-section profile-card" style={{ marginTop: "1.75rem" }}>
        <h2 className="profile-card-title">Смена пароля</h2>
        <p className="profile-card-description">
          Для безопасности аккаунта используйте уникальный сложный пароль.
        </p>

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
      </section>
    </div>
  );
};
