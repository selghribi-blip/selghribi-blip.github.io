---
# قالب بلاغ خطأ | Bug Report Template
name: 🐛 بلاغ خطأ | Bug Report
description: أبلغ عن خطأ في الموقع | Report a bug on the website
title: "[BUG] "
labels: ["bug"]
assignees: []
body:
  - type: markdown
    attributes:
      value: |
        ## 🐛 شكراً على الإبلاغ! | Thanks for reporting!
        ساعدنا في تحسين الموقع بإعطائنا أكبر قدر من التفاصيل.
        Help us improve by giving as many details as possible.

  - type: textarea
    id: bug-description
    attributes:
      label: وصف المشكلة | Bug Description
      description: وصف واضح ومختصر للمشكلة | A clear and concise description of the bug
      placeholder: "عند النقر على... / حدث خطأ... | When I click on... / An error occurred..."
    validations:
      required: true

  - type: textarea
    id: reproduction-steps
    attributes:
      label: خطوات إعادة الإنتاج | Reproduction Steps
      description: خطوات لإعادة إنتاج المشكلة | Steps to reproduce the problem
      placeholder: |
        1. افتح الصفحة... | Open the page...
        2. اضغط على... | Click on...
        3. شاهد الخطأ | See the error
    validations:
      required: true

  - type: textarea
    id: expected-behavior
    attributes:
      label: السلوك المتوقع | Expected Behavior
      description: ماذا يجب أن يحدث؟ | What should happen?
      placeholder: "المتوقع أن... | Expected to..."
    validations:
      required: true

  - type: textarea
    id: actual-behavior
    attributes:
      label: السلوك الفعلي | Actual Behavior
      description: ماذا يحدث فعلاً؟ | What actually happens?
      placeholder: "بدلاً من ذلك... | Instead..."
    validations:
      required: true

  - type: textarea
    id: screenshots
    attributes:
      label: لقطات الشاشة | Screenshots
      description: أضف لقطات شاشة إذا أمكن | Add screenshots if possible
      placeholder: "اسحب وأفلت الصور هنا | Drag and drop images here"

  - type: dropdown
    id: browser
    attributes:
      label: المتصفح | Browser
      options:
        - Chrome
        - Firefox
        - Safari
        - Edge
        - متصفح جوال | Mobile browser
        - أخرى | Other
    validations:
      required: true

  - type: dropdown
    id: device
    attributes:
      label: الجهاز | Device
      options:
        - كمبيوتر مكتبي | Desktop
        - لابتوب | Laptop
        - هاتف ذكي | Mobile
        - تابلت | Tablet
    validations:
      required: true

  - type: input
    id: url
    attributes:
      label: رابط الصفحة | Page URL
      description: ما هو رابط الصفحة التي حدث فيها الخطأ؟ | URL where the bug occurred?
      placeholder: "https://artsmoroccan.me/..."

  - type: checkboxes
    id: terms
    attributes:
      label: تأكيد | Confirmation
      options:
        - label: تأكدت من أن هذا الخطأ لم يُبلّغ عنه من قبل | I checked this bug wasn't reported before
          required: true
