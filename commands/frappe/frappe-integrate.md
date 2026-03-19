# /frappe-integrate — Scaffold a Third-Party Integration

## Purpose
Create a complete, production-ready third-party integration following
Frappe integration patterns: Settings DocType, adapter class, webhook
handler, background sync, and test coverage.

## Input
$ARGUMENTS = name of service and what it needs to do

## Always Generate These Components

### 1. Settings DocType (`<Service>Settings`)
```python
# A Single DocType to store credentials securely
Fields required:
- api_key (Data, reqd)
- api_secret (Password, reqd)  ← Password type = encrypted at rest
- base_url (Data, default=https://api.service.com/v1)
- is_enabled (Check)
- test_mode (Check)
- last_sync (Datetime, read_only)
# Always add a "Test Connection" button in the .js file
```

### 2. Integration Adapter Class
```python
# integrations/<service_snake>.py
class <Service>Integration:
    def __init__(self):
        self.settings = frappe.get_cached_doc("<Service> Settings")
        if not self.settings.is_enabled:
            frappe.throw(_("<Service> integration is not enabled"))
        self.api_key = self.settings.api_key
        self.secret = self.settings.get_password("api_secret")
        self.base_url = self.settings.base_url
        self.session = self._build_session()

    def _build_session(self):
        """Reusable requests session with auth headers."""

    def _request(self, method, endpoint, **kwargs):
        """Central request method with logging, retry, error handling."""
        # Log outgoing request
        # Handle rate limits with exponential backoff
        # Raise meaningful frappe errors on failure
```

### 3. Webhook Handler
```python
@frappe.whitelist(allow_guest=True)
def webhook():
    payload = frappe.request.get_json()
    _verify_signature(frappe.request.headers, payload)
    enqueue("myapp.integrations.<service>.process_webhook",
            queue="default", payload=payload)
    return {"status": "received"}
```

### 4. Background Sync Task
- Enqueued, not blocking
- Idempotent (safe to re-run)
- Logs all activity
- frappe.db.commit() after each batch

### 5. Integration Checklist in Output
- [ ] Settings DocType with encrypted credentials
- [ ] Test Connection button in Settings form
- [ ] All outgoing requests logged
- [ ] Rate limits handled with exponential backoff
- [ ] Unit tests with mocked HTTP calls (responses library)
- [ ] Webhook handler with signature verification
- [ ] Background sync with deduplication job_id

## Examples
```
/frappe-integrate Razorpay for payment collection and reconciliation
/frappe-integrate Shiprocket for shipping label generation and tracking
/frappe-integrate Shopify for product and order sync bidirectional
/frappe-integrate Tally for GL entry export in XML format
/frappe-integrate WhatsApp Business API for invoice and order notifications
/frappe-integrate Google Sheets for live report export
/frappe-integrate Zoho CRM for lead and contact sync
```
