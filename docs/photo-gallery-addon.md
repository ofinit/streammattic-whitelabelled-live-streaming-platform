# Client photo gallery add-on (BYOS)

Stream-Livee stores **catalog settings** and **per-user entitlements** in Postgres. The **gallery application** (presigned S3 uploads, thumbnails, optional face search) is a **separate deploy** you run when you build it. This page covers **DNS** for that app’s public URL and how **face-index pricing** relates to **your** AI vendor costs.

## Gallery app base URL — DNS

**What you enter in Admin → Packages** is the full HTTPS origin customers use to open the gallery, for example:

`https://gallery.yourdomain.com`

(no trailing slash)

### Steps (typical)

1. **Deploy** the gallery service on your infrastructure (e.g. another Coolify app, same server or another host).
2. **Choose a hostname** dedicated to that service, e.g. `gallery.yourdomain.com`.
3. **DNS at your registrar / DNS host**
   - **A record:** `gallery` → **public IPv4** of the machine or load balancer that terminates HTTPS, **or**
   - **CNAME:** `gallery` → the hostname your host gives you (e.g. Coolify’s generated app URL or a load balancer), if your provider allows CNAME for that subdomain.
4. **TLS:** Terminate HTTPS on that hostname (Let’s Encrypt in Coolify, or your proxy). The URL in admin must use **`https://`** once certificates are valid.
5. **Coolify:** Add the domain on the **gallery** service; Coolify/Traefik usually requests certificates automatically. Wait until the domain resolves and HTTPS works, then paste the same URL into **Gallery app base URL**.

Stream-Livee does **not** provision DNS or certificates for that hostname; it only **displays** the link to entitled users.

## Face index credit & “included face indexes / month”

| Field | Meaning |
| --- | --- |
| **Face index credit (₹)** | Intended **retail** price per face-index operation (e.g. one image indexed for search), charged from the customer’s **wallet** when that billing path exists. |
| **Included face indexes / month** | Intended **allowance** before overage billing; `0` means “no included quota” in the product design. |

Today these values are **admin configuration only**. They do **not** trigger API calls, wallet debits, or an AI service inside this repository until you implement the gallery worker and hook it to `wallet_transactions` (or equivalent).

## Your AI costs (not shown in the admin UI)

The admin UI shows **what you charge customers**, not **what you pay** AWS/Azure/Google or your GPU host.

- **Your revenue per index** ≈ the **Face index credit** you set (minus taxes/refunds).
- **Your cost per index** = whatever your chosen stack bills (per image, per face, per minute of GPU, etc.).
- **Margin** = revenue per index − cost per index (you must estimate cost from the provider’s pricing page and your usage pattern).

This app **does not** compute or display vendor cost. You maintain a spreadsheet or monitoring against your cloud bill.

### Common options (you choose one when building the gallery service)

| Approach | Cost driver | Where to read pricing |
| --- | --- | --- |
| **AWS Rekognition** | Per-image / per-face API usage, region-dependent | [AWS Rekognition pricing](https://aws.amazon.com/rekognition/pricing/) |
| **Azure AI Face** | Per-transaction pricing tiers | [Azure AI Face pricing](https://azure.microsoft.com/pricing/details/cognitive-services/face-api/) |
| **Google Cloud Vision** | Per-image features | [Google Cloud Vision pricing](https://cloud.google.com/vision/pricing) |
| **Self-hosted** | GPU/CPU instances, no per-call cloud ML fee | Your infra provider (Coolify server, VPS, etc.) |

**Model names** (e.g. a specific Rekognition API operation) are determined by **your gallery service implementation**, not by Stream-Livee core. Point your gallery app at **one** provider per environment so accounting stays predictable.

### Quick sanity check

1. Pick a provider and region.
2. Read **price per indexed image** (or per 1,000 images) from their page.
3. Set **Face index credit** in admin **above** that unit cost if you want positive margin before GST.

---

See also: [deploy-coolify-ozero.md](deploy-coolify-ozero.md) for the main Stream-Livee stack.
