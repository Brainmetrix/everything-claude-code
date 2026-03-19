#!/usr/bin/env node
// Cursor afterFileEdit hook — delegates to adapter.js
process.argv[2] = "afterFileEdit";
require("./adapter.js");
