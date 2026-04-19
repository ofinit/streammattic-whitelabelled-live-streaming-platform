# Client photo gallery add-on (BYOS)

Stream-Livee stores **catalog settings** and optional **per-user opt-outs** in Postgres. The **gallery UI** for clients is served by **this** Next.js app at a configurable path (default **`/client-gallery`**), on the platform domain and on each studio’s custom domain. **Presigned S3 uploads**, thumbnails, and heavy processing can still live in workers or a future service; **same-origin routing** avoids a separate deploy just to host the gallery shell.

**Not the same as event “Photo gallery”:** The template field in the event editor (images on the public watch page) is separate. The add-on is for **client-delivered** albums and uploads against **your** object storage (BYOS), not for reusing those template gallery images as the client gallery product.

When **List in Packages** is on, the add-on is **visible** in Packages for studios and streamers. **Access** requires all of:

1. **Admin enabled** per account under **Admin → Streamers** or **Admin → Studios** (`user_addon_entitlements.photo_gallery_enabled = true`).
2. **User opt-in** (`photo_gallery_opt_in = true`) via **Packages** — turning the service on debits the wallet when **Monthly price (INR)** is greater than zero (first period and renewals).
3. **Active subscription period** (`photo_gallery_subscription_expires_at` in the future). Renewals run from a **daily cron** (`GET /api/cron/photo-gallery-subscription`) that charges `monthlyPricePaisa` from the wallet; insufficient balance turns the service off and emails the user.

**Optional per-usage fees** (Admin → Packages): **Album creation fee** and **Per-upload fee** default to **0** (off). When set, the wallet is debited on album create and on each upload presign request (`photo_gallery_usage`).

**Email reminders** (`GET /api/cron/photo-gallery-renewal-reminders`, same `CRON_SECRET` as other crons): pre-expiry at 7, 3, 1, and 0 days before `photo_gallery_subscription_expires_at`; daily for days 1–7 after expiry; on the **1st and 15th** (UTC) of each month while still expired and opted in. Deduped in `photo_gallery_renewal_reminders`.

Apply DB changes: `scripts/ensure-photo-gallery-subscription-schema.sql` (adds columns, reminder table, `txn_category` values).

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

### Public gallery: same-person filter (AWS Rekognition)

When enabled, new **image** uploads trigger **IndexFaces** into a per-album Rekognition collection; faces are grouped into **`client_gallery_person_identities`** for the public UI “People” strip and per-person photo filter. Image bytes are read with the album owner’s **BYOS S3** credentials; **Rekognition** calls use the **platform** AWS credentials (not the customer’s object-storage keys).

**Environment (server):**

| Variable | Meaning |
| --- | --- |
| `CLIENT_GALLERY_FACE_RECOGNITION` | Set to `1` to enable processing and public person rows. Omit or any other value disables it. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Platform IAM user/role for Rekognition. |
| `AWS_REGION` or `AWS_REKOGNITION_REGION` | Region for the Rekognition API (collection and faces live in this region). |

Apply tables: `scripts/ensure-client-gallery-face-identity-schema.sql` (also merged into `scripts/schema-complete.sql`).

**Wallet (streamer/studio):** **Retail** per processed image (`faceIndexCreditPricePaisa` in `photo_gallery_addon`) is debited **once per asset** after at least one face is stored, if retail > 0. The same public URL and person-filter UI do **not** trigger extra debits. **Admin reference** fields (`rekognitionReferencePaisaPerCreateCollection`, `rekognitionReferencePaisaPerIndexFaces`, `rekognitionReferencePaisaPerSearchFaces`) are for **margin estimates** only; set them from current AWS list pricing for your region.

---

See also: [deploy-coolify-ozero.md](deploy-coolify-ozero.md) for the main Stream-Livee stack.
