# X → fixupx: Copy link

Userscript: when you press **Copy link** on a post at x.com / twitter.com, the copied URL points to `fixupx.com` instead, with the tracking params (`?s=…&t=…`) removed. Pasted into Telegram or Discord, the link then gets a proper embed.

- Works with `navigator.clipboard.writeText` / `write`, `DataTransfer.setData` and `execCommand('copy')`.
- Only rewrites when the whole copied text is a single post URL (`/status/<id>`); everything else is left alone.

## Install

Needs a userscript manager (Tampermonkey, Violentmonkey, …). Open the raw file and confirm the install:

https://raw.githubusercontent.com/sermelipharo/x-copy-link-fixupx/main/x-copy-link-fixupx.user.js

Updates come from the same URL (`@updateURL`).
