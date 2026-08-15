# مصنع المحتوى | AI Content Factory

توليد مقالات وصفحات HTML كاملة بالذكاء الاصطناعي، ثم نشرها تلقائياً على مدونة
Jekyll (artsmoroccan.me) و/أو مدونة Blogger، مع إدماج أكواد الإعلانات في كل صفحة.

Generates SEO articles (Markdown) and DeepSite-style single-file HTML pages, injects
ad snippets, and publishes to the Jekyll site and/or Blogger.

## التشغيل | Usage

```bash
pip install -r scripts/requirements.txt
export PYTHONPATH=scripts

# تشغيل تجريبي: يولّد فقط ولا يكتب شيئاً | generate only, write nothing
python -m ai_factory --count 1 --targets jekyll --dry-run

# نشر على المدونتين | publish to both blogs
python -m ai_factory --count 2 --targets jekyll,blogger

# المواضيع المتبقية في قائمة الانتظار | remaining queue
python -m ai_factory --list-pending
```

المواضيع تُقرأ من `topics.yml` بالترتيب، وما نُشر يُسجَّل في `state.json` فلا يتكرر.
Topics come from `topics.yml`; published ones are recorded in `state.json`.

## متغيّرات البيئة | Environment variables

| المتغيّر | الوصف |
| --- | --- |
| `GOOGLE_API_KEY` | مفتاح Gemini (المزوّد الأساسي) |
| `GEMINI_MODEL` | اختياري، الافتراضي `gemini-2.5-flash` ثم بدائل تلقائية |
| `OPENROUTER_API_KEY` | مزوّد بديل عند فشل Gemini |
| `OPENROUTER_MODEL` | اختياري |
| `BLOGGER_BLOG_ID` | معرّف مدونة Blogger |
| `BLOGGER_CLIENT_ID` / `BLOGGER_CLIENT_SECRET` / `BLOGGER_REFRESH_TOKEN` | ترخيص Blogger |
| `ADSTERRA_HEADER` / `ADSTERRA_IN_ARTICLE` / `ADSTERRA_FOOTER` | أكواد الإعلانات (HTML خام) |
| `SITE_URL` | الافتراضي `https://artsmoroccan.me` |

لا تضع أي مفتاح في المستودع؛ استخدم `.env` محلياً (مُستثنى في `.gitignore`)
وGitHub Secrets في الـ Actions.

## ترخيص Blogger | Blogger authorization

`token.pickle` القديم منتهي؛ لتوليد refresh token جديد:

```bash
python scripts/ai_factory/authorize_blogger.py --client-secrets credentials.json
```

يطبع لك `BLOGGER_CLIENT_ID` و`BLOGGER_CLIENT_SECRET` و`BLOGGER_REFRESH_TOKEN`.
شرط واحد: أن يكون `http://localhost:8080/` مسجّلاً كـ redirect URI في عميل OAuth
داخل Google Cloud Console.

## الإعلانات | Ads

- **Blogger والصفحات المولّدة**: تُدمج أكواد `ADSTERRA_*` تلقائياً (أعلى الصفحة،
  داخل المقال قبل العنوان الثاني، وأسفل الصفحة).
- **قوالب Jekyll**: الصق الأكواد في `_includes/ads/head.html` و`banner.html`
  و`footer.html`، ثم اجعل `ads.enabled: true` في `_config.yml`.

## الاختبارات | Tests

```bash
python -m pytest scripts/tests/test_ai_factory.py -q
```

الاختبارات لا تتصل بالشبكة إطلاقاً | The suite never touches the network.
