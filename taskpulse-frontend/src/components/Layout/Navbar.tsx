import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        gap: 12,
        padding: 8,
        borderBottom: "1px solid #ccc",
        alignItems: "center",
      }}
    >
      {user && (
        <>
          <Link to="/">Все задачи</Link>

          {user.role === "CREATOR" && (
            <>
              <Link to="/cabinet/creator">Кабинет создателя</Link>
              <Link to="/reports/monthly">Отчёты</Link>
            </>
          )}

          {user.role === "EXECUTOR" && (
            <Link to="/cabinet/executor">Мои задачи</Link>
          )}

          <Link to="/profile">Профиль</Link>
        </>
      )}

      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>{user.full_name}</span>
            <button onClick={logout}>Выйти</button>
          </>
        ) : (
          <Link to="/login">Войти</Link>
        )}
      </div>
    </nav>
  );
};
