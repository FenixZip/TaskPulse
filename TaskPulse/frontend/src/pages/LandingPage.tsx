// @ts-nocheck
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();

  const handleScrollMore = () => {
    window.scrollTo({ top: 700, behavior: "smooth" });
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* HERO */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Container sx={{ py: { xs: 6, md: 10 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
                TaskPulse
              </Typography>

              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                Система управления задачами для руководителей и команд.
                Назначайте задачи, контролируйте сроки и считайте KPI
                в едином веб-сервисе.
              </Typography>

              <Stack spacing={2}>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/login")}
                  >
                    Войти
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate("/register")}
                  >
                    Регистрация
                  </Button>
                </Stack>

                <Button variant="text" onClick={handleScrollMore}>
                  Подробнее о проекте
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Команда, работающая с задачами"
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  boxShadow: 4,
                  maxHeight: 360,
                  objectFit: "cover",
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ДЛЯ КОГО */}
      <Container sx={{ py: { xs: 6, md: 8 } }}>
        <Typography
          variant="h4"
          component="h2"
          align="center"
          sx={{ mb: 4, fontWeight: 600 }}
        >
          Для кого TaskPulse
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Создатель
                </Typography>
                <Typography color="text.secondary">
                  Назначает задачи, выбирает исполнителей, задаёт сроки и
                  приоритеты. Видит отчёты и может выгружать статистику для
                  расчёта KPI команды.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Исполнитель
                </Typography>
                <Typography color="text.secondary">
                  Получает задачи по приглашению. Работает только со своими
                  задачами, обновляет статусы и прикрепляет файлы по ходу
                  выполнения.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* ФУНКЦИОНАЛ */}
      <Box sx={{ bgcolor: "background.paper", py: { xs: 6, md: 8 } }}>
        <Container>
          <Typography
            variant="h4"
            component="h2"
            align="center"
            sx={{ mb: 4, fontWeight: 600 }}
          >
            Что умеет система
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Управление задачами
                  </Typography>
                  <Typography color="text.secondary">
                    Создавайте задачи с описанием, сроком и приоритетом.
                    Назначайте исполнителей и контролируйте выполнение в одном
                    месте.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Telegram-напоминания
                  </Typography>
                  <Typography color="text.secondary">
                    За 24 часа до дедлайна исполнитель получает уведомление
                    в Telegram: подтвердить срок или попросить продление на
                    сутки с указанием причины.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Отчёты и KPI
                  </Typography>
                  <Typography color="text.secondary">
                    Ежемесячные отчёты показывают, сколько задач закрыто в срок
                    и с каким приоритетом — готовая база для расчёта KPI и
                    оценки эффективности сотрудников.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Файлы и вложения
                  </Typography>
                  <Typography color="text.secondary">
                    Прикрепляйте к задачам документы, скриншоты и другие файлы,
                    чтобы вся информация по работе была в одном месте.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Современный стек
                  </Typography>
                  <Typography color="text.secondary">
                    Frontend на React, backend на Django 5.2, база PostgreSQL
                    и асинхронная обработка задач через Celery — система готова
                    к росту и нагрузке.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Надёжность и доступность
                  </Typography>
                  <Typography color="text.secondary">
                    TaskPulse рассчитан на одновременную работу нескольких
                    пользователей, быстрый отклик и сохранность данных в
                    защищённой базе.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FOOTER / CTA */}
      <Box sx={{ py: 6 }}>
        <Container>
          <Stack spacing={2} alignItems="center">
            <Typography variant="h5" align="center">
              Готовы навести порядок в задачах команды?
            </Typography>
            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: 600 }}
            >
              Зарегистрируйте Создателя, пригласите исполнителей и начните
              работать в едином пространстве задач, напоминаний и отчётов.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/login")}
            >
              Перейти к авторизации
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
