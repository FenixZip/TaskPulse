// src/pages/landing/LandingPage.tsx
import { Link } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";

export const LandingPage = () => {
  return (
    <div className="landing-root">
      <section>
        <h1 className="landing-title">
          Контроль задач в реальном времени — держите пульс команды в зоне.
        </h1>
        <p className="landing-subtitle">
          Pulse-zone помогает создателям и исполнителям держать сроки, видеть нагрузку и общаться
          по задачам в одном современном интерфейсе.
        </p>

        <div className="landing-actions">
          <Link className="app-nav-link app-nav-link-primary" to={ROUTES.register}>
            Начать бесплатно
          </Link>
          <Link className="app-nav-link" to={ROUTES.login}>
            Уже есть аккаунт
          </Link>
        </div>

        <p className="landing-secondary-link">
          Не нужно ничего устанавливать — просто зарегистрируйтесь и создайте первую задачу.
        </p>
      </section>

      <aside className="landing-card">
        <div className="landing-card-title">Почему Pulse-zone?</div>
        <p className="landing-card-text">
          Создавайте задачи, назначайте исполнителей, отслеживайте сроки и результаты.
          Интеграция с Telegram напомнит о дедлайнах и поможет держать фокус на важном.
        </p>
        <p className="landing-card-text">
          Отдельные кабинеты для создателя и исполнителя, отчёты по срокам и приоритетам — всё для
          прозрачного управления задачами.
        </p>
      </aside>
    </div>
  );
};
