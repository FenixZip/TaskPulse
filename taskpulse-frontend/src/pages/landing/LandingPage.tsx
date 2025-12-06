// src/pages/landing/LandingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../../shared/config/routes";
import landingMonitor from "../../shared/assets/landing-monitor.png";

export const LandingPage: React.FC = () => {
  return (
    <div className="landing">
      {/* Хиро-секция с фичами (без картинки справа) */}
      <section className="landing-hero">
        <div className="landing-hero-left">
          <h1 className="landing-hero-title">
            <span className="landing-hero-brand">Pulse-zone.tech</span>
          </h1>

          <p className="landing-hero-subtitle">
            Инновационный веб-сервис для эффективного управления командой.
            Держите пульс вашей команды под контролем с помощью современных
            технологий и интуитивного интерфейса.
          </p>

          <div className="landing-features">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🔔</div>
              <h3 className="landing-feature-title">Мгновенные уведомления</h3>
              <p className="landing-feature-text">
                Получайте мгновенные уведомления о новых задачах и изменениях в
                проектах. Будьте всегда в курсе происходящего в команде.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">💬</div>
              <h3 className="landing-feature-title">Встроенный чат</h3>
              <p className="landing-feature-text">
                Встроенный чат для быстрого уточнения деталей и обсуждения задач
                без переключения между приложениями.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">⏰</div>
              <h3 className="landing-feature-title">Умные напоминания</h3>
              <p className="landing-feature-text">
                Автоматические напоминания о дедлайнах помогут не упустить
                важные сроки и завершить проекты вовремя.
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">📊</div>
              <h3 className="landing-feature-title">Аналитика эффективности</h3>
              <p className="landing-feature-text">
                Детальная аналитика эффективности сотрудников для принятия
                обоснованных управленческих решений.
              </p>
            </div>
          </div>

          <div className="landing-hero-actions">
            <Link
              className="landing-hero-btn landing-hero-btn-primary"
              to={ROUTES.register}
            >
              Начать работу
            </Link>
            <a
              href="#why"
              className="landing-hero-btn landing-hero-btn-secondary"
            >
              Узнать больше
            </a>
          </div>
        </div>
      </section>

      {/* Блок «Почему Pulse-zone.tech?» с картинкой справа */}
      <section className="landing-why" id="why">
        <div className="landing-why-left">
          <h2 className="landing-why-title">
            Почему <span>Pulse-zone.tech?</span>
          </h2>
          <p className="landing-why-text">
            Важно держать «пульс команды» в зоне комфорта. Название отражает
            нашу философию — мониторинг состояния команды в режиме реального
            времени.
          </p>
          <p className="landing-why-text">
            А <i>tech</i> — это технология, которая делает управление простым и
            эффективным. Мы создали сервис, который объединяет все необходимые
            инструменты для командной работы в одном месте.
          </p>
          <p className="landing-why-text">
            Ну и потому что домен <code>.ru</code> был занят 🙂
          </p>
        </div>

        <div className="landing-why-right">
          <img
            src={landingMonitor}
            alt="Логотип Pulse-zone.tech"
            className="landing-why-image"
          />
        </div>
      </section>
    </div>
  );
};
