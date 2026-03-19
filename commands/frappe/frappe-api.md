# Frappe API Endpoint
Create a secure, production-ready whitelisted API endpoint.

## Step 1: Classify Endpoint Type from $ARGUMENTS
| Type | Indicators | Decorator |
|------|-----------|-----------|
| Authenticated fetch | "get", "list", "search", "fetch" | `@frappe.whitelist()` |
| Authenticated action | "create", "submit", "update", "bulk" | `@frappe.whitelist(methods=["POST"])` |
| Webhook receiver | "webhook", "callback", "inbound" | `@frappe.whitelist(allow_guest=True)` |
| Public read | "public", "no login", "guest" | `@frappe.whitelist(allow_guest=True)` |

## Step 2: Read Existing Structure
1. Read `CLAUDE.md` for app name and conventions
2. Read `apps/<app>/<app>/api/` to find correct file to add the endpoint to
3. If no suitable file exists, determine correct filename from the domain

## Step 3: Generate the Endpoint
Every endpoint must have ALL of these sections in order:

```python
@frappe.whitelist()
def <function_name>(<param1>, <param2>=None):
    """
    <One-line description>.
    Called via: POST /api/method/<app>.api.<file>.<function_name>
    """
    # 1. Permission check — NEVER skip
    frappe.has_permission("<Primary DocType>", throw=True)

    # 2. Input validation
    if not <param1>:
        frappe.throw(_("<param1> is required"))

    # 3. Build filters safely
    filters = {"docstatus": 1}
    if <param2>:
        filters["<field>"] = <param2>

    # 4. Fetch data using ORM (not raw SQL unless necessary)
    result = frappe.get_list(
        "<DocType>",
        filters=filters,
        fields=["name", "<field1>", "<field2>"],
        order_by="creation desc",
        page_length=50,
    )

    # 5. Return structured response
    return {"data": result, "total": len(result)}
```

## Step 4: Generate the Caller (JS or Vue)
**Desk JS caller:**
```javascript
frappe.call({
    method: '<app>.api.<file>.<function_name>',
    args: { <param1>: value },
    freeze: true,
    freeze_message: __('Loading...'),
    callback(r) {
        if (r.message) { /* use r.message.data */ }
    }
});
```
**Frappe UI caller:**
```javascript
import { createResource } from 'frappe-ui'
const resource = createResource({
    url: '<app>.api.<file>.<function_name>',
    params: { <param1>: value },
    auto: true,
})
```

## Step 5: Generate Unit Test
```python
def test_<function_name>_success(self):
    frappe.set_user("Administrator")
    result = frappe.call("<app>.api.<file>.<function_name>", <param1>="test")
    self.assertIn("data", result)

def test_<function_name>_permission_denied(self):
    frappe.set_user("Guest")
    with self.assertRaises(frappe.PermissionError):
        frappe.call("<app>.api.<file>.<function_name>", <param1>="test")
```

## Step 6: Guardrails
Stop and ask if:
- Endpoint is `allow_guest=True` without any signature/token validation → warn and require validation
- Endpoint returns sensitive fields (passwords, tokens, internal IDs) → flag and ask to filter
- No DocType can be inferred for permission check → ask which DocType to check against

## Security Rules (never skip any)
- `frappe.has_permission()` on every non-guest endpoint
- `allow_guest=True` only with explicit signature or token check in body
- Never return Password or Token field values directly
- Always parametrize SQL if ORM is insufficient
- Log unexpected exceptions with `frappe.log_error()`, throw safe message to user

## Examples
```
/frappe-api get all open sales orders for customer portal with pagination
/frappe-api submit bulk payment entries from a list of document names
/frappe-api webhook handler for Razorpay payment confirmation with HMAC verification
/frappe-api get dashboard stats: total sales, pending orders, overdue invoices
```
