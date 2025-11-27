// src/app/layouts/RootLayout.tsx
import { Outlet, Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";
import logo from "../../shared/assets/pulse-zone-logo.png";
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
            <img src={logo} alt="Pulse-zone logo" />
            <span className="app-logo-text">Pulse-zone</span>
          </Link>

          <nav className="app-nav">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="app-nav-link"
                  onClick={handleProfileClick}
                >
                  {displayName}
                </button>
                <button
                  type="button"
                  className="app-nav-link app-nav-link-primary"
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
                <Link className="app-nav-link app-nav-link-primary" to={ROUTES.register}>
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
          <span>© {currentYear} Pulse-zone</span>
          <span>Техническая поддержка: taskpulse@internet.ru</span>
        </div>
      </footer>
    </div>
  );
};
