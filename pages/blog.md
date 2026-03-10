---
layout: page
title: "المدونة | Blog"
description: "مقالات تقنية عربية عن البرمجة، GitHub، وأدوات المطورين"
lang: ar
permalink: /pages/blog/
---

<div style="margin-bottom:32px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
  <div style="display:flex; gap:8px; flex-wrap:wrap;">
    <a href="{{ '/pages/blog' | relative_url }}" class="badge badge-primary" style="text-decoration:none;">الكل</a>
    <a href="{{ '/pages/blog' | relative_url }}?category=tutorial" class="badge badge-terracotta" style="text-decoration:none;">دروس</a>
    <a href="{{ '/pages/blog' | relative_url }}?category=github" class="badge badge-gold" style="text-decoration:none;">GitHub</a>
    <a href="{{ '/pages/blog' | relative_url }}?category=automation" class="badge badge-emerald" style="text-decoration:none;">أتمتة</a>
  </div>
  <a href="{{ '/feed.xml' | relative_url }}" class="btn btn-secondary btn-sm" style="font-size:0.8rem;">
    📡 RSS Feed
  </a>
</div>

{% if site.posts.size > 0 %}
<div class="grid grid-2" style="gap:24px;">
  {% for post in site.posts %}
  <article class="post-card" lang="{{ post.lang | default: 'ar' }}">
    <div class="post-card-image" aria-hidden="true">
      {% if post.image %}
      <img src="{{ post.image }}" alt="{{ post.title }}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">
      {% else %}
      🏺
      {% endif %}
    </div>
    <div class="post-card-body">
      {% if post.categories.first %}
      <span class="post-card-category">{{ post.categories.first }}</span>
      {% endif %}
      {% if post.lang %}
      <span class="lang-badge lang-badge-{{ post.lang }}" style="margin-inline-start:8px;">{{ post.lang }}</span>
      {% endif %}

      <h2 class="post-card-title" style="font-size:1rem;">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h2>

      <p class="post-card-excerpt">
        {{ post.description | default: post.excerpt | strip_html | truncate: 130 }}
      </p>

      <div class="post-card-footer">
        <time datetime="{{ post.date | date_to_xmlschema }}">
          📅 {{ post.date | date: "%d %B %Y" }}
        </time>
        <a href="{{ post.url | relative_url }}" class="post-card-read-more">اقرأ ←</a>
      </div>
    </div>
  </article>
  {% endfor %}
</div>
{% else %}
<div style="text-align:center; padding:80px 0;">
  <div style="font-size:4rem; margin-bottom:16px;">✍️</div>
  <h3 style="color:#1a3a5c; margin-bottom:12px;">المقالات قادمة قريباً!</h3>
  <p style="color:#5a5a5a; margin-bottom:24px;">اشترك في النشرة البريدية لتكون أول من يقرأ</p>
  <a href="#newsletter" class="btn btn-primary">📬 اشترك الآن</a>
</div>
{% endif %}

{% include newsletter-form.html %}
