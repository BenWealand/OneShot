# FitShelf Tickets

This file is a phase checklist. Do not convert into full OneShot multi-agent ticket spawning unless explicitly asked.

## Phase 1 - Local AI Try-On Prototype

- [ ] Create AI folder structure.
- [ ] Create Python requirements/setup files.
- [ ] Implement `run_tryon.py`.
- [ ] Implement stable `run_tryon()` interface.
- [ ] Attempt CatVTON integration or document blocker.
- [ ] Implement fallback/stub if needed.
- [ ] Generate output image.
- [ ] Log proof.

## Phase 2 - Preprocessing Pipeline

- [ ] Add image utility functions.
- [ ] Add garment preprocessing.
- [ ] Add optional background removal.
- [ ] Add optional pose validation.
- [ ] Add mask generation placeholder or implementation.
- [ ] Save debug outputs.
- [ ] Log proof.

## Phase 3 - FastAPI Backend

- [ ] Create backend folder.
- [ ] Add FastAPI app.
- [ ] Add `/health`.
- [ ] Add `/tryon`.
- [ ] Wire API to local pipeline.
- [ ] Test with curl or Python client.
- [ ] Log proof.

## Phase 4 - Async Queue and GPU Worker

- [ ] Choose RQ or Celery.
- [ ] Add Redis setup docs.
- [ ] Add job model.
- [ ] Add enqueue endpoint.
- [ ] Add worker script.
- [ ] Add job status endpoint.
- [ ] Test queue lifecycle.
- [ ] Log proof.

## Phase 5 - Supabase Schema and Storage

- [ ] Create schema SQL.
- [ ] Add profiles table.
- [ ] Add person_images table.
- [ ] Add wardrobe_items table.
- [ ] Add tryon_jobs table.
- [ ] Add saved_looks table.
- [ ] Add storage bucket docs.
- [ ] Add RLS policy draft.
- [ ] Log proof.

## Phase 6 - Expo Mobile App

- [ ] Create Expo TypeScript app.
- [ ] Add upload person screen.
- [ ] Add upload garment screen.
- [ ] Add try-on submit screen.
- [ ] Add job status/result screen.
- [ ] Connect to backend or mock backend.
- [ ] Run typecheck/start.
- [ ] Log proof.

## Phase 7 - Wardrobe / Digital Closet

- [ ] Add wardrobe data model.
- [ ] Add saved looks data model.
- [ ] Add wardrobe screen.
- [ ] Add saved looks screen.
- [ ] Add Supabase or local fallback persistence.
- [ ] Log proof.

## Phase 8 - Product Image Extraction

- [ ] Add URL extraction script.
- [ ] Extract Open Graph image.
- [ ] Extract JSON-LD product data if available.
- [ ] Add fallback logic.
- [ ] Test against sample URLs.
- [ ] Log proof.

## Phase 9 - Final Verification and Handoff

- [ ] Update README files.
- [ ] Update STATUS.md.
- [ ] Update PROOF.md.
- [ ] Update BLOCKERS.md.
- [ ] Update RESUME.md.
- [ ] Write final handoff.