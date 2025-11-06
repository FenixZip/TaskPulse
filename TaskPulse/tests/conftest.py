"""conftest.py"""
import os
from pathlib import Path

import pytest

try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
except Exception:
    pass


@pytest.fixture(autouse=True)
def _enable_db_access_for_all_tests(db):
    """Автоматически открывает доступ к бд для каждого теста"""
    pass

@pytest.fixture(scope="session", autouse=True)
def _ensure_test_db_env_vars():
    """Гарантия,  что переменные окружения для PostgreSQL установлены"""
    os.environ.setdefault("DB_NAME", "taskpulse")
    os.environ.setdefault("DB_USER", "postgres")
    os.environ.setdefault("DB_PASSWORD", "postgres")
    os.environ.setdefault("DB_HOST", "127.0.0.1")
    os.environ.setdefault("DB_PORT", "5432")
    yield
