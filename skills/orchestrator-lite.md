# OneShot Lite Orchestrator

Use OneShot as a filesystem memory, planning, checkpointing, and proof framework.

This project intentionally does NOT use full OneShot multi-agent orchestration.

## Execution Mode

Use SINGLE-SESSION MODE ONLY.

Do not spawn:
- subagents
- workers
- Mill
- executor agents
- delegated task agents
- separate reviewer agents

The current Codex session must act as:
- planner
- executor
- tester
- reviewer
- documenter

If this file conflicts with `skills/orchestrator.md`, follow this file for this project.

## What To Keep From OneShot

Use:
- vault project files
- phase plans
- tickets/checklists
- status logs
- proof logs
- blocker logs
- decision logs
- resume files
- checkpoints

Do not use:
- worker spawning
- executor delegation
- cross-agent gates
- multi-agent fanout
- Mill execution

## Locked Specs

Do not rewrite, shorten, replace, or summarize:
- PROJECT.md
- PRODUCT_SPEC.md
- TECH_SPEC.md
- PLAN.md
- TICKETS.md
- GOAL.md

Only append progress updates to:
- STATUS.md
- DECISIONS.md
- BLOCKERS.md
- PROOF.md
- RESUME.md

## Execution Loop

For each phase:

1. Read the phase requirements in PLAN.md.
2. Implement the smallest working version.
3. Run available tests/checks.
4. Fix obvious failures.
5. Append proof to PROOF.md.
6. Append status to STATUS.md.
7. Append resume instructions to RESUME.md.
8. Continue to the next phase.

## Stop Conditions

Only stop when:
- the project reaches the furthest stable verified phase possible
- every possible path is blocked
- Codex itself refuses to continue
- the operator explicitly pauses or kills the run

A missing API key, failed package install, failed test, unavailable model, or missing credential is not automatically a stop condition. Work around it, document it, and continue with the next useful task.