# Freemius Customer Portal promo header

A single JavaScript file that adds a birthday‑sale promo header to the bPlugins
Freemius Customer Portal. Freemius loads it through the **Customer Portal
JavaScript** setting, so nothing is installed on the portal itself.

| File | Purpose |
|---|---|
| `promo.js` | The script Freemius loads. All campaign settings live in the `CONFIG` block at the top. |
| `index.html` | A local preview page that mimics the portal layout. Open it to see the banner without logging in. |

## How it reaches the portal

1. The file is served from GitHub Pages: `https://ah-polash.github.io/freemius-dashboard-js-tweaks/promo.js`
2. In the Freemius Developer Dashboard go to **Stores → bPlugins → Settings → Customer Portal → Customization → Customer Portal JavaScript** and paste that URL.
3. The portal fetches the store settings, then appends the file as an async `<script>` in the page head. This happens in the direct portal (`customers.freemius.com/store/2229`) and inside the iframe when the portal is embedded on `bplugins.com/user-dashboard/`.

`raw.githubusercontent.com` links do not work for this: GitHub serves them as `text/plain` with `nosniff`, and browsers refuse to run them as scripts. GitHub Pages serves `application/javascript`.

## What the banner does

- Sits at the top of the portal (login page and dashboard), pushing the content down the same way Freemius' own seasonal header does.
- Shows the headline, an orange "Up to 35% OFF" badge, the coupon code with a copy button, a live countdown and a "Grab Now" button.
- Hides itself after `endsAt`. Set `hideWhenExpired: false` to keep it.
- Can be dismissed. The dismissal is remembered for `rememberDismissDays` days per `campaignId`, so a new campaign id brings it back for everyone.
- Works with the clipboard inside the cross‑origin iframe (falls back to the legacy copy command, then to selecting the code).

## Changing the campaign

Edit the `CONFIG` block in `promo.js`:

```js
var CONFIG = {
  campaignId: 'birthday-2026',
  badge: 'Up to 35% OFF',
  title: 'bPlugins Birthday Flash Sale!',
  subtitle: 'Get everything premium with a special discount.',
  couponCode: 'BIRTHDAY2026',
  ctaText: 'Grab Now →',
  ctaUrl: 'https://bplugins.com/coupons/?utm_source=customer_portal&utm_medium=promo_header&utm_campaign=birthday2026',
  ctaTarget: '_blank',
  startsAt: '',
  endsAt: '2026-10-10T23:59:59',
  showCountdown: true,
  hideWhenExpired: true,
  dismissible: true,
  rememberDismissDays: 1
};
```

Dates without a timezone count in the visitor's local time, matching the countdown on bplugins.com. Add an offset to pin them, for example `2026-10-10T23:59:59+06:00`.

Commit and push. GitHub Pages caches files for 10 minutes, so allow that long for the change to show. Visitors who already have the portal open see it after a reload.

## Deploying

The repository is already the GitHub Pages source once Pages is enabled for the `main` branch, root folder:

```bash
git push origin main
gh api -X POST repos/ah-polash/freemius-dashboard-js-tweaks/pages \
  -f build_type=legacy -f 'source[branch]=main' -f 'source[path]=/'
```

The second command is only needed once. After it, the preview is at
`https://ah-polash.github.io/freemius-dashboard-js-tweaks/` and the script at
`https://ah-polash.github.io/freemius-dashboard-js-tweaks/promo.js`.

## Previewing locally

```bash
python3 -m http.server 4873
# open http://localhost:4873/
```

Query string overrides on the preview page: `?ends=2026-12-31T23:59:59`, `?starts=…`, `?campaign=test`.
In any portal page with the script loaded, `bplPortalPromo.reset()` in the console brings back a dismissed banner.
