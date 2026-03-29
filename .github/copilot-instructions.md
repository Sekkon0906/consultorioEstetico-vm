## Repository snapshot for AI assistants

This project is a Next.js (App Router) frontend with a lightweight `server/` folder that contains an Express + Firebase/MySQL setup placeholder. The guidance below focuses on the concrete, discoverable patterns in the codebase so an AI assistant can be immediately productive.

Key points
- Frontend: Next 15 with the App Router under `app/`. Top-level layout is `app/layout.tsx` and global styles are in `app/globals.css`.
- Client auth: `app/utils/auth.ts` implements a simple localStorage-based auth helper (keys: `ce_users`, `ce_current_user`). Use this file as the canonical example of how components read/write session data.
- UI: Bootstrap + FontAwesome are imported in `app/layout.tsx`. The `NavbarClient` component is referenced as `@/components/NavbarClient`—the repo uses Next/TS path aliases.
- Public assets: images and static assets live under `public/imagenes/` (e.g. `public/imagenes/procedimientos`, `public/imagenes/testimonios`).
- Server: there is a `server/` folder with its own `package.json` and dependencies (`express`, `firebase-admin`, `mysql2`) but the main file `server/src/index.js` is currently empty — treat the server as an uninitialized skeleton.

Immediate tasks an AI assistant can do
- Use `app/utils/auth.ts` when adding or fixing auth flows. It shows precise localStorage keys and the shape of stored objects.
- When editing UI, prefer modifying `app/layout.tsx` for global chrome and `app/*/page.tsx` files for route pages.
- For data/API work: inspect `server/` only after confirming the intended server architecture with the team — it contains dependencies but no running entrypoint.

Scripts / commands (from package.json)
- frontend dev: `npm run dev` (runs `next dev --turbopack`) — this is the standard way to start the Next app.
- build: `npm run build` (Next build)
- start: `npm run start`
- lint: `npm run lint` (runs `eslint`)

Patterns and examples to follow (concrete)
- Client-only modules use the React "use client" directive. Example: `app/utils/auth.ts` starts with `"use client"` and manipulates localStorage.
- Global imports: CSS and third-party CSS (Bootstrap/FontAwesome) are imported once in `app/layout.tsx`.
- Component usage: `NavbarClient` is imported using the `@/components/` alias; when adding imports, follow that pattern.

Integration notes and gotchas
- There is a partial server setup: while `server/package.json` lists `firebase-admin` and `mysql2`, there are no runnable server scripts and `server/src/index.js` is empty. Don't assume a backend API exists yet — the codebase currently relies on client-side logic for auth and data.
- Secret management: no `.env` or env.example file is present in the repo. If you need credentials (Firebase, DB), ask the team and do not hardcode secrets — add `.env` and update `.gitignore` as needed.
- Images: the app references images from `public/imagenes/...` — prefer placing new static assets there.

Where to look for common tasks
- Add a new page or route: `app/<route>/page.tsx` (App Router)
- Auth changes: `app/utils/auth.ts` (localStorage keys: `ce_users`, `ce_current_user`)
- Global layout / styles: `app/layout.tsx`, `app/globals.css`
- Client components: `src/components/` and `app/components/`
- Server skeleton: `server/package.json`, `server/src/index.js` (empty — implement server logic here if backend is required)

When making changes
- Preserve the client/server separation: frontend is Next.js in the root; backend code (if implemented) should live in `server/` and have its own package.json and start scripts.
- Make minimal, focused edits and run the app locally with `npm run dev`. For type errors, run tsc or rely on the Next dev server diagnostics.

Questions for the maintainers (place these as comments in PRs if unclear)
- Should the `server/` folder be a runnable API, or is the project intentionally frontend-only with placeholder dependencies?
- Is there any intended realtime/auth integration with Firebase, or was `firebase-admin` added preemptively?

If anything in this file looks incomplete or outdated, tell me which area you'd like expanded (dev workflow, server wiring, auth flow examples) and I'll iterate.
