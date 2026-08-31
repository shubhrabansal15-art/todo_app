import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from database import Base, get_db

# Import models so they register with Base.metadata
from models.task import Task  # noqa: F401
from models.user import User  # noqa: F401


# SQLite in-memory engine for tests
# SQLite does not support MySQL ENUM; use file-based so TestClient can share it
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)


# Make SQLite enforce foreign keys
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Provide a transactional database session for direct DB tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session):
    """Provide a TestClient with the DB dependency overridden."""
    from main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

from auth import create_access_token, hash_password


@pytest.fixture
def register_and_login(client):
    """Register a user and return (token, user_dict)."""

    def _register(email="test@example.com", password="securepass123"):
        resp = client.post(
            "/api/auth/register",
            json={"email": email, "password": password},
        )
        assert resp.status_code == 201
        data = resp.json()
        return data["access_token"], data["user"]

    return _register


@pytest.fixture
def auth_client(client, register_and_login):
    """A TestClient pre-configured with a valid auth token."""
    token, user = register_and_login()
    client.headers["Authorization"] = f"Bearer {token}"
    return client, user
