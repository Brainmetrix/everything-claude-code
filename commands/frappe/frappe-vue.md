# /frappe-vue — Create a Frappe UI (Vue 3) Component or Page

## Purpose
Scaffold production-ready Frappe UI (Vue 3) components using the
frappe-ui component library, createResource, createListResource patterns.

## Input
$ARGUMENTS = component or page description

## Component Types

### List View Page
```vue
<template>
  <div class="p-4">
    <ListView
      :columns="columns"
      :data="list.data"
      :row-key="'name'"
      @row-click="openDocument"
    >
      <template #filters>
        <Filter v-model="searchQuery" placeholder="Search..." />
      </template>
    </ListView>
    <ListFooter :list="list" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createListResource, ListView, ListFooter, Filter } from 'frappe-ui'

const searchQuery = ref('')
const list = createListResource({
  doctype: 'Sales Order',
  fields: ['name', 'customer', 'grand_total', 'status', 'transaction_date'],
  filters: { docstatus: ['!=', 2] },
  orderBy: 'transaction_date desc',
  pageLength: 20,
  auto: true,
})
</script>
```

### Form / Detail Page
```vue
<script setup>
import { createDocumentResource } from 'frappe-ui'

const props = defineProps({ name: String })

const doc = createDocumentResource({
  doctype: 'Sales Order',
  name: props.name,
  auto: true,
  onSuccess(data) { console.log('Loaded', data) },
})

function submitOrder() {
  doc.runDocMethod.submit({
    onSuccess() { /* handle success */ }
  })
}
</script>
```

### API Call Component
```javascript
import { createResource } from 'frappe-ui'

const result = createResource({
  url: 'myapp.api.customer_portal.get_stats',
  params: { customer: 'CUST-001' },
  auto: true,
  onSuccess(data) { /* use data */ },
  onError(err) { /* handle error */ },
})

// Reload with new params
result.fetch({ customer: 'CUST-002' })
```

## Always Include
- Loading state handling (`list.loading`, `doc.loading`)
- Error state handling
- Empty state UI
- Responsive layout with Tailwind/frappe-ui classes
- TypeScript types if the project uses TS

## Output
1. Vue component file
2. Route registration if it's a new page
3. `bench build --app <app>` reminder

## Examples
```
/frappe-vue customer portal dashboard with open orders, invoices, payment history
/frappe-vue item search component with debounced input and image thumbnails
/frappe-vue payment reconciliation tool with side-by-side matching UI
/frappe-vue sales team leaderboard with real-time updates
/frappe-vue multi-step form for new customer onboarding
/frappe-vue kanban board for Sales Orders by status
```
