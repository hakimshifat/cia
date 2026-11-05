# Repository Guidelines

## Project Structure & Module Organization

This repository contains the Astro website for Cyber Invasion Army. Routes live in `src/pages/`, reusable UI in `src/components/`, shared page structure in `src/layouts/`, and competition helpers in `src/lib/`. Markdown content is grouped in `src/crew/`, `src/achievements/`, `src/blogs/`, `src/writeups/`, and `src/resource-projects/`. Static files live in `public/`, including member photos under `public/assets/images/members/`. Production output is generated in `dist/`.

## Build, Test, and Development Commands

Use Node.js 22 to match the GitHub Pages workflow.

- `npm ci`: install dependencies from `package-lock.json`; repository npm settings enable legacy peer dependency resolution.
- `npm run dev`: start the local Astro development server.
- `npm run build`: generate the production site and PWA assets.
- `npm run preview`: serve the production build for local review.

The workflow in `.github/workflows/deploy.yml` builds and deploys pushes to `main` to GitHub Pages.

## Coding Style & Naming Conventions

Follow surrounding code: two-space indentation, single-quoted JavaScript strings, and semicolons. Use PascalCase for Astro components, lowercase route names, and descriptive content filenames. Existing crew filenames use underscores, such as `tashfin_ruaid.md`; resource articles generally use hyphenated slugs. No formatter or linter is configured.

## Content Guidelines

Copy the frontmatter structure of a nearby entry. Crew profiles specify `name`, `handle`, `type`, `order`, `image`, `expertise`, and `socials`. Keep primary expertise first and use root-relative image paths. Article filenames determine resource URLs; entries with `draft: true` are excluded from published writeup routes.

## Testing Guidelines

There is no automated test framework or coverage threshold. Run `npm run build` after changes, then inspect affected routes with `npm run preview`. Check responsive layouts, image loading, navigation, and social links. For content changes, verify frontmatter renders correctly and entries appear in the intended order.

## Commit & Pull Request Guidelines

History mixes short descriptive messages with `feat:` and `fix:` prefixes. Write concise, action-oriented subjects describing the change. Pull requests should explain the result, link relevant issues, and record validation performed. Include screenshots for visible UI changes. Keep generated output and dependencies out of commits.
