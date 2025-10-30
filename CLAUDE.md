# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Church Presenter App - A volunteer-friendly church presentation software alternative to ProPresenter. The core concept is a **staging system** where operators preview slides privately before sending them live to the projector.

**Key Innovation**: Clear separation between staged (preview) and live (congregation-visible) content.

## Tech Stack

- **Frontend**: Vue 3 with Composition API (functional/composable style preferred)
- **Desktop Framework**: Tauri (preferred for lighter weight) or Electron
- **Styling**: Tailwind CSS
- **State Management**: Vue's reactive refs/computed only - no Vuex/Pinia

## CODE QUALITY PRINCIPLES (NON-NEGOTIABLE)

### It Must JUST WORK
- **Reliability is paramount**: This app runs during live church services. Crashes are unacceptable.
- **Simple over clever**: Choose boring, proven solutions over fancy patterns.
- **Test the critical path**: Staging → Go Live → Clear must never fail.

### Amazing UX & Super Slick Design
- **Polish matters**: Smooth transitions, instant feedback, beautiful typography.
- **Zero learning curve**: A volunteer should understand the interface in 30 seconds.
- **Delightful interactions**: Hover states, focus indicators, smooth animations (but not gratuitous).

#### Nielsen's 10 Usability Heuristics (CRITICAL TO OUR UX)
1. **Visibility of system status**: Always show what's staged vs live. Green/yellow indicators everywhere.
2. **Match between system and real world**: "Go Live" not "Publish". "Stage" not "Buffer".
3. **User control and freedom**: Undo is difficult here, so use Clear (Esc) to quickly recover from mistakes.
4. **Consistency and standards**: Space = Go Live everywhere. Esc = Clear everywhere.
5. **Error prevention**: Disable Prev at start, Next at end. Confirm destructive actions.
6. **Recognition rather than recall**: Show thumbnails, not just text lists. Visual > Memory.
7. **Flexibility and efficiency**: Keyboard shortcuts for power users, big buttons for beginners.
8. **Aesthetic and minimalist design**: Dark theme, generous whitespace, no clutter.
9. **Help users recognize, diagnose, and recover from errors**: Clear error messages. "Video not found: Check your connection".
10. **Help and documentation**: The UI should be so obvious that help isn't needed. But tooltip on first launch.

### Single Responsibility Principle - NO GOD COMPONENTS
- **Each function does ONE thing**: If a function needs "and" in its description, split it.
- **Each component has ONE job**:
  - ✅ `SlideThumb.vue` - displays a thumbnail with indicators
  - ❌ `SlideThumbWithControlsAndPreviewAndNavigation.vue`
- **Composables are focused**:
  - ✅ `usePresentation()` - manages slides and indices
  - ✅ `useKeyboard()` - handles keyboard shortcuts
  - ❌ `useEverything()` - DO NOT DO THIS

### BEST PRACTICES ONLY
- **Functional, pure, predictable**: Functions should be pure when possible.
- **No side effects hiding in computed properties**: Computed values should only compute.
- **Explicit over implicit**: `goLive()` is better than `setLive(true)`.
- **TypeScript-friendly**: Even without TS, write code that could be typed easily.

### ZERO TOLERANCE FOR CRUFT
- **NO dead code**: Delete unused functions immediately. Don't comment them out "just in case".
- **NO unused imports**: Remove them. The linter should catch these.
- **NO "TODO" comments**: Either do it now, create a GitHub issue, or delete it.
- **NO experimental code**: If you're trying something, finish it or delete it before committing.

### KEEP IT CLEAN ALWAYS
- **Delete more than you add**: Question every line. Can this be simpler?
- **Refactor as you go**: See duplication? Extract it immediately.
- **Name things clearly**: `stagedIndex` is better than `idx1` or `currentSlide`.
- **Component size limit**: If a component exceeds 250-500 lines, it's doing too much. Split it.
- **Function size limit**: If a function exceeds 40-80 lines, it probably violates SRP. Split it.

### Code Review Checklist
Before committing, ask:
1. Does this component/function have a single, clear responsibility?
2. Could a new developer understand this without asking questions?
3. Is there any dead code or commented-out code? (Delete it)
4. Are all variable names clear and descriptive?
5. Is this the simplest way to solve this problem?

## Development Commands

```bash
# Install dependencies
npm install

# Development mode (hot reload)
npm run dev

# Build for production
npm run build

# Run tests (when implemented)
npm run test

# Lint code
npm run lint
```

## Architecture

### Dual Window System

The app runs two separate windows:

1. **Control Window** (1400x900): Three-panel operator interface
2. **Projector Window** (fullscreen): Audience-facing output on second display

Use IPC (Inter-Process Communication) to sync state:
- Control → Projector: Send slide data when going live
- Control → Projector: Clear/blackout commands

### Three-Panel Layout

```
┌──────────────┬────────────────────┬─────────────────┐
│ Thumbnails   │ STAGED PREVIEW     │ LIVE OUTPUT     │
│ (Left)       │ (Middle)           │ (Right)         │
│              │                    │                 │
│ [Slides]     │ [Large Preview]    │ [Audience View] │
│ 🏠 Welcome   │ Yellow border      │ Green indicator │
│ 📖 John 3    │ Navigate: ← →      │                 │
│ 📢 Announce  │ Go Live: Space     │                 │
└──────────────┴────────────────────┴─────────────────┘
```

### Core State Model

The presentation state is managed through composables:

```javascript
// Key state values
slides = ref([...])          // Array of all slides
stagedIndex = ref(0)         // Currently previewed slide
liveIndex = ref(null)        // Currently visible to audience

// Computed values
stagedSlide                  // slides[stagedIndex]
liveSlide                    // slides[liveIndex] or null
```

**Critical Distinction**:
- `stagedIndex` = what operator is previewing (yellow border)
- `liveIndex` = what congregation sees (green indicator)
- They are independent - staging doesn't affect live output

## File Structure

```
src/
├── components/
│   ├── SlideThumb.vue      # Thumbnail with live/staged indicators
│   ├── SlidePreview.vue    # Renders different slide types
│   └── Toolbar.vue         # Prev/Next/GO LIVE/Clear buttons
├── composables/
│   ├── usePresentation.js  # Main presentation logic
│   └── useKeyboard.js      # Global keyboard shortcuts
├── views/
│   ├── ControlView.vue     # Three-panel interface
│   └── ProjectorView.vue   # Fullscreen output (minimal)
├── App.vue
└── main.js
```

## Slide Types

All slides are stored as objects with a `type` field:

### 1. Canva Slides (HTML)
```javascript
{ type: 'canva', html: '...', title: 'Welcome' }
```
Extract HTML from Canva embed links. For MVP, may use image upload instead.

### 2. Bible Verses
```javascript
{
  type: 'bible',
  reference: 'John 3:16-17',
  text: '...',
  translation: 'NIV',
  linesPerSlide: 3,
  font: 'Inter',
  background: '#1a1a1a'
}
```
Long passages automatically split into multiple slides based on `linesPerSlide`.

### 3. YouTube Videos
```javascript
{ type: 'youtube', videoId: 'dQw4w9WgXcQ', title: 'Worship Song' }
```
Use YouTube iframe API. Must handle ad-free embedding.

### 4. Images
```javascript
{ type: 'image', imageUrl: 'file:///path/to/image.png' }
```

## Keyboard Shortcuts

**Must be registered globally** (work even when window not focused):

- `Space` → Go live with staged slide
- `←` / `→` → Navigate slides (changes staged slide)
- `Esc` → Clear projection (black out projector)

## Visual Indicators

- **Yellow border** (`yellow-400`) → Staged slide
- **Green border/dot** (`green-500`) → Live slide
- **Dark theme** (`gray-900` background, `gray-800` panels)

## Composable Pattern

Use Vue 3 Composition API exclusively:

```javascript
// composables/usePresentation.js
import { ref, computed } from 'vue'

export function usePresentation() {
  const slides = ref([])
  const stagedIndex = ref(0)
  const liveIndex = ref(null)

  const stagedSlide = computed(() => slides.value[stagedIndex.value])
  const liveSlide = computed(() =>
    liveIndex.value !== null ? slides.value[liveIndex.value] : null
  )

  function goLive() {
    liveIndex.value = stagedIndex.value
  }

  function nextSlide() {
    if (stagedIndex.value < slides.value.length - 1) {
      stagedIndex.value++
    }
  }

  function prevSlide() {
    if (stagedIndex.value > 0) {
      stagedIndex.value--
    }
  }

  function clearProjection() {
    liveIndex.value = null
  }

  return {
    slides,
    stagedSlide,
    liveSlide,
    stagedIndex,
    liveIndex,
    goLive,
    nextSlide,
    prevSlide,
    clearProjection
  }
}
```

## Critical Design Principles

1. **Staging First**: NEVER send content live immediately. Always stage → preview → go live.
2. **Volunteer-Friendly**: Large buttons, clear visual feedback, minimal training needed.
3. **Reliability Over Features**: Simple, predictable behavior. No surprises on Sunday morning.
4. **Projector Isolation**: Projector window shows ONLY live content. No UI, no controls, no chrome.
5. **Auto-Loop Feature**: Ability to auto-advance slides every X seconds (configurable per section).

## Window Management

### Control Window
- Size: 1400x900
- Resizable
- Contains all controls and previews

### Projector Window
- Always fullscreen
- Auto-detect second display (with easy manual override in settings)
- Shows only `liveSlide` content
- Black screen when `liveIndex === null`
- No decorations, menus, or controls

## Data Persistence

Presentations saved as JSON files:
```javascript
{
  "title": "Sunday Service - Oct 23",
  "slides": [
    { type: 'image', imageUrl: '...', title: 'Welcome' },
    { type: 'bible', reference: 'John 3:16-17', ... },
    { type: 'youtube', videoId: '...', title: 'Worship' }
  ]
}
```

Load default presentation on first launch with sample slides.

## Development Notes

- **No complex state management**: Just refs and computed properties
- **Functional style**: Prefer composables over class-based components
- **Tailwind utility classes**: Avoid custom CSS when possible
- **Large click targets**: Minimum 44px for buttons (volunteers may use touch screens)
- **Error handling**: Gracefully handle missing videos, failed API calls, etc.

## Bible API Integration

When implementing Bible verse fetching:
- Support multiple translations (NIV, ESV, KJV, etc.)
- Cache verses to work offline
- Auto-split long passages based on `linesPerSlide` setting
- Allow font and background customization per verse section

## Auto-Loop Implementation

For slide sections that should auto-advance:
```javascript
{
  type: 'section',
  autoLoop: true,
  loopInterval: 5000, // milliseconds
  slides: [...]
}
```

Only loop when section is live. Stop on manual navigation.
