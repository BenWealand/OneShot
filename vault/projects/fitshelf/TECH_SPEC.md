# FitShelf Technical Specification

## High-Level Architecture

FitShelf has four major systems:

1. AI inference pipeline
2. Backend API and job system
3. Mobile frontend
4. Supabase data/storage layer

## Target Architecture

```text
Expo App
  ↓
FastAPI Backend
  ↓
Redis Queue
  ↓
GPU Worker
  ↓
CatVTON / Try-On Model
  ↓
Supabase Storage
  ↓
Expo App displays result