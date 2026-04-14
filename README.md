# Depths of Dungeon

An ASCII roguelike crawler built with React + Vite + TypeScript, deployed on [RUN.game](https://run.game/catalog/game/TnwiXCIVrrnLXVcED65D).

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server with hot reload |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | Build, deploy, submit for review, commit & push (see below) |
| `npm run format` | Format code with Prettier |

## Deployment

Deployment uses the [RUN.game CLI](https://run.game) (`rundot`). The `npm run deploy` script runs the full pipeline:

```
npm run build → rundot deploy → rundot game copy-tag private review → git add/commit/push
```

### Tag Flow

| Tag | Purpose |
|-----|---------|
| **Private** | Where `rundot deploy` pushes builds. Accessible via OneLink only. |
| **Review** | Submitted for platform review. Copied from Private via `copy-tag private review`. |
| **Public** | Live on the RUN.game store. Updated by the platform after review approval. |

### Manual Deploy Steps

If you need to run steps individually:

```bash
# 1. Build
npm run build

# 2. Deploy to Private tag
rundot deploy

# 3. Submit for review
rundot game copy-tag private review

# 4. Check tag versions
rundot game list-tags
```

### Other Useful Commands

```bash
# Update the RUN.game CLI
rundot update

# List all tags and their versions
rundot game list-tags

# Preview a specific tag
# Private:  https://omw.run/u/TnwiXCIVrrnLXVcED65D/private
# Review:   https://omw.run/u/TnwiXCIVrrnLXVcED65D/review
# Public:   https://omw.run/depths-of-dungeon
```

## Debug Mode

Access the debug panel on the class select screen:

- **URL param**: add `?debug` to the URL (e.g. `http://localhost:4173/?debug`)
- **Tap shortcut**: tap the subtitle text 5 times quickly

The debug panel lets you toggle registration, RUN TV unlock, profiler, reset all data, etc.
