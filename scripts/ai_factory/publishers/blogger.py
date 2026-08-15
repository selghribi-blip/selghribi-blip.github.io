"""النشر على Blogger | Publish to Blogger via the v3 REST API and a refresh token."""

from __future__ import annotations

import logging
from typing import Optional

import requests

from ..ads import inject_html, inject_markdown
from ..config import Settings
from ..generator import Content

LOGGER = logging.getLogger(__name__)

TOKEN_URL = "https://oauth2.googleapis.com/token"
POSTS_URL = "https://www.googleapis.com/blogger/v3/blogs/{blog_id}/posts/"
TIMEOUT = 60


class BloggerError(RuntimeError):
    """فشل النشر على Blogger | Raised when Blogger rejects a request."""


def _markdown_to_html(markdown: str) -> str:
    """تحويل مبسّط من Markdown إلى HTML | Minimal Markdown to HTML conversion.

    Blogger stores raw HTML, and the generator only emits a small Markdown subset
    (headings, lists, tables, bold/italic/links), so a full parser is unnecessary.
    """
    import re

    html_lines = []
    in_list = False
    in_table = False
    for line in markdown.splitlines():
        stripped = line.strip()

        inline = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', stripped)
        inline = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", inline)
        inline = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", inline)
        inline = re.sub(r"`([^`]+)`", r"<code>\1</code>", inline)

        is_list_item = stripped.startswith(("- ", "* "))
        is_table_row = stripped.startswith("|") and stripped.endswith("|")
        if in_list and not is_list_item:
            html_lines.append("</ul>")
            in_list = False
        if in_table and not is_table_row:
            html_lines.append("</table>")
            in_table = False

        if not stripped:
            continue
        if stripped.startswith("#"):
            level = min(len(stripped) - len(stripped.lstrip("#")), 6)
            html_lines.append("<h{0}>{1}</h{0}>".format(max(level, 2), inline.lstrip("# ").strip()))
        elif is_list_item:
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            html_lines.append("<li>{0}</li>".format(inline[2:].strip()))
        elif is_table_row:
            cells = [cell.strip() for cell in inline.strip("|").split("|")]
            if all(set(cell) <= set("-: ") for cell in cells):
                continue
            if not in_table:
                html_lines.append('<table border="1" cellpadding="6" cellspacing="0">')
                in_table = True
            html_lines.append("<tr>{0}</tr>".format("".join("<td>{0}</td>".format(c) for c in cells)))
        else:
            html_lines.append("<p>{0}</p>".format(inline))

    if in_list:
        html_lines.append("</ul>")
    if in_table:
        html_lines.append("</table>")
    return "\n".join(html_lines)


class BloggerPublisher:
    """ينشر تدوينة على Blogger | Creates a Blogger post."""

    name = "blogger"

    def __init__(self, settings: Settings, dry_run: bool = False) -> None:
        self.settings = settings
        self.dry_run = dry_run
        self._access_token: Optional[str] = None

    def access_token(self) -> str:
        if self._access_token:
            return self._access_token
        if not self.settings.has_blogger:
            raise BloggerError(
                "blogger is not configured: set BLOGGER_BLOG_ID, BLOGGER_CLIENT_ID, "
                "BLOGGER_CLIENT_SECRET and BLOGGER_REFRESH_TOKEN "
                "(run scripts/ai_factory/authorize_blogger.py to mint a refresh token)"
            )
        response = requests.post(
            TOKEN_URL,
            data={
                "client_id": self.settings.blogger_client_id,
                "client_secret": self.settings.blogger_client_secret,
                "refresh_token": self.settings.blogger_refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=TIMEOUT,
        )
        if response.status_code != 200:
            raise BloggerError(
                "token refresh failed (HTTP {0}): {1}".format(response.status_code, response.text[:300])
            )
        self._access_token = response.json()["access_token"]
        return self._access_token

    def render(self, content: Content) -> str:
        if content.topic.mode == "page":
            return inject_html(content.html_page, self.settings.ads)
        html = _markdown_to_html(content.body_markdown)
        return inject_markdown(html, self.settings.ads)

    def publish(self, content: Content, is_draft: bool = False) -> str:
        """يعيد رابط التدوينة المنشورة | Returns the published post URL."""
        body = {
            "kind": "blogger#post",
            "title": content.title,
            "content": self.render(content),
            "labels": content.tags[:20],
        }
        if self.dry_run:
            LOGGER.info("[dry-run] would post %r to blogger (%s bytes)", content.title, len(body["content"]))
            return "dry-run://blogger/{0}".format(content.slug)

        response = requests.post(
            POSTS_URL.format(blog_id=self.settings.blogger_blog_id),
            params={"isDraft": "true" if is_draft else "false"},
            headers={
                "Authorization": "Bearer {0}".format(self.access_token()),
                "Content-Type": "application/json",
            },
            json=body,
            timeout=TIMEOUT,
        )
        if response.status_code not in (200, 201):
            raise BloggerError(
                "post failed (HTTP {0}): {1}".format(response.status_code, response.text[:400])
            )
        url = response.json().get("url", "")
        LOGGER.info("published to blogger: %s", url)
        return url
