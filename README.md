# Church Presenter

A volunteer-friendly church presentation software alternative to ProPresenter. Built with Vue 3, Tauri, and Tailwind CSS.

## Features

- **Staging System**: Preview slides privately before sending them live
- **Three-Panel Layout**: Thumbnails, Staged Preview, and Live Output
- **Dual Window System**: Control window for operators, fullscreen projector output
- **Keyboard Shortcuts**: Space (Go Live), ←/→ (Navigate), Esc (Clear)
- **Multiple Slide Types**: Images, Bible verses, YouTube videos, Canva HTML

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Rust (for Tauri)

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

## Usage

1. Launch the app - the Control Window will open
2. Click "Open Projector Window" to launch the fullscreen projector output
3. Use the thumbnail panel to select slides
4. Preview slides in the middle panel (yellow border = staged)
5. Press Space or click "GO LIVE" to send to projector
6. The right panel shows what's currently on the projector (green border = live)

### Keyboard Shortcuts

- **Space** - Send staged slide to projector
- **←/→** - Navigate between slides
- **Esc** - Clear projection (black screen)

## Project Structure

```
src/
├── components/
│   ├── SlideThumb.vue      # Thumbnail with indicators
│   ├── SlidePreview.vue    # Renders different slide types
│   └── Toolbar.vue         # Control buttons
├── composables/
│   ├── usePresentation.js  # Core presentation logic
│   ├── useKeyboard.js      # Keyboard shortcuts
│   └── useProjector.js     # Dual window management
├── views/
│   ├── ControlView.vue     # Three-panel operator interface
│   └── ProjectorView.vue   # Fullscreen output
├── App.vue
└── main.js
```

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and architecture decisions.

## License

MIT
