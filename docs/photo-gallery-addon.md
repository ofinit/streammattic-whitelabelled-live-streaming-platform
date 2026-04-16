# Client photo gallery add-on (BYOS)

Stream-Livee stores **catalog settings** and optional **per-user opt-outs** in Postgres. The **gallery UI** for clients is served by **this** Next.js app at a configurable path (default **`/client-gallery`**), on the platform domain and on each studio’s custom domain. **Presigned S3 uploads**, thumbnails, and heavy processing can still live in workers or a future service; **same-origin routing** avoids a separate deploy just to host the gallery shell.

**Not the same as event “Photo gallery”:** The template field in the event editor (images on the public watch page) is separate. The add-on is for **client-delivered** albums and uploads against **your** object storage (BYOS), not for reusing those template gallery images as the client gallery product.

When **List in Packages** is on, the add-on is **visible** in Packages for studios and streamers, but access is **off until an admin enables it** per account under **Admin → Streamers** or **Admin → Studios** (`user_addon_entitlements.photo_gallery_enabled = true`). Missing row or `false` means no entitlement.

## Same-origin gallery path (default)

**What you configure in Admin → Packages** is primarily a **path** on the current host, e.g. `https://your-studio.com/client-gallery` (no extra DNS for “gallery” alone — the domain already points at Coolify).

| Field | Meaning |
| --- | --- |
| **Gallery path (same origin)** | Must start with `/`. Default `/client-gallery`. Entitled studios/streamers get a **sidebar link** (new tab) to this path on whatever origin they are on. |
| **Legacy external gallery URL (optional)** | If you still run a separate gallery app, set its full `https://…` origin here; the sidebar link uses that instead of the path. |

When the legacy URL is **empty**, that link opens **`/client-gallery`** (or your custom path) on the **current** origin — platform domain or studio custom domain.

**Public access:** `/client-gallery` is a **public** route (guests are not redirected to login for v1). The page uses the **same theme tokens** as the rest of the app (welcome hero, stat placeholders, activity placeholders, help accordion); signed-in streamers/studios see add-on status from `/api/photo-gallery-addon/status` and the **same app sidebar** as `/streamer/*` and `/studio/*` (this path is not nested under those layouts, so the page wraps the gallery content with the shared sidebar shell). Later you can gate specific albums with query tokens or path segments without changing the “public route” rule.

## Face index credit

| Field | Meaning |
| --- | --- |
| **Face index credit (₹)** | **Retail** price per vision/index job once billing exists — **no free quota**; each job is intended to debit the wallet at this rate. |

This value is **admin configuration only** until a gallery worker debits `wallet_transactions` (or equivalent).

## OpenRouter (vision) vs biometric face search

**OpenRouter** in this repo is used for **AI image generation** and can be used for **vision** workloads (captioning, tags, structured JSON about images). That fits an **“AI-assisted gallery”** (text derived from images, smart search on those tags).

**Biometric** same-person search across large libraries (embeddings, face-ID style) is **not** what chat/vision routes are for; industry norm is **AWS Rekognition**, **Azure Face**, **Google Vision** face features, or **self-hosted** stacks (e.g. InsightFace).

**Admin → Packages** loads OpenRouter list pricing (`GET /api/v1/models`) and shows **all amounts in INR** (OpenRouter quotes USD; the app converts with **`USD_INR_REFERENCE`** or **`OPENROUTER_USD_INR`**, default 83). The **illustrative per-job** cost uses fixed token assumptions in `lib/openrouter-model-pricing.ts`. **Margin** compares **Face index credit** (retail INR) to that estimate. **`OPENROUTER_API_KEY`** is recommended if OpenRouter requires auth for your account.

For true biometric search, budget Rekognition/Azure/self-hosted instead of chat vision models.

---

See also: [deploy-coolify-ozero.md](deploy-coolify-ozero.md) for the main Stream-Livee stack.
