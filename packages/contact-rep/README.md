# `@vote-social/contact-rep`

Embeddable Canadian **"Contact Your Elected Representative"** widget for React, Next.js, and any HTML/CMS website. Resolves Municipal, Regional, Provincial, and Federal representatives from a 6-character Canadian postal code using Open North and Vote Social.

## 1. React / Next.js Usage

```bash
npm install @vote-social/contact-rep
```

```tsx
import { VoteSocialContactRep } from "@vote-social/contact-rep";

export default function CampaignPage() {
  return (
    <VoteSocialContactRep
      tier="federal"
      defaultSubject="Support Affordable Housing"
    />
  );
}
```

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `tier` | `"federal" \| "provincial" \| "regional" \| "municipal"` | Optional level filter. When set, skips the region picker if only 1 riding matches the user's postal code. |
| `defaultSubject` | `string` | Optional pre-filled subject line for your campaign. |
| `defaultBody` | `string` | Optional pre-filled message body template. |
| `defaultPostcode` | `string` | Optional pre-filled Canadian postal code. |

---

## 2. Plain HTML / WordPress / Webflow Embed

```html
<!-- Vote Social: Contact Your Representative Widget -->
<div class="vote-social-embed" style="max-width:640px;margin:0 auto;">
  <iframe
    src="https://vote-social.ca/embed/contact-rep/?tier=federal"
    title="Contact Your Elected Representative — Vote Social"
    loading="lazy"
    style="width:100%;border:0;overflow:hidden;min-height:430px;"
  ></iframe>
</div>
<script async src="https://vote-social.ca/embed.js"></script>
```
