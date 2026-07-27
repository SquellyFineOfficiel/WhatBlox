# WhatBlox

A modern web application built with Vite.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Build

Build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint:

```bash
npm run lint
```

### Formatting

Format code with Prettier:

```bash
npm run format
```

## Project Structure

```
WhatBlox/
├── public/           # Static assets (served as-is)
│   └── index.html    # Entry HTML file
├── src/              # Source code
│   ├── main.js       # Application entry point
│   ├── components/   # React/Vue/Svelte components (if using a framework)
│   ├── styles/       # CSS styles
│   │   └── main.css  # Main stylesheet
│   ├── utils/        # Utility functions
│   └── assets/       # Static assets (images, fonts, etc.)
├── package.json
├── vite.config.js
└── .gitignore
```

## Tech Stack

- **Vite** - Fast build tool and dev server
- **Vanilla JS** - No framework (can be extended with React, Vue, Svelte, etc.)
- **ESLint** - Code linting
- **Prettier** - Code formatting