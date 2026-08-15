---
name: testing-jekyll-ai-factory
description: How to locally test the Jekyll site (artsmoroccan.me) and the scripts/ai_factory AI content pipeline, including ad slot toggles and offline verification without LLM API keys.
---

# Testing the Jekyll site + ai_factory pipeline

## Local site
- `bundle install` (bundler is configured with `BUNDLE_PATH: vendor/bundle` in `.bundle/config`);
  it may rewrite `Gemfile.lock` — always `git checkout -- Gemfile.lock` when done so the branch stays clean.
- `bundle exec jekyll build` then `bundle exec jekyll serve --host 0.0.0.0 --port 4000`.
- Start the server with the exec tool using `timeout: 0` (background). Backgrounding with
  `nohup ... &` inside a one-shot shell tends to get killed when the shell exits, leaving
  `curl localhost:4000` returning 000.
- Jekyll takes ~20-30s from launch to serving; poll `curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/`.
- Changes to `_config.yml` are NOT picked up by a running `jekyll serve` — restart the server
  (`pkill -f "jekyll serve"`) after editing config.

## Useful URLs
- Home: `/`; Arabic RTL page example: `/pages/about`
- Posts: `/blog/<yyyy>/<mm>/<dd>/<slug>/`
- AI-generated standalone pages index: `/ai-pages/` (from `pages/ai-pages.md`, iterates
  `site.static_files` under `/ai-pages/`); pages themselves at `/ai-pages/<slug>.html`.
- `<body class="rtl">` is only added when `page.lang` is `ar` or unset, so English posts
  correctly build with `<body class="">`.

## Ads slots
- Controlled by `ads.enabled` in `_config.yml` (default `false`) and rendered by
  `_includes/ads/{head,banner,footer}.html`, included from `_layouts/default.html`
  (head, above `{{ content }}`, below `{{ content }}`).
- With `enabled: false` the built HTML contains zero `ad-slot` elements — check with
  `grep -rc "ad-slot" _site --include=*.html`.
- To prove placement, temporarily set `enabled: true` and put visible dummy markup inside the
  `{%- if site.ads.enabled -%}` block of `_includes/ads/banner.html`, restart serve, then
  `git checkout -- _config.yml _includes/ads/banner.html`. Never commit these edits.

## ai_factory CLI (offline)
- Tests: `python -m pytest scripts/tests -q`.
- `PYTHONPATH=scripts python -m ai_factory --list-pending` works with no API key: it prints
  `language<TAB>mode<TAB>keyword` for topics in `scripts/ai_factory/topics.yml` not present in
  `scripts/ai_factory/state.json`.
- `--dry-run` still requires an LLM key: `__main__.py` gates on `settings.has_llm` and
  `runner.run()` always calls `generate()`. Without a key it exits 2 with
  `error: set GOOGLE_API_KEY (or OPENROUTER_API_KEY) first`. Dry-run only skips the *write*,
  not the generation, so it cannot be exercised offline.
- To verify the write path/ad injection with no key, construct `Content`/`Topic` objects
  directly and call `JekyllPublisher(settings, dry_run=True).publish(...)` from a throwaway
  script outside the repo (set `ADSTERRA_HEADER` / `ADSTERRA_IN_ARTICLE` / `ADSTERRA_FOOTER`
  env vars to see `ai_factory.ads` injection in the rendered Markdown).

## Devin Secrets Needed
- `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) or `OPENROUTER_API_KEY` — required for any real
  generation run (including `--dry-run`).
- `BLOGGER_BLOG_ID`, `BLOGGER_CLIENT_ID`, `BLOGGER_CLIENT_SECRET`, `BLOGGER_REFRESH_TOKEN` —
  required to test the `blogger` publish target.
- Never write these into repo files; pass them as environment variables only.
