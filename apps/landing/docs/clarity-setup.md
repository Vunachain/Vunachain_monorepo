# Microsoft Clarity Integration Guide

## Task 4: Configuring Microsoft Clarity in Google Tag Manager

Microsoft Clarity provides session recordings and heatmaps to understand user behavior. This guide explains how to set it up via GTM to maintain your "Zero-Grip" workflow.

---

## Prerequisites

1. **Microsoft Clarity Account**: Sign up at [clarity.microsoft.com](https://clarity.microsoft.com/)
2. **Project Created**: Create a new project in Clarity and note your **Project ID** (looks like: `abc123def4`)
3. **GTM Container**: You should have already added the GTM container to your site (see `gtm-setup.md`)

---

## Step-by-Step GTM Configuration

### Step 1: Get Your Clarity Script

After creating a project in Microsoft Clarity:

1. Navigate to **Settings** → **Setup**
2. Copy your Clarity **Project ID** (e.g., `abc123def4`)
3. You'll see an installation script that looks like this:

```html
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "abc123def4");
</script>
```

---

### Step 2: Create a Custom HTML Tag in GTM

1. Log into your **Google Tag Manager** account
2. Navigate to your Vunachain container
3. Click **Tags** → **New**
4. Name the tag: `Microsoft Clarity - All Pages`

#### Tag Configuration

5. Click **Tag Configuration**
6. Select **Custom HTML**
7. Paste the Clarity script from Step 1 (replacing `abc123def4` with your actual Project ID)

```html
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "abc123def4");
</script>
```

#### Triggering

8. Click **Triggering**
9. Select **All Pages** (this ensures Clarity loads on every page of your site)
10. Click **Save**

---

### Step 3: Test in GTM Preview Mode

1. In GTM, click **Preview** (top right)
2. Enter your site URL: `http://localhost:3000` (or your production URL)
3. Navigate through your site
4. In the GTM Preview panel, verify that the `Microsoft Clarity - All Pages` tag fires on page load
5. Open DevTools → Console and look for Clarity initialization messages

---

### Step 4: Publish the Tag

1. Once verified, click **Submit** (top right in GTM)
2. Name the version: `v1 - Added Microsoft Clarity`
3. Add description: `Installed Microsoft Clarity for heatmaps and session recordings`
4. Click **Publish**

---

## Generating Heatmaps for the ROI Calculator Section

Microsoft Clarity automatically generates heatmaps for all page elements. To focus your analysis on the ROI Calculator:

### In Microsoft Clarity Dashboard:

1. Navigate to **Heatmaps** in the left sidebar
2. Click **Create Heatmap**
3. Select **Click Heatmap** or **Scroll Heatmap**
4. Filter by **URL**: Enter the page URL where the ROI calculator appears (e.g., `https://vunachain.com/#roi` or just the homepage if it's embedded there)
5. Apply filters:
   - **Segment by Device**: Compare desktop vs. mobile interactions
   - **Segment by Traffic Source**: Analyze organic vs. ad traffic behavior
6. Click **Generate**

### Recommended Heatmap Focus Areas:

- **ROI Calculator Slider**: Are users engaging with the "Annual Tonnage" slider?
- **CTA Buttons**: Which buttons ("Calculate My Annual Leakage" vs. "See the Compliance Tech") get more clicks?
- **Demo Modal**: Track click patterns on the "Book a Demo" form

---

## Advanced: Custom Clarity Events (Optional)

You can also push custom events to Clarity for more granular tracking. This requires adding JavaScript to your event handlers.

Example: Track ROI Calculator slider engagement directly in Clarity:

```javascript
// In your ROICalculator.tsx component
import { trackROICalculatorInteraction } from '../utils/analytics';

const handleSliderChange = (volume: number, loss: number) => {
  // Push to GTM dataLayer
  trackROICalculatorInteraction(volume, loss, 'Coffee');
  
  // Optionally push to Clarity as well
  if (window.clarity) {
    window.clarity('event', 'roi_slider_moved', { volume, loss });
  }
};
```

> **Note**: This requires declaring `clarity` on the Window interface. Only use this if you need cross-platform analytics (both GTM and Clarity).

---

## Verification Checklist

After setup, verify that:

- [ ] GTM Tag fires on all pages (check in GTM Preview Mode)
- [ ] Clarity project shows live sessions (check Clarity dashboard)
- [ ] Heatmaps are generating data (may take 24-48 hours for sufficient data)
- [ ] No console errors related to Clarity script loading

---

## Troubleshooting

### Clarity Not Loading

1. Check that your GTM container is correctly installed (see `gtm-setup.md`)
2. Verify your Clarity Project ID is correct in the Custom HTML tag
3. Ensure the tag trigger is set to **All Pages**
4. Check browser console for script errors

### Heatmaps Not Generating

1. Wait 24-48 hours for sufficient traffic data
2. Ensure you have at least 100 sessions for meaningful heatmaps
3. Check that your URL filters are correct (don't include `#roi` hash if Clarity doesn't support it)

---

## Next Steps

- Monitor session recordings to identify user friction points
- Use scroll heatmaps to optimize above-the-fold content
- A/B test different CTA placements based on click heatmap data
- Segment heatmaps by traffic source to understand channel quality
