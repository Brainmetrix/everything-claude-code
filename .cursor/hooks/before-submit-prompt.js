#!/usr/bin/env node
// Cursor beforeSubmitPrompt hook — delegates to adapter.js
process.argv[2] = "beforeSubmitPrompt";
require("./adapter.js");
