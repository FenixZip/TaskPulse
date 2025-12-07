// src/app/layouts/RootLayout.tsx
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";
import logo from "../../shared/assets/pulse-zone-logo.png";
import { useAuth } from "../../shared/hooks/useAuth";
import { useProfile } from "../../entities/user/model/useProfile";

const TASKS_PATH = "/app/tasks";
const EXECUTORS_PATH = "/app/executors";
const STATS_PATH = "/app/stats";

export const RootLayout = () => {
  const currentYear = new Date().getFullYear();
  const { auth, logout } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = !!auth.token;

  const displayName = profile?.full_name || auth.user?.email || "Профиль";
  const avatarUrl = profile?.avatar || null;

  const initials = (profile?.full_name || auth.user?.email || "U")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.landing);
  };

  const handleProfileClick = () => {
    navigate("/app/profile");
  };

  const isTabActive = (path: string) => {
    const { pathname } = location;

    if (path === TASKS_PATH) {
      // считаем /app и /app/tasks одной вкладкой
      return pathname === "/app" || pathname.startsWith(TASKS_PATH);
    }

    return pathname.startsWith(path);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          {/* Лого слева */}
          <Link to={ROUTES.landing} className="app-logo">
            <img src={logo} alt="Pulse-zone.tech" />
            <span className="app-logo-text">Pulse-zone.tech</span>
          </Link>

          {/* Вкладки по центру – только для авторизованных */}
          {isAuthenticated && (
            <div className="app-main-tabs">
              <Link
                to={TASKS_PATH}
                className={
                  "app-main-tabs-link" +
                  (isTabActive(TASKS_PATH)
                    ? " app-main-tabs-link--active"
                    : "")
                }
              >
                Задачи
              </Link>
              <Link
                to={EXECUTORS_PATH}
                className={
                  "app-main-tabs-link" +
                  (isTabActive(EXECUTORS_PATH)
                    ? " app-main-tabs-link--active"
                    : "")
                }
              >
                Исполнители
              </Link>
              <Link
                to={STATS_PATH}
                className={
                  "app-main-tabs-link" +
                  (isTabActive(STATS_PATH)
                    ? " app-main-tabs-link--active"
                    : "")
                }
              >
                Статистика
              </Link>
            </div>
          )}

          {/* Правая часть – профиль / вход / регистрация */}
          <nav className="app-nav">
            {isAuthenticated ? (
              <>
                {/* Кнопка профиля – только кружок с инициалами/фото */}
                <button
                  type="button"
                  className="app-header-profile"
                  onClick={handleProfileClick}
                  title={displayName}
                >
                  <div className="app-header-avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  className="app-nav-link"
                  onClick={handleLogout}
                >
                  Выход
                </button>
              </>
            ) : (
              <>
                <Link className="app-nav-link" to={ROUTES.login}>
                  Вход
                </Link>
                <Link
                  className="app-nav-link app-nav-link-primary"
                  to={ROUTES.register}
                >
                  Регистрация
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div className="app-footer-left">
            <div>© {currentYear} Pulse-zone.tech</div>
            <div>Все права защищены</div>
          </div>
          <div className="app-footer-right">
            <div>Техническая поддержка</div>
            <div>pulse-zone@support.ru</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
