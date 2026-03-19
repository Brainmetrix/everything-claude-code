#!/usr/bin/env node
// Cursor beforeShellExecution hook — delegates to adapter.js
require("./adapter.js");
// adapter.js reads process.argv[2] for event type; pass it as env
process.argv[2] = "beforeShellExecution";
