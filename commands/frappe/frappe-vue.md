# Frappe Vue Component
Create a Frappe UI (Vue 3) component or page using the frappe-ui library.

## Step 1: Classify Component Type from $ARGUMENTS
| Type | Indicator | Primary frappe-ui Primitive |
|------|-----------|----------------------------|
| List page | "list", "table of", "all X" | `createListResource` + `ListView` |
| Detail/form | "detail", "view one", "single record" | `createDocumentResource` |
| Dashboard | "dashboard", "stats", "KPIs" | `createResource` (custom API) |
| Action form | "form", "create new", "multi-step" | `createResource` + local state |
| Search/filter | "search", "filter", "autocomplete" | `createListResource` + `ref` filters |

## Step 2: Read Existing Frontend Structure
1. Read `apps/<app>/frontend/src/` to understand router, store, and component patterns
2. Check `package.json` for frappe-ui version and available components

## Step 3: Generate the Component

**List Component:**
```vue
<template>
  <div class="p-4 h-full flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold">{{ $t('<DocType>') }}</h1>
      <Button variant="solid" @click="$router.push('/new')">New</Button>
    </div>
    <div v-if="list.loading" class="flex-1 flex items-center justify-center">
      <LoadingIndicator />
    </div>
    <ErrorMessage v-else-if="list.error" :message="list.error" />
    <ListView v-else :columns="columns" :data="list.data" :row-key="'name'"
              @row-click="(row) => $router.push(`/${row.name}`)" />
    <div class="flex justify-end">
      <ListFooter :list="list" />
    </div>
  </div>
</template>

<script setup>
import { createListResource, ListView, ListFooter,
         Button, LoadingIndicator, ErrorMessage } from 'frappe-ui'

const list = createListResource({
  doctype: '<DocType>',
  fields: ['name', '<field1>', '<field2>', 'status', 'creation'],
  filters: { docstatus: ['!=', 2] },
  orderBy: 'creation desc',
  pageLength: 20,
  auto: true,
})

const columns = [
  { label: 'Name',   key: 'name',   width: '1/4' },
  { label: '<Field1>', key: '<field1>' },
  { label: 'Status', key: 'status' },
]
</script>
```

**API-backed resource:**
```javascript
import { createResource } from 'frappe-ui'
const stats = createResource({
    url: '<app>.api.<module>.<function>',
    params: { /* initial params */ },
    auto: true,
    onSuccess(data) { /* handle */ },
    onError(err)    { frappe.throw(err.message) },
})
// Reload: stats.fetch({ newParam: value })
```

## Step 4: Output Build Command
```bash
cd apps/<app>
yarn build   # or npm run build
# or in dev:
yarn dev
```

## Step 5: Guardrails
- Never use `axios` directly — always use `createResource` from frappe-ui
- Always handle `loading`, `error`, and empty states in every component
- Never mutate `list.data` directly — use `list.reload()` after mutations

## Examples
```
/frappe-vue customer portal dashboard with open orders, invoices, payment history
/frappe-vue payment reconciliation tool with side-by-side matching UI
/frappe-vue kanban board for Sales Orders grouped by status
/frappe-vue item search with debounced input, image thumbnails, add-to-cart button
```
