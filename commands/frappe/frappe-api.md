# /frappe-api — Create a Whitelisted API Endpoint

## Purpose
Scaffold a secure, production-ready whitelisted API endpoint with proper
permission checks, input validation, error handling, and test coverage.

## Input
$ARGUMENTS = description of what the API should do

## Steps

1. Read CLAUDE.md and existing `api/` folder structure
2. Determine endpoint type:
   - **Data fetch** → GET-style, returns list or single record
   - **Action** → POST-style, modifies data or triggers process
   - **Webhook handler** → allow_guest=True, signature verification required
   - **Public** → allow_guest=True, rate-limiting comment required

3. Generate the endpoint with ALL of these:

```python
@frappe.whitelist()                    # or allow_guest=True if public
def function_name(param1, param2=None):
    """
    Docstring: what this does, what it returns.
    Called via: POST /api/method/<app>.<module>.api.<file>.<function>
    """
    # 1. Permission check (NEVER skip this)
    frappe.has_permission("<DocType>", throw=True)
    
    # 2. Input validation
    if not param1:
        frappe.throw(_("param1 is required"))
    
    # 3. Business logic
    
    # 4. Return structured response
    return {"status": "success", "data": result}
```

4. Generate the corresponding JS/Vue caller:
```javascript
frappe.call({
    method: 'myapp.api.<file>.<function>',
    args: { param1: value },
    callback(r) { if (r.message) { ... } }
})
```

5. Generate unit test with mocked permissions

## Security Rules Always Applied
- frappe.has_permission() on every non-guest endpoint
- allow_guest=True only with explicit signature or token check
- Never return raw DB rows with sensitive fields (passwords, tokens)
- Always validate and sanitize input params
- Use frappe.log_error() for unexpected exceptions, not bare raise

## Examples
```
/frappe-api get all open sales orders for customer portal with pagination
/frappe-api submit bulk payment entries from a list of names
/frappe-api webhook handler for Razorpay payment confirmation
/frappe-api get dashboard stats: total sales, pending orders, overdue invoices
/frappe-api search items by name or code for a custom POS screen
```
