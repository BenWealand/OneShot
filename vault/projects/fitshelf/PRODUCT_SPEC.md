
---

# `vault/projects/fitshelf/PRODUCT_SPEC.md`

```md
# FitShelf Product Specification

## Product Vision

FitShelf is an AI fashion platform that combines:
- virtual try-on
- personal digital closet
- outfit planning
- saved looks
- future product capture from online stores

## Problem

People shop online but cannot easily see how clothing will look on themselves before buying. Current solutions are fragmented:
- screenshots
- shopping carts
- Pinterest boards
- saved tabs
- imagination

## Solution

FitShelf gives users a simple flow:

1. Upload a person image.
2. Upload a garment image.
3. Choose clothing category.
4. Generate a realistic try-on result.
5. Save the result.
6. Later organize items and outfits in a wardrobe.

## Primary User

A person who shops online and wants to visualize clothing before buying.

## Early MVP Flow

### Phase 1 User Flow

The first user-facing concept is simple:

1. User provides `person.jpg`.
2. User provides `garment.jpg`.
3. System runs AI try-on.
4. System outputs `result.jpg`.

This may initially be command-line only.

### Later App Flow

1. User signs up/logs in.
2. User uploads body/person image.
3. User uploads or captures clothing image.
4. User chooses garment type:
   - upper body
   - lower body
   - dress
5. User submits try-on job.
6. User sees job progress.
7. User views generated result.
8. User saves result to wardrobe.

## Core Screens For App Phase

### Welcome Screen
- App name
- Tagline
- Login/signup
- Demo explanation

### Auth Screens
- Email/password login
- Sign up
- Logout

### Person Images Screen
- Upload person/body image
- View saved person references
- Set default person image

### Wardrobe Screen
- View saved garments
- Add garment
- Filter by category

### Add Garment Screen
- Upload image
- Name
- Category
- Optional source URL
- Optional brand
- Optional notes

### Try-On Screen
- Choose person image
- Choose garment
- Choose category
- Submit job
- Show progress

### Results Screen
- View generated image
- Save result
- Retry with different garment
- Delete result

### Saved Looks Screen
- Grid of generated looks
- Open look details
- Future outfit grouping

## Product Phases

### Phase 1
Local CLI try-on prototype.

### Phase 2
Preprocessing pipeline.

### Phase 3
Backend API.

### Phase 4
Async job queue.

### Phase 5
Mobile app.

### Phase 6
Closet/wardrobe database.

### Phase 7
Product URL/image extraction.

## UX Direction

The app should feel:
- clean
- modern
- fashion-oriented
- image-first
- minimal
- mobile-first

Do not over-polish UI before the AI pipeline works.

## Early Product Acceptance Criteria

The early project is successful if:
- local try-on works
- preprocessing outputs are visible
- backend can accept jobs
- app can submit and show results later
- every phase is tested before moving on