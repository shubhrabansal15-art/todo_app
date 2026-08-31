"""Tests for the Todo API endpoints.

Uses SQLite in-memory database via conftest.py fixtures.
No dependency on the user's MySQL database.
"""
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
    assert resp.status_code == 200
    return resp.json()


# ===========================================================================
# 1. Basic CRUD
# ===========================================================================

class TestCRUD:
    def test_get_tasks_empty(self, client):
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_task(self, client):
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

    def test_get_tasks_returns_created(self, client):
        create_task(client, title="Task A")
        create_task(client, title="Task B")
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_get_task_by_id(self, client):
        task = create_task(client, title="Find me")
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["title"] == "Find me"

    def test_update_task_put(self, client):
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

    def test_patch_task(self, client):
        task = create_task(client, title="Patch me")
        resp = client.patch(
            f"/api/tasks/{task['id']}",
            json={"completed": True},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["completed"] is True
        assert data["title"] == "Patch me"  # unchanged

    def test_delete_task(self, client):
        task = create_task(client, title="Delete me")
        resp = client.delete(f"/api/tasks/{task['id']}")
        assert resp.status_code == 200
        assert resp.json()["message"] == "Task deleted"

        # Verify it's gone
        resp = client.get(f"/api/tasks/{task['id']}")
        assert resp.status_code == 404

    def test_delete_nonexistent_returns_404(self, client):
        resp = client.delete("/api/tasks/99999")
        assert resp.status_code == 404


# ===========================================================================
# 2. 404 Behavior
# ===========================================================================

class Test404:
    def test_get_nonexistent_task(self, client):
        resp = client.get("/api/tasks/99999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Task not found"

    def test_put_nonexistent_task(self, client):
        resp = client.put(
            "/api/tasks/99999",
            json={
                "title": "x",
                "completed": False,
                "priority": "low",
                "status": "todo",
            },
        )
        assert resp.status_code == 404

    def test_patch_nonexistent_task(self, client):
        resp = client.patch("/api/tasks/99999", json={"title": "x"})
        assert resp.status_code == 404


# ===========================================================================
# 3. Validation
# ===========================================================================

class TestValidation:
    def test_empty_title_rejected(self, client):
        resp = client.post("/api/tasks/", json={"title": ""})
        assert resp.status_code == 422

    def test_missing_title_rejected(self, client):
        resp = client.post("/api/tasks/", json={"description": "no title"})
        assert resp.status_code == 422

    def test_invalid_priority_rejected(self, client):
        resp = client.post(
            "/api/tasks/", json={"title": "X", "priority": "urgent"}
        )
        assert resp.status_code == 422

    def test_invalid_status_rejected(self, client):
        resp = client.post(
            "/api/tasks/", json={"title": "X", "status": "blocked"}
        )
        assert resp.status_code == 422

    def test_valid_optional_due_date(self, client):
        task = create_task(client, title="With date", due_date="2026-09-15")
        assert task["due_date"] == "2026-09-15"

    def test_defaults_applied(self, client):
        resp = client.post("/api/tasks/", json={"title": "Defaults"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["priority"] == "medium"
        assert data["status"] == "todo"
        assert data["completed"] is False
        assert data["due_date"] is None

    def test_patch_invalid_priority_rejected(self, client):
        task = create_task(client)
        resp = client.patch(
            f"/api/tasks/{task['id']}", json={"priority": "urgent"}
        )
        assert resp.status_code == 422


# ===========================================================================
# 4. Partial Updates
# ===========================================================================

class TestPartialUpdates:
    def test_patch_only_status(self, client):
        task = create_task(client, title="Status only", priority="high")
        resp = client.patch(
            f"/api/tasks/{task['id']}", json={"status": "in_progress"}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "in_progress"
        assert data["priority"] == "high"  # unchanged
        assert data["title"] == "Status only"  # unchanged

    def test_patch_only_priority(self, client):
        task = create_task(client, title="Priority only")
        resp = client.patch(
            f"/api/tasks/{task['id']}", json={"priority": "low"}
        )
        assert resp.status_code == 200
        assert resp.json()["priority"] == "low"
        assert resp.json()["title"] == "Priority only"

    def test_patch_only_due_date(self, client):
        task = create_task(client, title="Due date only")
        resp = client.patch(
            f"/api/tasks/{task['id']}", json={"due_date": "2027-01-15"}
        )
        assert resp.status_code == 200
        assert resp.json()["due_date"] == "2027-01-15"

    def test_patch_only_completed(self, client):
        task = create_task(client, title="Toggle done")
        resp = client.patch(
            f"/api/tasks/{task['id']}", json={"completed": True}
        )
        assert resp.status_code == 200
        assert resp.json()["completed"] is True
        assert resp.json()["title"] == "Toggle done"

    def test_put_partial_update(self, client):
        """PUT also supports partial updates (only non-null fields applied)."""
        task = create_task(client, title="PUT partial", priority="medium")
        resp = client.put(
            f"/api/tasks/{task['id']}",
            json={"title": "PUT partial new"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "PUT partial new"
        assert data["priority"] == "medium"  # not overwritten


# ===========================================================================
# 5. Filtering
# ===========================================================================

class TestFiltering:
    @pytest.fixture(autouse=True)
    def seed_tasks(self, client):
        """Create a mix of tasks for filter tests."""
        create_task(client, title="Alpha task", priority="high", status="todo")
        create_task(client, title="Beta task", priority="low", status="in_progress")
        gamma = create_task(client, title="Gamma done", priority="medium", status="done")
        client.patch(f"/api/tasks/{gamma['id']}", json={"completed": True})

    def test_filter_by_status(self, client):
        resp = client.get("/api/tasks/?status=todo")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["status"] == "todo"

    def test_filter_by_priority(self, client):
        resp = client.get("/api/tasks/?priority=low")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["priority"] == "low"

    def test_filter_by_completed(self, client):
        resp = client.get("/api/tasks/?completed=true")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert tasks[0]["completed"] is True
        assert tasks[0]["title"] == "Gamma done"

    def test_search_by_title(self, client):
        resp = client.get("/api/tasks/?search=Alpha")
        assert resp.status_code == 200
        tasks = resp.json()
        assert len(tasks) == 1
        assert "Alpha" in tasks[0]["title"]

    def test_search_by_description(self, client):
        create_task(client, title="Unique", description="Findable text")
        resp = client.get("/api/tasks/?search=Findable")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_no_filter_returns_all(self, client):
        resp = client.get("/api/tasks/")
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    def test_invalid_status_filter_rejected(self, client):
        resp = client.get("/api/tasks/?status=invalid")
        assert resp.status_code == 422


# ===========================================================================
# 6. Sorting
# ===========================================================================

class TestSorting:
    @pytest.fixture(autouse=True)
    def seed_tasks(self, client):
        create_task(client, title="Zebra", due_date="2026-06-01")
        create_task(client, title="Apple", due_date="2026-01-01")
        create_task(client, title="Mango", due_date="2026-03-01")

    def test_sort_by_title_asc(self, client):
        resp = client.get("/api/tasks/?sort_by=title&order=asc")
        titles = [t["title"] for t in resp.json()]
        assert titles == ["Apple", "Mango", "Zebra"]

    def test_sort_by_title_desc(self, client):
        resp = client.get("/api/tasks/?sort_by=title&order=desc")
        titles = [t["title"] for t in resp.json()]
        assert titles == ["Zebra", "Mango", "Apple"]

    def test_sort_by_due_date_asc(self, client):
        resp = client.get("/api/tasks/?sort_by=due_date&order=asc")
        dates = [t["due_date"] for t in resp.json()]
        assert dates == ["2026-01-01", "2026-03-01", "2026-06-01"]

    def test_sort_by_due_date_desc(self, client):
        resp = client.get("/api/tasks/?sort_by=due_date&order=desc")
        dates = [t["due_date"] for t in resp.json()]
        assert dates == ["2026-06-01", "2026-03-01", "2026-01-01"]

    def test_sort_by_created_at_desc(self, client):
        resp = client.get("/api/tasks/?sort_by=created_at&order=desc")
        ids = [t["id"] for t in resp.json()]
        # Last created should be first
        assert ids[0] > ids[-1]

    def test_sort_by_created_at_asc(self, client):
        resp = client.get("/api/tasks/?sort_by=created_at&order=asc")
        ids = [t["id"] for t in resp.json()]
        assert ids[0] < ids[-1]

    def test_invalid_sort_field_rejected(self, client):
        resp = client.get("/api/tasks/?sort_by=invalid_field")
        assert resp.status_code == 422


# ===========================================================================
# 7. Root endpoint
# ===========================================================================

class TestRoot:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert "message" in resp.json()
