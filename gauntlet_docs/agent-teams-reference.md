# Claude Code Agent Teams — Quick Reference for AI Agents

**READ THIS BEFORE using Agent Teams.** This is NOT the same as subagents (the Task tool). If you confuse them, you will do the wrong thing.

---

## Agent Teams vs. Subagents — The Critical Difference

| | Subagents (Task tool) | Agent Teams |
|---|---|---|
| **What it is** | Child process that does work and returns a result to the parent | Independent peer sessions that collaborate as equals |
| **Communication** | One-way: child reports back to parent only | Peer-to-peer: teammates message each other directly |
| **Context** | Parent sees the result; child context is discarded | Each teammate has its own full, persistent context window |
| **Coordination** | Parent manages everything | Shared task list — teammates claim and complete tasks autonomously |
| **Lifetime** | Exists only for the duration of one task | Persists for the entire team session |
| **When to use** | Focused lookup/research where only the result matters | Complex parallel work where teammates need to coordinate |

**The rule of thumb:** If teammates need to talk to each other or share discoveries mid-work, use Agent Teams. If you just need a result back, use a subagent.

---

## How to Create an Agent Team

There is NO special slash command. You describe the team in natural language to Claude Code:

```
Create an agent team to build the market_data and benchmark_compare tools in parallel.

Spawn two teammates:
- Teammate 1: Build the market_data tool in tools/market-data.tool.ts.
  It wraps Ghostfolio's data provider service.
- Teammate 2: Build the benchmark_compare tool in tools/benchmark-compare.tool.ts.
  It wraps Ghostfolio's benchmarks endpoint.

I (the lead) will handle conversation history and error handling.
If either teammate discovers a shared pattern (like common error handling),
message the other teammate about it.
```

Claude Code will:
1. Call `TeamCreate` to set up the team
2. Spawn each teammate as an independent Claude Code session
3. Create a shared task list
4. Teammates begin working and can message each other

---

## Critical Rules

### DO
- Assign teammates to **separate files** — each teammate should own distinct files
- Give teammates **clear, specific spawn prompts** with all the context they need (file paths, service names, patterns to follow)
- Use **3-5 teammates** maximum for most workflows
- Aim for **5-6 tasks per teammate** — enough to be useful, not so many they lose focus
- Have the **lead handle integration work** that touches shared files (module registration, shared types, etc.)
- **Shut down teammates before cleanup** — tell the lead to clean up only after all teammates are done

### DO NOT
- **NEVER** assign two teammates to edit the same file — there is NO file-level locking, and edits will overwrite each other
- **NEVER** use Agent Teams for sequential work where step N depends on step N-1 completing — use normal sequential execution instead
- **NEVER** use Agent Teams for simple tasks a single session can handle — it costs 3-5x more tokens
- **NEVER** nest teams — teammates cannot spawn their own teams
- **NEVER** assume teammates share context — each one starts fresh with only the spawn prompt from the lead

### CAUTION
- Teammates sometimes fail to mark tasks complete — if a dependent task seems stuck, check task status
- The lead's conversation history does NOT transfer to teammates
- Permissions are inherited from the lead at spawn time — see [Configuring Permissions](#configuring-permissions-critical) to avoid teammates getting stuck
- Split-pane view requires tmux or iTerm2 (not available in VS Code integrated terminal)

---

## Task States

Tasks in the shared task list have three states:
- **pending** — not yet claimed
- **in_progress** — claimed by a teammate
- **completed** — finished

Tasks can have **dependencies** — a pending task with unresolved dependencies cannot be claimed until those dependencies complete.

---

## Keyboard Shortcuts (In-Process Mode)

| Key | Action |
|---|---|
| `Shift+Down` | Cycle through teammates |
| `Enter` | View selected teammate's session |
| `Escape` | Interrupt a teammate |
| `Ctrl+T` | Toggle the shared task list |

---

## When to Use Agent Teams in This Project

See the sprint checklist (`gauntlet_docs/agentforge-sprint-checklist.md`) for specific recommendations at each phase. Summary:

| Phase | Use Agent Teams? | Why |
|---|---|---|
| Phase 0 (Foundation) | NO | Sequential setup tasks |
| Phase 1 (First Tool) | NO | Must be sequential — validate one tool end-to-end first |
| Phase 2 (3 Tools) | YES | Three independent tool files + independent test files |
| Phase 3 (Eval + Deploy) | NO | Only 5 test cases, tight MVP deadline |
| Phase 4 (50 Evals) | YES | Four independent test categories, each in separate files |
| Phase 5 (Final Submission) | YES | 5+ independent deliverable documents |

---

## Prerequisite

Agent Teams is enabled via the setting in `~/.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```
This is already configured. No additional setup needed.

---

## Configuring Permissions (Critical)

Teammates inherit the lead's permission mode and rules at spawn time. You **cannot** set per-teammate permissions — they all get the same permissions as the lead. If the lead hasn't pre-approved the operations teammates will need, every teammate will get stuck waiting for permission prompts that bubble up to the lead, creating a bottleneck.

**Fix this before spawning teammates** by pre-approving common operations in your settings.

### Where to configure

Permissions can be set at two levels:

- **Project-level** (`.claude/settings.json`) — applies to all agents in this project. Check this into version control so the whole team benefits.
- **User-level** (`~/.claude/settings.json`) — applies to all projects on your machine.

Project settings take precedence over user settings.

### Permission rules

The `permissions` object has three arrays:

| Array | Behavior |
|---|---|
| `allow` | Tool runs without prompting |
| `deny` | Tool is blocked entirely |
| `ask` | Tool requires confirmation each time (this is the default for most tools) |

### Recommended configuration for agent teams

Add this to your settings file alongside the agent teams env variable:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "allow": [
      "Read(**)",
      "Grep",
      "Glob",
      "Edit(src/**)",
      "Edit(tests/**)",
      "Edit(libs/**)",
      "Write(src/**)",
      "Write(tests/**)",
      "Write(libs/**)",
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npm install)",
      "Bash(npx *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(ls *)"
    ],
    "deny": [
      "Bash(git push *)",
      "Bash(git push)",
      "Bash(rm -rf *)",
      "Edit(.env*)",
      "Read(.env)"
    ]
  }
}
```

**Adjust the `Edit` and `Write` paths** to match your project structure. The patterns above are examples — use glob patterns that cover the directories your teammates will work in.

### What happens without this

If you skip permission configuration:
1. The lead spawns teammates
2. Each teammate tries to read a file, edit code, or run a command
3. The tool requires permission → the request bubbles up to the lead
4. The lead gets flooded with permission prompts from multiple teammates simultaneously
5. Teammates sit idle waiting for approval, defeating the purpose of parallelism

This is the most common reason agent teams feel broken on first use. Pre-approving permissions eliminates it entirely.

### What NOT to do

- **Don't use `bypassPermissions` mode** unless you're in a fully isolated container with no access to production systems. It skips all safety checks.
- **Don't over-restrict** — if teammates can't edit files or run tests, they can't do their jobs. Err on the side of allowing operations within your project directories.
- **Don't forget `deny` rules** — pre-approve the common stuff, but explicitly block dangerous operations (force push, deleting files outside the project, reading secrets).

---

## Troubleshooting

- **Teammate seems stuck:** Check if it's waiting on a dependent task. Use `Ctrl+T` to view task list.
- **Task not completing:** Message the teammate directly to check status.
- **File conflicts:** If two teammates accidentally edit the same file, one will overwrite the other. The fix is to have the lead own shared files and teammates own only their assigned files.
- **Teammates stuck on permissions:** Operations not pre-approved in settings. Add the needed tools/commands to `permissions.allow` — see [Configuring Permissions](#configuring-permissions-critical).
- **High token usage:** Each teammate is a full Claude session. A 3-person team uses ~3x tokens. Budget accordingly.
