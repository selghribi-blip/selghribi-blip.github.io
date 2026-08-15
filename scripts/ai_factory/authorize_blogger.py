#!/usr/bin/env python3
"""ترخيص Blogger | One-off OAuth helper that prints a Blogger refresh token.

الاستخدام | Usage:
    python scripts/ai_factory/authorize_blogger.py --client-secrets credentials.json

يطبع رابطاً تفتحه في المتصفح، ثم تلصق الكود الناتج، فيطبع لك refresh token
تضعه في BLOGGER_REFRESH_TOKEN. It uses the out-of-band-less loopback-free
"device-style" code flow via a console redirect so it also works over SSH.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from urllib.parse import urlencode

import requests

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPE = "https://www.googleapis.com/auth/blogger"
REDIRECT_URI = "http://localhost:8080/"


def load_client(path: Path):
    data = json.loads(path.read_text(encoding="utf-8"))
    section = data.get("installed") or data.get("web") or {}
    if not section.get("client_id") or not section.get("client_secret"):
        raise SystemExit("{0} does not look like an OAuth client secrets file".format(path))
    return section["client_id"], section["client_secret"]


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Mint a Blogger refresh token")
    parser.add_argument("--client-secrets", required=True, type=Path)
    parser.add_argument(
        "--redirect-uri",
        default=REDIRECT_URI,
        help="must be registered on the OAuth client (default: {0})".format(REDIRECT_URI),
    )
    args = parser.parse_args(argv)

    client_id, client_secret = load_client(args.client_secrets)
    query = urlencode(
        {
            "client_id": client_id,
            "redirect_uri": args.redirect_uri,
            "response_type": "code",
            "scope": SCOPE,
            "access_type": "offline",
            "prompt": "consent",
        }
    )
    print("1) افتح هذا الرابط وسجّل الدخول بالحساب المالك للمدونة | Open this URL and sign in:")
    print("\n{0}?{1}\n".format(AUTH_URL, query))
    print("2) بعد الموافقة سيعيدك المتصفح إلى {0}?code=...".format(args.redirect_uri))
    code = input("3) الصق قيمة code هنا | Paste the code value here: ").strip()
    if not code:
        print("no code provided", file=sys.stderr)
        return 2

    response = requests.post(
        TOKEN_URL,
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": args.redirect_uri,
            "grant_type": "authorization_code",
        },
        timeout=60,
    )
    if response.status_code != 200:
        print("token exchange failed (HTTP {0}): {1}".format(response.status_code, response.text), file=sys.stderr)
        return 1

    payload = response.json()
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        print("google did not return a refresh_token; re-run with prompt=consent", file=sys.stderr)
        return 1

    print("\nBLOGGER_CLIENT_ID={0}".format(client_id))
    print("BLOGGER_CLIENT_SECRET={0}".format(client_secret))
    print("BLOGGER_REFRESH_TOKEN={0}".format(refresh_token))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
