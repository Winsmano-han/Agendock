import importlib
import os
import sys
import tempfile
import unittest
from datetime import datetime


class TenantIsolationTests(unittest.TestCase):
  @classmethod
  def setUpClass(cls):
    cls._tmpdir = tempfile.TemporaryDirectory()
    db_path = os.path.join(cls._tmpdir.name, "test_agentdock.db")
    db_url = "sqlite:///" + db_path.replace("\\", "/")

    os.environ["DATABASE_URL"] = db_url
    os.environ["AUTH_REQUIRED"] = "1"
    os.environ["AUTH_TOKEN_TTL_SECONDS"] = "3600"
    os.environ["AUTH_TOKEN_SECRET"] = "test_secret"

    api_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if api_dir not in sys.path:
      sys.path.insert(0, api_dir)

    if "app" in sys.modules:
      del sys.modules["app"]
    cls.api = importlib.import_module("app")
    cls.client = cls.api.app.test_client()

  @classmethod
  def tearDownClass(cls):
    try:
      cls._tmpdir.cleanup()
    except Exception:
      pass

  def _create_tenant(self, name: str, email: str, password: str) -> int:
    resp = self.client.post(
      "/tenants",
      json={
        "name": name,
        "business_type": "general",
        "email": email,
        "password": password,
      },
    )
    self.assertEqual(resp.status_code, 201, resp.get_data(as_text=True))
    return int(resp.get_json()["id"])

  def _login(self, email: str, password: str) -> str:
    resp = self.client.post("/auth/login", json={"email": email, "password": password})
    self.assertEqual(resp.status_code, 200, resp.get_data(as_text=True))
    return str(resp.get_json()["auth_token"])

  def test_cross_tenant_access_is_denied(self):
    t1 = self._create_tenant("Tenant One", "t1@example.com", "pw1")
    t2 = self._create_tenant("Tenant Two", "t2@example.com", "pw2")

    token1 = self._login("t1@example.com", "pw1")
    token2 = self._login("t2@example.com", "pw2")

    # Tenant 1 can access its own resources.
    ok = self.client.get(
      f"/tenants/{t1}/stats",
      headers={"Authorization": f"Bearer {token1}"},
    )
    self.assertEqual(ok.status_code, 200, ok.get_data(as_text=True))

    # Tenant 1 cannot access tenant 2 resources with its token.
    blocked = self.client.get(
      f"/tenants/{t2}/stats",
      headers={"Authorization": f"Bearer {token1}"},
    )
    self.assertEqual(blocked.status_code, 401, blocked.get_data(as_text=True))

    # Create a message in tenant 2 directly (no AI dependency).
    db = self.api.SessionLocal()
    try:
      customer = self.api.Customer(
        tenant_id=t2,
        name="Bob",
        phone="+14155550123",
        created_at=datetime.utcnow(),
      )
      db.add(customer)
      db.flush()
      message = self.api.Message(
        tenant_id=t2,
        customer_id=customer.id,
        direction="in",
        text="hello",
        created_at=datetime.utcnow(),
      )
      db.add(message)
      db.commit()
      message_id = int(message.id)
    finally:
      db.close()

    # Tenant 2 can see its own messages with its token.
    msgs = self.client.get(
      f"/tenants/{t2}/messages",
      headers={"Authorization": f"Bearer {token2}"},
    )
    self.assertEqual(msgs.status_code, 200, msgs.get_data(as_text=True))
    body = msgs.get_json()
    self.assertTrue(isinstance(body, list) and body, body)
    ids = {int(m["id"]) for m in body}
    self.assertIn(message_id, ids)

    # Tenant 1 cannot delete tenant 2 message.
    del_resp = self.client.delete(
      f"/messages/{message_id}",
      headers={"Authorization": f"Bearer {token1}"},
    )
    self.assertEqual(del_resp.status_code, 401, del_resp.get_data(as_text=True))


if __name__ == "__main__":
  unittest.main()
