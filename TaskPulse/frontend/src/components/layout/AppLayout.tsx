// @ts-nocheck
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { clearAuth, getCurrentUser } from "../../api/auth";

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/app")}
          >
            TaskPulse
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {user && (
              <Typography variant="body2">
                {user.email} ({user.role})
              </Typography>
            )}
            <Button color="inherit" onClick={handleLogout}>
              Выйти
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4, flexGrow: 1 }}>{children}</Container>
    </Box>
  );
}
