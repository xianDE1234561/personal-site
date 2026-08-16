CSS-only patch

Use this when the server already has the full site files uploaded.

Steps:
1. On the server, open index.html and find the stylesheet under /assets/*.css.
2. Do not rename that server CSS file.
3. Replace the contents of that server CSS file with replace-current-assets-css.css.
4. Clear browser cache or hard refresh.

This patch changes the album layout to single-column vertical scrolling.
