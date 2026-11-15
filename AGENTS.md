<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules (ChildGram)

- Auth is username + password: the client derives a private synthetic email (`usernameToAuthEmail` in `src/lib/rules.ts`) and auto-confirm is on, because kids never give an email.
- Profile creation, the minimum sign-up age (`MIN_SIGNUP_AGE`) and the under-13 consent check run in the `handle_new_user` trigger from signup metadata, so the rule can't be bypassed from the browser.
- Birth date and consent live in `profile_private` (owner + admin read; only admins may update `birth_date`); other users see only the age number via the `current_age(profiles)` computed field, never the date.
- Admin rights come only from `user_roles` checked with `has_role()` in RLS; the `/admin` route guard is UI-only.
- `profiles` is visible to its owner, admins, and kids who shared something; only `avatar_id`/`bio` are column-granted for update.
- Drawings are stored as image data URLs in `drawings.image_data` (no storage bucket), so visibility is enforced purely by table RLS.
- All social pages live under `src/routes/_authenticated/` (client-only); content is never visible signed-out, for child safety.
- Embeds from `drawings` to `profiles` must name `drawings_user_id_fkey`, because `hearts`/`comments` make the relation ambiguous.
- Comment age barrier: the comments INSERT policy calls `can_comment_on(drawing_id)` (SECURITY DEFINER, mirrors `canCommentBetween` in `src/lib/rules.ts`: life-stage tiers via `ages_can_comment`/`commentAgeTier`), so the rule holds even if the UI is bypassed; the UI reads `comment_block_reason()` only to pick the message.
- Soft-ban: `profile_private.banned_at` (admin-only update) freezes the age at 0 via `effective_age()`, used by `current_age`, `can_comment_on` and `comment_block_reason`; `is_banned()` in drawings/profiles/hearts RLS blocks writes and hides a banned user's drawings from others. A real birth date can never give age 0 (trigger), so age 0 always means banned.
- Studio stickers (`src/lib/stickers.ts`, emojis + inline SVG decorations) are stamped into the canvas bitmap, not kept as layers, so a drawing stays one image and no schema or RLS change is needed.
- Stale page files after an update (e.g. Safari "Importing a module script failed") trigger one guarded reload (inline head script in `__root.tsx` for failures before the app starts, plus `src/lib/chunk-reload.ts` in the root error boundary and `vite:preloadError`), so kids never get stuck on a blank screen.
- Ban messaging: `ban_messages` holds one conversation per banned user (`user_id`); RLS lets that user read/write only while `is_banned()`, and admins read all but write only to banned users (mirrored by `canSendBanMessage` in `src/lib/rules.ts`), so the channel can't be used as general chat.
