# GTM Container Setup Guide

## Task 1: GTM Container Injection

### For Current Vite + React App

Replace `GTM-XXXXXXX` with your actual GTM Container ID.

#### Step 1: Add to `<head>` in `index.html`

Place this snippet as **high in the `<head>` as possible**, ideally right after the opening `<head>` tag:

```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

#### Step 2: Add to `<body>` in `index.html`

Place this snippet **immediately after the opening `<body>` tag**:

```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

---

### For Future Django Migration

When you add a Django backend, move these snippets to your `base.html` template:

#### Django `base.html` Template Example

```django
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
    <!-- End Google Tag Manager -->
    
    <title>{% block title %}Vunachain{% endblock %}</title>
    {% block extra_head %}{% endblock %}
</head>
<body>
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    
    {% block content %}{% endblock %}
    
    {% block extra_scripts %}{% endblock %}
</body>
</html>
```

---

## Verification

After adding the GTM snippets:

1. Open your site in a browser
2. Open DevTools → Console
3. Type `dataLayer` and press Enter
4. **Expected Result**: You should see an array with GTM initialization objects

Example output:
```javascript
[
  {
    "gtm.start": 1234567890123,
    "event": "gtm.js"
  }
]
```

## Next Steps

Once the GTM container is live:
1. Install the `web-vitals` package: `npm install web-vitals`
2. Add the analytics utility files (see `utils/analytics.ts` and `utils/performance.ts`)
3. Integrate event tracking into your components
4. Use **GTM Preview Mode** to test all events before publishing tags
