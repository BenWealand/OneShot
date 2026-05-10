# FitShelf Goal

Use:
- `skills/orchestrator-lite.md`
- OneShot vault structure
- project files
- phase tracking
- proof logs
- blocker logs
- resume logs

Do NOT use full OneShot multi-agent orchestration.

## Execution Mode

Use SINGLE-SESSION MODE ONLY.

Do not spawn:
- subagents
- workers
- Mill
- executor agents
- delegated task agents
- separate reviewer agents

The current Codex session must execute all work inline.

## Source Files

Read:
- PROJECT.md
- PRODUCT_SPEC.md
- TECH_SPEC.md
- PLAN.md
- TICKETS.md

Do not rewrite these files.

## Main Objective

Execute the FitShelf AI Try-On project phase by phase.

The first critical milestone is:

```bash
python ai/scripts/run_tryon.py --person ai/samples/person.jpg --garment ai/samples/garment.jpg --category upper --out ai/outputs/result.jpg