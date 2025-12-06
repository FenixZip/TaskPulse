// src/app/layouts/RootLayout.tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";
import logo from "../../shared/assets/pulse-zone-logo.png"; // оставь путь к своему лого
import { useAuth } from "../../shared/hooks/useAuth";
import { useProfile } from "../../entities/user/model/useProfile";

export const RootLayout = () => {
  const currentYear = new Date().getFullYear();
  const { auth, logout } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const isAuthenticated = !!auth.token;
  const displayName = profile?.full_name || auth.user?.email || "Профиль";

  const handleLogout = () => {
    logout();
    navigate(ROUTES.landing);
  };

  const handleProfileClick = () => {
    navigate("/app/profile");
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to={ROUTES.landing} className="app-logo">
            <img src={logo} alt="Pulse-zone.tech" />
            <span className="app-logo-text">Pulse-zone.tech</span>
          </Link>

          <nav className="app-nav">
            {isAuthenticated ? (
              <>
                {/* переход к задачам из любой внутренней страницы */}
                <Link className="app-nav-link" to={ROUTES.appRoot}>
                  Задачи
                </Link>

                <button
                  type="button"
                  className="app-nav-link"
                  onClick={handleProfileClick}
                >
                  {displayName}
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
