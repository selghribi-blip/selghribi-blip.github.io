---
# قالب اقتراح مقالة | Blog Post Idea Template
name: 💡 اقتراح مقالة | Blog Post Idea
description: اقترح موضوع مقالة جديدة | Suggest a new blog post topic
title: "[IDEA] "
labels: ["blog-idea", "enhancement"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## 💡 شكراً لاقتراحك! | Thanks for your suggestion!
        اقتراحاتكم تساعدني في كتابة محتوى أكثر قيمة.
        Your suggestions help me write more valuable content.

  - type: input
    id: title
    attributes:
      label: عنوان المقالة المقترحة | Suggested Post Title
      description: ما هو عنوان المقالة التي تريدها؟ | What title do you suggest?
      placeholder: "مثال: كيف تبني موقعاً مجانياً بـ Jekyll | Example: How to build a free site with Jekyll"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: وصف مختصر | Brief Description
      description: ما الذي يجب أن تتناوله المقالة؟ | What should the post cover?
      placeholder: |
        - النقطة الأولى
        - النقطة الثانية
        - النقطة الثالثة
    validations:
      required: true

  - type: dropdown
    id: language
    attributes:
      label: اللغة المفضلة | Preferred Language
      description: بأي لغة تريد المقالة؟ | In which language do you want the post?
      options:
        - العربية (ar)
        - الإنجليزية (en)
        - الفرنسية (fr)
        - كلتاهما (ar + en)
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: التصنيف | Category
      description: ما هو تصنيف المقالة؟ | What is the post category?
      options:
        - tutorial (درس)
        - github (GitHub)
        - automation (أتمتة)
        - javascript (JavaScript)
        - python (Python)
        - design (تصميم)
        - career (مسار مهني)
        - tools (أدوات)
        - project (مشروع)
        - opinion (رأي)
    validations:
      required: true

  - type: dropdown
    id: priority
    attributes:
      label: الأولوية | Priority
      description: ما مدى أهمية هذا الموضوع بالنسبة لك؟ | How important is this topic to you?
      options:
        - 🔴 عاجل | Urgent
        - 🟠 مهم | Important
        - 🟡 عادي | Normal
        - 🟢 يمكن الانتظار | Can wait

  - type: textarea
    id: motivation
    attributes:
      label: لماذا هذا الموضوع؟ | Why this topic?
      description: ما الذي دفعك لاقتراح هذا الموضوع؟ | What motivated this suggestion?
      placeholder: "وجدت صعوبة في... / لم أجد محتوى عربياً عن... / I struggled with... / I couldn't find Arabic content about..."

  - type: checkboxes
    id: terms
    attributes:
      label: تأكيد | Confirmation
      options:
        - label: تأكدت من أن هذا الموضوع لم يُقترح من قبل | I checked this topic wasn't suggested before
          required: true
