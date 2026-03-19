# Frappe Integration
Scaffold a complete third-party integration: Settings DocType, adapter class, webhook, background sync, tests.

## Step 1: Parse $ARGUMENTS
Extract:
- Service name (e.g. Razorpay, Shopify, Shiprocket)
- Direction: inbound (webhook), outbound (API call), or both
- Primary action (payment, sync orders, shipping labels, notifications)

## Step 2: Read Existing Structure
1. Check `apps/<app>/<app>/integrations/` for existing integrations (follow same pattern)
2. Read `CLAUDE.md` for app name and conventions

## Step 3: Generate Settings DocType
Create `<ServiceName> Settings` as a Single DocType with:
```
Fields required:
- api_key       (Data, reqd, label: API Key)
- api_secret    (Password, reqd, label: API Secret)  ← Password = encrypted
- base_url      (Data, default: https://api.<service>.com/v1)
- is_enabled    (Check, label: Enable Integration)
- test_mode     (Check, label: Sandbox / Test Mode)
- last_sync_on  (Datetime, read_only)
```
Client script must include a "Test Connection" button in `refresh()`.

## Step 4: Generate Adapter Class
File: `apps/<app>/<app>/integrations/<service_snake>.py`
```python
import frappe, hmac, hashlib, requests
from frappe import _

class <Service>Integration:
    def __init__(self):
        self.settings = frappe.get_cached_doc("<Service> Settings")
        if not self.settings.is_enabled:
            frappe.throw(_("<Service> integration is disabled"))
        self.api_key = self.settings.api_key
        self.secret  = self.settings.get_password("api_secret")
        self.base_url = self.settings.base_url
        self._session = None

    def _get_session(self):
        if not self._session:
            s = requests.Session()
            s.headers.update({"Authorization": f"Bearer {self.api_key}",
                              "Content-Type": "application/json"})
            self._session = s
        return self._session

    def _request(self, method, endpoint, **kwargs):
        """Central request with logging + error handling."""
        url = f"{self.base_url}/{endpoint}"
        frappe.logger().debug(f"<Service> {method} {url}")
        resp = self._get_session().request(method, url, timeout=30, **kwargs)
        if not resp.ok:
            frappe.log_error(resp.text, f"<Service> API Error: {resp.status_code}")
            frappe.throw(_("<Service> API error: {0}").format(resp.status_code))
        return resp.json()

    def verify_signature(self, payload_bytes, signature, secret=None):
        """HMAC-SHA256 signature verification."""
        expected = hmac.new(
            (secret or self.secret).encode(),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected, signature):
            frappe.throw(_("Invalid <Service> webhook signature"), frappe.PermissionError)
```

## Step 5: Generate Webhook Handler
```python
@frappe.whitelist(allow_guest=True)
def webhook():
    payload_bytes = frappe.request.data
    signature = frappe.request.headers.get("<X-Signature-Header>", "")
    <Service>Integration().verify_signature(payload_bytes, signature)
    payload = frappe.request.get_json()
    enqueue("<app>.integrations.<service_snake>.process_webhook",
            queue="default", payload=payload)
    return {"status": "received"}
```

## Step 6: Checklist Output
After generating all files, print this checklist:
```
Integration Setup Checklist:
[ ] Settings DocType migrated: bench --site <site> migrate
[ ] Test Connection button works in Settings form
[ ] Webhook URL registered in <Service> dashboard: https://<site>/api/method/<app>.integrations.<service>.webhook
[ ] Fixtures exported: bench --site <site> export-fixtures --app <app>
[ ] Unit tests written with mocked HTTP responses
[ ] api_secret stored via Password field (never plaintext)
```

## Step 7: Guardrails
Stop and ask if:
- No signature verification is possible for the service → document why and add IP allowlist comment
- Service uses OAuth → OAuth flow is out of scope for this command, ask user to handle separately

## Examples
```
/frappe-integrate Razorpay payment collection and reconciliation
/frappe-integrate Shiprocket shipping label generation and tracking updates
/frappe-integrate Shopify bidirectional product and order sync
/frappe-integrate WhatsApp Business API for invoice and order notifications
```
