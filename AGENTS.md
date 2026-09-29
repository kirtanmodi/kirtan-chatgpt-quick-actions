# Repository guidance

Read `CLAUDE.md` for architecture and maintenance rules, and `README.md` for setup and usage. These apply throughout the repository; there are no subdirectory overrides.

- Keep model IDs synchronized across the global dropdown, all eight command dropdowns, and the price table. Check official provider documentation before changing models.
- Preserve provider-compatible resolution and saved user preferences. Describe token counts and costs as estimates.
- Run `npm run lint` and `npm run build` before handoff. No permanent test framework is configured.
- Obtain explicit approval for the expected cost before a potentially billed live API check.
- Stop `npm run dev` after verification. Rerun it after manifest changes to refresh Raycast's preferences.
- Update existing docs and regenerate the handover PDF when behavior changes. Keep explanations simple and concise.
- Use conventional commits; commit and push only when requested. For a pushed change, use `git revert <commit>` to undo it without rewriting history.
