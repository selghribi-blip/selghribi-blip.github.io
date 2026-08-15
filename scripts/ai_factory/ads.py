"""إدماج الإعلانات | Ad snippet injection for Markdown posts and HTML pages."""

from __future__ import annotations

import re

from .config import AdSnippets

_HEADING = re.compile(r"^#{2,3} ", re.MULTILINE)


def inject_markdown(body: str, ads: AdSnippets) -> str:
    """إدماج الإعلانات في مقالة Markdown | Wrap a Markdown body with ad slots.

    The in-article slot goes right before the second heading so it lands inside the
    content rather than above the fold, which is what most networks require.
    """
    if not ads.enabled:
        return body

    parts = [ads.header, body] if ads.header else [body]
    text = "\n\n".join(parts)

    if ads.in_article:
        headings = list(_HEADING.finditer(text))
        if len(headings) >= 2:
            cut = headings[1].start()
            text = "{0}\n{1}\n\n{2}".format(text[:cut], ads.in_article, text[cut:])
        else:
            text = "{0}\n\n{1}".format(text, ads.in_article)

    if ads.footer:
        text = "{0}\n\n{1}".format(text, ads.footer)
    return text


def inject_html(html: str, ads: AdSnippets) -> str:
    """إدماج الإعلانات في صفحة HTML كاملة | Inject ad snippets into a full HTML page."""
    if not ads.enabled:
        return html

    if ads.header:
        match = re.search(r"<body[^>]*>", html, re.IGNORECASE)
        if match:
            html = html[: match.end()] + "\n" + ads.header + html[match.end() :]
        else:
            html = ads.header + "\n" + html

    tail = "\n".join(snippet for snippet in (ads.in_article, ads.footer) if snippet)
    if tail:
        match = re.search(r"</body>", html, re.IGNORECASE)
        if match:
            html = html[: match.start()] + tail + "\n" + html[match.start() :]
        else:
            html = html + "\n" + tail
    return html
