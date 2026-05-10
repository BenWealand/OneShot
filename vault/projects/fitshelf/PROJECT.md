# FitShelf AI Try-On Platform

## Project Goal

Build FitShelf: a mobile-first AI virtual try-on and digital closet platform.

The long-term product lets users:
- upload a full-body image of themselves
- upload or capture clothing images
- generate realistic AI try-on images
- save generated looks
- organize clothing in a wardrobe
- build outfits over time

## Current Build Strategy

This project must be built in phases.

The first goal is not the full mobile app. The first goal is to prove the core AI try-on pipeline.

The correct build order is:

1. Local AI try-on prototype
2. Preprocessing pipeline
3. FastAPI backend
4. Async queue/GPU worker
5. Expo mobile app
6. Wardrobe/closet system
7. Product URL extraction
8. Production hardening

## Core Technical Direction

Recommended stack:

Frontend:
- Expo React Native
- TypeScript
- expo-image-picker
- expo-camera later if needed
- Supabase SDK

Backend:
- Python
- FastAPI
- Pillow
- OpenCV
- rembg
- MediaPipe if useful
- Redis queue later

AI Inference:
- CatVTON preferred
- IDM-VTON fallback/research option
- OOTDiffusion fallback/research option

Storage/Database:
- Supabase Postgres
- Supabase Storage

Development Hardware:
- Local RTX 4070 Laptop GPU with 32GB RAM

Production GPU Options:
- RunPod
- Vast.ai
- Lambda Labs

## MVP Definition

The real MVP is:

person image + garment image -> generated try-on output image

The first useful technical milestone is a repeatable local command:

```bash
python scripts/run_tryon.py --person samples/person.jpg --garment samples/shirt.jpg --category upper --out outputs/result.jpg