# Repository Guidelines

## Project Structure & Module Organization

This repository is a static portfolio site. The main entry point is `cia-portfolio.html`, which contains the page markup, inline styles, and inline JavaScript. Image assets live in `gallary/`; keep new media there and reference it with relative paths such as `gallary/example.JPEG`.

There is currently no package manager, framework, or generated build output. Avoid adding dependency directories or generated artifacts unless the project is intentionally migrated to a build system.

## Build, Test, and Development Commands

- `python3 -m http.server 8000` serves the repository locally at `http://localhost:8000/`.
- `open cia-portfolio.html` or opening the file in a browser is sufficient for quick visual checks.
- `rg "pattern" cia-portfolio.html` searches the site source quickly.

No build command is required because the site is plain HTML/CSS/JavaScript.

## Coding Style & Naming Conventions

Use two-space indentation inside HTML, CSS, and JavaScript blocks to match the existing file. Keep CSS custom properties in `:root` for shared colors, gradients, and theme values. Prefer semantic section IDs and class names, for example `#hero`, `.nav-links`, and `.hero-badge`.

Keep changes localized: update the relevant section in `cia-portfolio.html` rather than duplicating styles or scripts. Use relative asset paths and descriptive image names when adding new files.

## Testing Guidelines

There is no automated test suite. Validate changes manually in a browser before submitting:

- Check desktop and mobile widths, especially the fixed navigation and hamburger menu.
- Confirm image paths load correctly from `gallary/`.
- Test interactive elements such as links, cursor effects, animations, and any JavaScript-driven UI.
- Inspect the browser console for runtime errors.

## Commit & Pull Request Guidelines

Git history is not available in this checkout, so use simple imperative commit messages, such as `Update hero copy` or `Add gallery images`.

Pull requests should include a concise description, a summary of visual or content changes, screenshots for UI changes, and any manual testing performed. Link related issues when applicable.

## Security & Configuration Tips

Do not commit secrets, private team credentials, or external service tokens. Keep third-party resources, such as font or script links, intentional and documented in the pull request.
