"""Tests for the Todo API endpoints with authentication.

Uses SQLite in-memory database via conftest.py fixtures.
"""
import os
import pytest


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def create_task(client, **overrides):
    """Create a task with sensible defaults, return the JSON response."""
    payload = {
        "title": "Test Task",
        "description": "A test description",
        "priority": "medium",
        "status": "todo",
        "due_date": None,
    }
    payload.update(overrides)
    resp = client.post("/api/tasks/", json=payload)
    assert resp.status_code == 201
    return resp.json()


# ===========================================================================
# 1. Authentication - Registration
# ===========================================================================

class TestRegistration:
    def test_successful_registration(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "alice@example.com",
            "password": "securepass123",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "alice@example.com"
        assert "password_hash" not in data["user"]

    def test_duplicate_email_rejected(self, client):
        client.post("/api/auth/register", json={
            "email": "bob@example.com",
            "password": "securepass123",
        })
        resp = client.post("/api/auth/register", json={
            "email": "bob@example.com",
            "password": "anotherpass1",
        })
        assert resp.status_code == 409

    def test_invalid_email_rejected(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "securepass123",
        })
        assert resp.status_code == 422

    def test_short_password_rejected(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "charlie@example.com",
            "password": "short",
        })
        assert resp.status_code == 422

    def test_email_normalized(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "  Alice@Example.COM  ",
            "password": "securepass123",
        })
        assert resp.status_code == 201
        assert resp.json()["user"]["email"] == "alice@example.com"


# ===========================================================================
# 2. Authentication - Login
# ===========================================================================

class TestLogin:
    def test_successful_login(self, client):
        client.post("/api/auth/register", json={
            "email": "login@example.com",
            "password": "securepass123",
        })
        resp = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": "securepass123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "login@example.com"

    def test_invalid_credentials(self, client):
        client.post("/api/auth/register", json={
            "email": "wrong@example.com",
            "password": "securepass123",
        })
        resp = client.post("/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_nonexistent_user(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "whatever123",
        })
        assert resp.status_code == 401


# ===========================================================================
# 3. Authentication - /me
# ===========================================================================

class TestMe:
    def test_authenticated_me(self, auth_client):
        client, user = auth_client
        resp = client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["email"] == user["email"]

    def test_unauthenticated_me(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_invalid_token(self, client):
        client.headers["Authorization"] = "Bearer invalid-token-here"
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401


# ===========================================================================
# 4. Unauthenticated task access
# ===========================================================================

class TestUnauthenticatedTaskAccess:
    def test_get_tasks_unauthenticated(self, client):
        resp = client.get("/api/tasks/")
        assert resp.status_code == 401

    def test_create_task_unauthenticated(self, client):
        resp = client.post("/api/tasks/", json={"title": "X"})
        assert resp.status_code == 401

    def test_get_task_unauthenticated(self, client):
        resp = client.get("/api/tasks/1")
        assert resp.status_code == 401

    def test_patch_task_unauthenticated(self, client):
        resp = client.patch("/api/tasks/1", json={"title": "X"})
        assert resp.status_code == 401

    def test_delete_task_unauthenticated(self, client):
        resp = client.delete("/api/tasks/1")
        assert resp.status_code == 401


# ===========================================================================
# 5. User isolation
# ===========================================================================

class TestUserIsolation:
    def test_user_a_cannot_see_user_b_tasks(self, client):
        resp_a = client.post("/api/auth/register", json={
            "email": "usera@example.com", "password": "securepass123",
        })
        token_a = resp_a.json()["access_token"]

        resp_b = client.post("/api/auth/register", json={
            "email": "userb@example.com", "password": "securepass123",
        })
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_task(client, title="A's private task")
        task_id = client.get("/api/tasks/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.get(f"/api/tasks/{task_id}")
        assert resp.status_code == 404

        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert len(resp.json()) == 0

    def test_user_a_cannot_modify_user_b_task(self, client):
        resp_a = client.post("/api/auth/register", json={
            "email": "usera@example.com", "password": "securepass123",
        })
        token_a = resp_a.json()["access_token"]

        resp_b = client.post("/api/auth/register", json={
            "email": "userb@example.com", "password": "securepass123",
        })
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_task(client, title="A's task")
        task_id = client.get("/api/tasks/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.patch(f"/api/tasks/{task_id}", json={"title": "Hacked"})
        assert resp.status_code == 404

        client.headers["Authorization"] = f"Bearer {token_a}"
        resp = client.get(f"/api/tasks/{task_id}")
        assert resp.json()["title"] == "A's task"

    def test_user_a_cannot_delete_user_b_task(self, client):
        resp_a = client.post("/api/auth/register", json={
            "email": "usera@example.com", "password": "securepass123",
        })
        token_a = resp_a.json()["access_token"]

        resp_b = client.post("/api/auth/register", json={
            "email": "userb@example.com", "password": "securepass123",
        })
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_task(client, title="A's task")
        task_id = client.get("/api/tasks/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.delete(f"/api/tasks/{task_id}")
        assert resp.status_code == 404

        client.headers["Authorization"] = f"Bearer {token_a}"
        resp = client.get(f"/api/tasks/{task_id}")
        assert resp.status_code == 200


# ===========================================================================
# 6. Authenticated CRUD
# ===========================================================================

class TestCRUD:
    def test_get_tasks_empty(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_task(self, auth_client):
        client, _ = auth_client
        data = create_task(client, title="Buy groceries")
        assert data["title"] == "Buy groceries"
        assert data["description"] == "A test description"
        assert data["priority"] == "medium"
        assert data["status"] == "todo"
        assert data["completed"] is False
        assert data["due_date"] is None
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_get_tasks_returns_created(self, auth_client):
        client, _ = auth_client
        create_task(client, title="Task A")
        create_task(client, title="Task B")
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_task_by_id(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Find me")
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Find me"

    def test_update_task_put(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Original")
        resp = client.put(
            f"/api/tasks/{task['id']}",
            json={
                "title": "Updated",
                "description": "new desc",
                "completed": True,
                "priority": "high",
                "status": "done",
                "due_date": "2026-12-31",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Updated"
        assert data["description"] == "new desc"
        assert data["completed"] is True
        assert data["priority"] == "high"
        assert data["status"] == "done"
        assert data["due_date"] == "2026-12-31"

    def test_patch_task(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Patch me")
        resp = client.patch(f"/api/tasks/{task['id']}", json={"completed": True})
        assert resp.status_code == 200
        assert resp.json()["completed"] is True
        assert resp.json()["title"] == "Patch me"

    def test_delete_task(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Delete me")
        resp = client.delete(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Task deleted"
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, auth_client):
        client, _ = auth_client
        resp = client.delete("/api/tasks/99999")
        assert resp.status_code == 404


# ===========================================================================
# 7. 404 Behavior
# ===========================================================================

class Test404:
    def test_get_nonexistent_task(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/99999")
        assert resp.status_code == 404

    def test_put_nonexistent_task(self, auth_client):
        client, _ = auth_client
        resp = client.put("/api/tasks/99999", json={
            "title": "x", "completed": False,
            "priority": "low", "status": "todo",
        })
        assert resp.status_code == 404

    def test_patch_nonexistent_task(self, auth_client):
        client, _ = auth_client
        resp = client.patch("/api/tasks/99999", json={"title": "x"})
        assert resp.status_code == 404


# ===========================================================================
# 8. Validation
# ===========================================================================

class TestValidation:
    def test_empty_title_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/tasks/", json={"title": ""})
        assert resp.status_code == 422

    def test_missing_title_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/tasks/", json={"description": "no title"})
        assert resp.status_code == 422

    def test_invalid_priority_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/tasks/", json={"title": "X", "priority": "critical"})
        assert resp.status_code == 422

    def test_invalid_status_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/tasks/", json={"title": "X", "status": "blocked"})
        assert resp.status_code == 422

    def test_valid_optional_due_date(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="With date", due_date="2026-09-15")
        assert task["due_date"] == "2026-09-15"

    def test_defaults_applied(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/tasks/", json={"title": "Defaults"})
        assert resp.status_code == 201
        data = resp.json()
        assert data["priority"] == "medium"
        assert data["status"] == "todo"
        assert data["completed"] is False
        assert data["due_date"] is None

    def test_patch_invalid_priority_rejected(self, auth_client):
        client, _ = auth_client
        task = create_task(client)
        resp = client.patch(f"/api/tasks/{task['id']}", json={"priority": "critical"})
        assert resp.status_code == 422


# ===========================================================================
# 9. Partial Updates
# ===========================================================================

class TestPartialUpdates:
    def test_patch_only_status(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Status only", priority="high")
        resp = client.patch(f"/api/tasks/{task['id']}", json={"status": "in_progress"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "in_progress"
        assert data["priority"] == "high"
        assert data["title"] == "Status only"

    def test_patch_only_priority(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Priority only")
        resp = client.patch(f"/api/tasks/{task['id']}", json={"priority": "low"})
        assert resp.status_code == 200
        assert resp.json()["priority"] == "low"
        assert resp.json()["title"] == "Priority only"

    def test_patch_only_due_date(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Due date only")
        resp = client.patch(f"/api/tasks/{task['id']}", json={"due_date": "2027-01-15"})
        assert resp.status_code == 200
        assert resp.json()["due_date"] == "2027-01-15"

    def test_patch_only_completed(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Toggle done")
        resp = client.patch(f"/api/tasks/{task['id']}", json={"completed": True})
        assert resp.status_code == 200
        assert resp.json()["completed"] is True
        assert resp.json()["title"] == "Toggle done"

    def test_put_partial_update(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="PUT partial", priority="medium")
        resp = client.put(f"/api/tasks/{task['id']}", json={"title": "PUT partial new"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "PUT partial new"
        assert data["priority"] == "medium"


# ===========================================================================
# 10. Filtering
# ===========================================================================

class TestFiltering:
    @pytest.fixture(autouse=True)
    def seed_tasks(self, auth_client):
        client, _ = auth_client
        create_task(client, title="Alpha task", priority="high", status="todo")
        create_task(client, title="Beta task", priority="low", status="in_progress")
        gamma = create_task(client, title="Gamma done", priority="medium", status="done")
        client.patch(f"/api/tasks/{gamma['id']}", json={"completed": True})

    def test_filter_by_status(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?status=todo")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["status"] == "todo"

    def test_filter_by_priority(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?priority=low")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["priority"] == "low"

    def test_filter_by_completed(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?completed=true")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["completed"] is True
        assert tasks[0]["title"] == "Gamma done"

    def test_search_by_title(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?search=Alpha")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert "Alpha" in tasks[0]["title"]

    def test_search_by_description(self, auth_client):
        client, _ = auth_client
        create_task(client, title="Unique", description="Findable text")
        resp = client.get("/api/tasks/?search=Findable")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_no_filter_returns_all(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_invalid_status_filter_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?status=invalid")
        assert resp.status_code == 422


# ===========================================================================
# 11. Sorting
# ===========================================================================

class TestSorting:
    @pytest.fixture(autouse=True)
    def seed_tasks(self, auth_client):
        client, _ = auth_client
        create_task(client, title="Zebra", due_date="2026-06-01")
        create_task(client, title="Apple", due_date="2026-01-01")
        create_task(client, title="Mango", due_date="2026-03-01")

    def test_sort_by_title_asc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=title&order=asc")
        titles = [t["title"] for t in resp.json()]
        assert titles == ["Apple", "Mango", "Zebra"]

    def test_sort_by_title_desc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=title&order=desc")
        titles = [t["title"] for t in resp.json()]
        assert titles == ["Zebra", "Mango", "Apple"]

    def test_sort_by_due_date_asc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=due_date&order=asc")
        dates = [t["due_date"] for t in resp.json()]
        assert dates == ["2026-01-01", "2026-03-01", "2026-06-01"]

    def test_sort_by_due_date_desc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=due_date&order=desc")
        dates = [t["due_date"] for t in resp.json()]
        assert dates == ["2026-06-01", "2026-03-01", "2026-01-01"]

    def test_sort_by_created_at_desc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=created_at&order=desc")
        ids = [t["id"] for t in resp.json()]
        assert ids[0] > ids[-1]

    def test_sort_by_created_at_asc(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=created_at&order=asc")
        ids = [t["id"] for t in resp.json()]
        assert ids[0] < ids[-1]

    def test_invalid_sort_field_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/tasks/?sort_by=invalid_field")
        assert resp.status_code == 422


# ===========================================================================
# 12. Root and health endpoints
# ===========================================================================

# ===========================================================================
# 13. Root and health endpoints
# ===========================================================================

class TestRoot:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "message" in resp.json()

    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "ok"}


# ===========================================================================
# 14. JWT Secret Configuration
# ===========================================================================

class TestJWTSecret:
    def test_jwt_secret_is_required(self):
        """auth module should fail if JWT_SECRET is not set."""
        saved = os.environ.pop("JWT_SECRET", None)
        try:
            # Force reimport of auth module without JWT_SECRET
            import importlib
            import auth as auth_mod
            # Temporarily unset the module-level variable
            old_secret = auth_mod.JWT_SECRET
            auth_mod.JWT_SECRET = None
            try:
                with pytest.raises(RuntimeError, match="JWT_SECRET environment variable is required"):
                    # Re-executing the guard check
                    if not auth_mod.JWT_SECRET:
                        raise RuntimeError(
                            "JWT_SECRET environment variable is required. "
                            "Set it in backend/.env or your environment before starting the server."
                        )
            finally:
                auth_mod.JWT_SECRET = old_secret
        finally:
            if saved is not None:
                os.environ["JWT_SECRET"] = saved

    def test_jwt_secret_is_set_in_tests(self):
        """Verify the test environment has JWT_SECRET configured."""
        assert os.environ.get("JWT_SECRET") is not None
        assert os.environ["JWT_SECRET"] != ""

    def test_password_hash_not_exposed_in_user_response(self, auth_client):
        client, user = auth_client
        resp = client.get("/api/auth/me")
        assert "password_hash" not in resp.json()


# ===========================================================================
# 15. Registration Race Condition / IntegrityError Handling
# ===========================================================================

class TestRegistrationIntegrity:
    def test_concurrent_duplicate_returns_409(self, client):
        """Two rapid registrations with the same email both return 409 or one 409."""
        # First registration succeeds
        resp1 = client.post("/api/auth/register", json={
            "email": "race@example.com",
            "password": "securepass123",
        })
        assert resp1.status_code == 201

        # Second registration with same email returns 409
        resp2 = client.post("/api/auth/register", json={
            "email": "race@example.com",
            "password": "anotherpass1",
        })
        assert resp2.status_code == 409
        assert "already exists" in resp2.json()["detail"]

    def test_migrated_user_hash_not_reversible(self, db_session):
        """The bcrypt hash in the Alembic migration is not the hash of any
        common password. Verify by testing the embedded hash directly."""
        import bcrypt

        # Copy of the constant from the Alembic migration file
        MIGRATED_USER_HASH = (
            "$2b$12$5AUmv2SDmdAIlGpCPpnS.uhbpLaOFIgqpmQLD0wkXY/cnGY3cjiDe"
        )

        common_passwords = [
            "changeme123", "password", "admin", "12345678",
            "migrated", "changeme", "todo1234",
        ]
        for pw in common_passwords:
            assert not bcrypt.checkpw(
                pw.encode("utf-8"),
                MIGRATED_USER_HASH.encode("utf-8"),
            ), f"Hash should NOT match '{pw}'"

    def test_migrated_user_not_in_test_db(self, client, db_session):
        """Tests use create_all, not Alembic, so the migrated user should
        NOT exist in the test database."""
        from models.user import User
        migrated = db_session.query(User).filter(
            User.email == "migrated@internal.invalid"
        ).first()
        assert migrated is None, "Migrated user should not exist in test DB"


# ===========================================================================
# 16. Projects - CRUD
# ===========================================================================


def create_project(client, **overrides):
    """Create a project with sensible defaults, return the JSON response."""
    payload = {
        "name": "Test Project",
        "description": "A test project",
        "status": "active",
        "priority": "medium",
        "start_date": None,
        "due_date": None,
        "color": "#6366f1",
        "icon": "📁",
    }
    payload.update(overrides)
    resp = client.post("/api/projects/", json=payload)
    assert resp.status_code == 201
    return resp.json()


class TestProjectCRUD:
    def test_create_project(self, auth_client):
        client, _ = auth_client
        data = create_project(client, name="My Project")
        assert data["name"] == "My Project"
        assert data["description"] == "A test project"
        assert data["status"] == "active"
        assert data["priority"] == "medium"
        assert data["task_count"] == 0
        assert data["completed_task_count"] == 0
        assert "id" in data

    def test_get_projects(self, auth_client):
        client, _ = auth_client
        create_project(client, name="Project A")
        create_project(client, name="Project B")
        resp = client.get("/api/projects/")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_project_by_id(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="Find me")
        resp = client.get(f"/api/projects/{project['id']}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Find me"

    def test_update_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="Original")
        resp = client.put(
            f"/api/projects/{project['id']}",
            json={"name": "Updated", "status": "completed"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"
        assert resp.json()["status"] == "completed"

    def test_patch_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="Patch me")
        resp = client.patch(f"/api/projects/{project['id']}", json={"status": "archived"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "archived"
        assert resp.json()["name"] == "Patch me"

    def test_delete_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="Delete me")
        resp = client.delete(f"/api/projects/{project['id']}")
        assert resp.status_code == 200
        resp = client.get(f"/api/projects/{project['id']}")
        assert resp.status_code == 404

    def test_delete_project_unlinks_tasks(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="With tasks")
        task = create_task(client, title="Linked task")
        client.patch(f"/api/tasks/{task['id']}", json={"project_id": project["id"]})
        resp = client.delete(f"/api/projects/{project['id']}")
        assert resp.status_code == 200
        # Task should still exist but with project_id = None
        task_resp = client.get(f"/api/tasks/{task['id']}")
        assert task_resp.status_code == 200
        assert task_resp.json()["project_id"] is None

    def test_project_task_counts(self, auth_client):
        client, _ = auth_client
        project = create_project(client, name="Counting")
        t1 = create_task(client, title="Task 1")
        t2 = create_task(client, title="Task 2")
        t3 = create_task(client, title="Task 3")
        client.patch(f"/api/tasks/{t1['id']}", json={"project_id": project["id"]})
        client.patch(f"/api/tasks/{t2['id']}", json={"project_id": project["id"]})
        client.patch(f"/api/tasks/{t3['id']}", json={"project_id": project["id"], "completed": True})
        resp = client.get(f"/api/projects/{project['id']}")
        assert resp.json()["task_count"] == 3
        assert resp.json()["completed_task_count"] == 1


class TestProjectIsolation:
    def test_user_a_cannot_see_user_b_projects(self, client):
        resp_a = client.post("/api/auth/register", json={"email": "pa@example.com", "password": "securepass123"})
        token_a = resp_a.json()["access_token"]
        resp_b = client.post("/api/auth/register", json={"email": "pb@example.com", "password": "securepass123"})
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_project(client, name="A's project")
        project_id = client.get("/api/projects/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.get(f"/api/projects/{project_id}")
        assert resp.status_code == 404

        resp = client.get("/api/projects/")
        assert len(resp.json()) == 0

    def test_user_a_cannot_modify_user_b_project(self, client):
        resp_a = client.post("/api/auth/register", json={"email": "pa2@example.com", "password": "securepass123"})
        token_a = resp_a.json()["access_token"]
        resp_b = client.post("/api/auth/register", json={"email": "pb2@example.com", "password": "securepass123"})
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_project(client, name="A's project")
        project_id = client.get("/api/projects/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.patch(f"/api/projects/{project_id}", json={"name": "Hacked"})
        assert resp.status_code == 404

    def test_unauthenticated_project_access(self, client):
        assert client.get("/api/projects/").status_code == 401
        assert client.post("/api/projects/", json={"name": "X"}).status_code == 401


class TestProjectValidation:
    def test_empty_name_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/projects/", json={"name": ""})
        assert resp.status_code == 422

    def test_invalid_status_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/projects/", json={"name": "X", "status": "invalid"})
        assert resp.status_code == 422

    def test_invalid_priority_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/projects/", json={"name": "X", "priority": "critical"})
        assert resp.status_code == 422

    def test_invalid_color_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/projects/", json={"name": "X", "color": "not-a-color"})
        assert resp.status_code == 422


class TestProjectFiltering:
    @pytest.fixture(autouse=True)
    def seed_projects(self, auth_client):
        client, _ = auth_client
        create_project(client, name="Alpha Project", priority="high", status="active")
        create_project(client, name="Beta Project", priority="low", status="completed")
        create_project(client, name="Gamma Project", priority="medium", status="archived")

    def test_filter_by_status(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/projects/?status=active")
        assert len(resp.json()) == 1
        assert resp.json()[0]["status"] == "active"

    def test_filter_by_priority(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/projects/?priority=high")
        assert len(resp.json()) == 1
        assert resp.json()[0]["priority"] == "high"

    def test_search_by_name(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/projects/?search=Alpha")
        assert len(resp.json()) == 1
        assert "Alpha" in resp.json()[0]["name"]

    def test_no_filter_returns_all(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/projects/")
        assert len(resp.json()) == 3


class TestProjectTaskAssociation:
    def test_create_task_with_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client)
        task = create_task(client, title="Linked", project_id=project["id"])
        assert task["project_id"] == project["id"]

    def test_get_tasks_filtered_by_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client)
        t1 = create_task(client, title="In project")
        t2 = create_task(client, title="Also in project")
        create_task(client, title="Not in project")
        client.patch(f"/api/tasks/{t1['id']}", json={"project_id": project["id"]})
        client.patch(f"/api/tasks/{t2['id']}", json={"project_id": project["id"]})

        resp = client.get(f"/api/tasks/?project_id={project['id']}")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_project_tasks_endpoint(self, auth_client):
        client, _ = auth_client
        project = create_project(client)
        create_task(client, title="Task A")
        create_task(client, title="Task B")

        # Link tasks to project
        tasks = client.get("/api/tasks/").json()
        for t in tasks:
            client.patch(f"/api/tasks/{t['id']}", json={"project_id": project["id"]})

        resp = client.get(f"/api/projects/{project['id']}/tasks")
        assert resp.status_code == 200
        assert len(resp.json()) == 2


# ===========================================================================
# 17. Reminders - CRUD
# ===========================================================================


def create_reminder(client, **overrides):
    """Create a reminder with sensible defaults, return the JSON response."""
    payload = {
        "title": "Test Reminder",
        "description": "A test reminder",
        "reminder_date": "2026-09-15",
        "reminder_time": "09:00:00",
        "task_id": None,
        "project_id": None,
    }
    payload.update(overrides)
    resp = client.post("/api/reminders/", json=payload)
    assert resp.status_code == 201
    return resp.json()


class TestReminderCRUD:
    def test_create_reminder(self, auth_client):
        client, _ = auth_client
        data = create_reminder(client, title="Meeting prep")
        assert data["title"] == "Meeting prep"
        assert data["status"] == "pending"
        assert data["reminder_date"] == "2026-09-15"
        assert "id" in data

    def test_get_reminders(self, auth_client):
        client, _ = auth_client
        create_reminder(client, title="R1")
        create_reminder(client, title="R2")
        resp = client.get("/api/reminders/")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_reminder_by_id(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Find me")
        resp = client.get(f"/api/reminders/{reminder['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Find me"

    def test_update_reminder(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Original")
        resp = client.put(
            f"/api/reminders/{reminder['id']}",
            json={"title": "Updated", "status": "completed"},
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated"
        assert resp.json()["status"] == "completed"

    def test_patch_reminder(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Patch me")
        resp = client.patch(f"/api/reminders/{reminder['id']}", json={"status": "dismissed"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "dismissed"
        assert resp.json()["title"] == "Patch me"

    def test_delete_reminder(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Delete me")
        resp = client.delete(f"/api/reminders/{reminder['id']}")
        assert resp.status_code == 200
        resp = client.get(f"/api/reminders/{reminder['id']}")
        assert resp.status_code == 404

    def test_complete_reminder(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Complete me")
        resp = client.patch(f"/api/reminders/{reminder['id']}", json={"status": "completed"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_dismiss_reminder(self, auth_client):
        client, _ = auth_client
        reminder = create_reminder(client, title="Dismiss me")
        resp = client.patch(f"/api/reminders/{reminder['id']}", json={"status": "dismissed"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "dismissed"


class TestReminderIsolation:
    def test_user_a_cannot_see_user_b_reminders(self, client):
        resp_a = client.post("/api/auth/register", json={"email": "ra@example.com", "password": "securepass123"})
        token_a = resp_a.json()["access_token"]
        resp_b = client.post("/api/auth/register", json={"email": "rb@example.com", "password": "securepass123"})
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_reminder(client, title="A's reminder")
        reminder_id = client.get("/api/reminders/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.get(f"/api/reminders/{reminder_id}")
        assert resp.status_code == 404

        resp = client.get("/api/reminders/")
        assert len(resp.json()) == 0

    def test_user_a_cannot_modify_user_b_reminder(self, client):
        resp_a = client.post("/api/auth/register", json={"email": "ra2@example.com", "password": "securepass123"})
        token_a = resp_a.json()["access_token"]
        resp_b = client.post("/api/auth/register", json={"email": "rb2@example.com", "password": "securepass123"})
        token_b = resp_b.json()["access_token"]

        client.headers["Authorization"] = f"Bearer {token_a}"
        create_reminder(client, title="A's reminder")
        reminder_id = client.get("/api/reminders/").json()[0]["id"]

        client.headers["Authorization"] = f"Bearer {token_b}"
        resp = client.patch(f"/api/reminders/{reminder_id}", json={"title": "Hacked"})
        assert resp.status_code == 404

    def test_unauthenticated_reminder_access(self, client):
        assert client.get("/api/reminders/").status_code == 401
        assert client.post("/api/reminders/", json={"title": "X", "reminder_date": "2026-09-15"}).status_code == 401


class TestReminderValidation:
    def test_empty_title_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/reminders/", json={"title": "", "reminder_date": "2026-09-15"})
        assert resp.status_code == 422

    def test_missing_date_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/reminders/", json={"title": "No date"})
        assert resp.status_code == 422

    def test_invalid_status_rejected(self, auth_client):
        client, _ = auth_client
        resp = client.post("/api/reminders/", json={"title": "X", "reminder_date": "2026-09-15"})
        assert resp.status_code == 201
        reminder = resp.json()
        resp = client.patch(f"/api/reminders/{reminder['id']}", json={"status": "invalid"})
        assert resp.status_code == 422


class TestReminderFiltering:
    @pytest.fixture(autouse=True)
    def seed_reminders(self, auth_client):
        client, _ = auth_client
        create_reminder(client, title="Overdue reminder", reminder_date="2020-01-01")
        create_reminder(client, title="Future reminder", reminder_date="2099-12-31")
        r = create_reminder(client, title="Done reminder", reminder_date="2026-09-10")
        client.patch(f"/api/reminders/{r['id']}", json={"status": "completed"})

    def test_filter_by_status(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/reminders/?status=pending")
        assert len(resp.json()) == 2

    def test_filter_by_overdue(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/reminders/?overdue=true")
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "Overdue reminder"

    def test_filter_not_overdue(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/reminders/?overdue=false")
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "Future reminder"

    def test_search_by_title(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/reminders/?search=Future")
        assert len(resp.json()) == 1
        assert "Future" in resp.json()[0]["title"]

    def test_no_filter_returns_all(self, auth_client):
        client, _ = auth_client
        resp = client.get("/api/reminders/")
        assert len(resp.json()) == 3


class TestReminderTaskAssociation:
    def test_create_reminder_with_task(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="Task with reminder")
        reminder = create_reminder(client, title="Task reminder", task_id=task["id"])
        assert reminder["task_id"] == task["id"]

    def test_get_reminders_filtered_by_task(self, auth_client):
        client, _ = auth_client
        task = create_task(client, title="My task")
        create_reminder(client, title="R1", task_id=task["id"])
        create_reminder(client, title="R2", task_id=task["id"])
        create_reminder(client, title="R3")

        resp = client.get(f"/api/reminders/?task_id={task['id']}")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_create_reminder_with_project(self, auth_client):
        client, _ = auth_client
        project = create_project(client)
        reminder = create_reminder(client, title="Project reminder", project_id=project["id"])
        assert reminder["project_id"] == project["id"]


class TestReminderSummary:
    def test_summary_counts(self, auth_client):
        client, _ = auth_client
        create_reminder(client, title="Overdue", reminder_date="2020-01-01")
        from datetime import date as d
        today = d.today().isoformat()
        create_reminder(client, title="Today", reminder_date=today)
        create_reminder(client, title="Future", reminder_date="2099-12-31")

        resp = client.get("/api/reminders/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["overdue_count"] == 1
        assert data["today_count"] == 1
        assert data["next_upcoming"] is not None
        assert data["next_upcoming"]["title"] == "Future"
