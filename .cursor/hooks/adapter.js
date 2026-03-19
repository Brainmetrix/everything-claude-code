#!/usr/bin/env node
/**
 * Cursor hook adapter for Frappe ECC.
 *
 * Transforms Cursor's stdin JSON format into the format expected by
 * scripts/hooks/*.js, then delegates to the appropriate hook script.
 * This keeps Cursor hooks DRY — no logic duplication between tools.
 *
 * Architecture (matches ECC source DRY adapter pattern):
 *   Cursor stdin JSON → adapter.js → transforms → scripts/hooks/*.js
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

// Read Cursor's hook payload from stdin
let rawInput = "";
process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { rawInput += chunk; });
process.stdin.on("end", () => {
  let cursorPayload = {};
  try {
    cursorPayload = JSON.parse(rawInput);
  } catch {
    process.exit(0);
  }

  const event = process.argv[2] || "unknown";
  const repoRoot = process.cwd();
  const scriptsDir = path.join(repoRoot, "scripts", "hooks");

  // Map Cursor events to ECC script hooks
  const eventToScript = {
    beforeShellExecution: "before-shell.js",
    afterFileEdit:        "after-file-edit.js",
    stop:                 "session-stop.js",
    sessionStart:         "session-start.js",
    beforeSubmitPrompt:   "before-submit-prompt.js",
  };

  const scriptName = eventToScript[event];

  // Transform Cursor payload to ECC format
  const eccPayload = transformPayload(event, cursorPayload);

  if (scriptName) {
    const scriptPath = path.join(scriptsDir, scriptName);
    if (fs.existsSync(scriptPath)) {
      // Delegate to shared ECC script
      try {
        const result = execFileSync("node", [scriptPath], {
          input: JSON.stringify(eccPayload),
          encoding: "utf8",
          env: { ...process.env, CURSOR_HOOK_EVENT: event },
        });
        process.stdout.write(result);
      } catch (err) {
        // Script returned non-zero — pass through stderr
        process.stderr.write(err.stderr || "");
        process.exit(err.status || 1);
      }
      return;
    }
  }

  // No matching script — run Frappe-specific inline checks
  runFrappeInlineChecks(event, cursorPayload);
});

/**
 * Transform Cursor's payload format to ECC's expected format.
 */
function transformPayload(event, cursor) {
  switch (event) {
    case "beforeShellExecution":
      return { command: cursor.command || "" };

    case "afterFileEdit":
      return {
        file_path: cursor.filePath || cursor.file_path || "",
        edits: cursor.edits || [],
      };

    case "stop":
    case "sessionEnd":
      return {
        session_id: cursor.sessionId || cursor.session_id || `cursor_${Date.now()}`,
        transcript: cursor.transcript || [],
      };

    case "sessionStart":
      return {
        session_id: cursor.sessionId || `cursor_${Date.now()}`,
        cwd: cursor.cwd || process.cwd(),
      };

    case "beforeSubmitPrompt":
      return {
        prompt: cursor.prompt || cursor.message || "",
      };

    default:
      return cursor;
  }
}

/**
 * Frappe-specific inline checks run when no shared script exists.
 */
function runFrappeInlineChecks(event, payload) {
  if (event === "beforeShellExecution") {
    const cmd = payload.command || "";

    // Block direct edits to frappe/erpnext source
    if (/\b(vi|vim|nano|sed|echo)\b.*\/(frappe|erpnext)\/(?!\.git)/.test(cmd)) {
      console.log(JSON.stringify({
        permission: "deny",
        agentMessage: "[Frappe] Blocked: editing frappe/erpnext source directly. Use hooks.py doc_events and Custom Fields instead.",
      }));
      return;
    }

    // Block force push
    if (/git\s+push\s+.*--force(?!-with-lease)/.test(cmd)) {
      console.log(JSON.stringify({
        permission: "deny",
        agentMessage: "[Frappe] Blocked: git push --force. Use --force-with-lease instead.",
      }));
      return;
    }
  }

  if (event === "beforeSubmitPrompt") {
    const prompt = payload.prompt || "";
    // Detect secrets in prompts
    const secretPatterns = [
      { re: /ghp_[a-zA-Z0-9]{36}/, label: "GitHub token" },
      { re: /sk-[a-zA-Z0-9]{32,}/, label: "API key" },
      { re: /rzp_(live|test)_[a-zA-Z0-9]{14}/, label: "Razorpay key" },
      { re: /AKIA[0-9A-Z]{16}/, label: "AWS access key" },
    ];
    const found = secretPatterns.filter(p => p.re.test(prompt));
    if (found.length > 0) {
      const labels = found.map(f => f.label).join(", ");
      console.log(JSON.stringify({
        permission: "deny",
        agentMessage: `[Frappe] Blocked: prompt contains potential secrets (${labels}). Remove before sending.`,
      }));
      return;
    }
  }

  // Default: allow
  console.log(JSON.stringify({ permission: "allow" }));
}
