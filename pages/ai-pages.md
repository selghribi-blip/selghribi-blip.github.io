---
layout: page
title: "صفحات مولّدة بالذكاء الاصطناعي"
title_en: "AI Generated Pages"
description: "صفحات ويب كاملة مولّدة تلقائياً بالذكاء الاصطناعي بأسلوب DeepSite"
permalink: /ai-pages/
lang: ar
---

صفحات ويب مستقلة (ملف HTML واحد لكل صفحة) يولّدها مصنع المحتوى تلقائياً.

<ul>
{% assign ai_pages = site.static_files | where_exp: "file", "file.path contains '/ai-pages/'" %}
{% for file in ai_pages %}
  {% if file.extname == '.html' %}
  <li><a href="{{ file.path | relative_url }}">{{ file.basename | replace: '-', ' ' }}</a></li>
  {% endif %}
{% endfor %}
</ul>

{% if ai_pages == empty %}
<p>لا توجد صفحات بعد.</p>
{% endif %}
