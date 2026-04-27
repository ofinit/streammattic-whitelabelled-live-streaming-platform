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

## Camera FTP/SFTP ingest

AI Client Photo Gallery album pages include a **Camera FTP/SFTP upload** panel for entitled streamer/studio users. Each camera access entry is scoped to one album and stores:

- photographer/camera label
- generated username
- one-time generated password (shown only after create/reset)
- album-specific incoming prefix
- enabled/disabled state
- optional expiry
- last upload/import counters for the gateway or import worker to update

Apply DB changes:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-camera-ingest-schema.sql
```

The app does **not** expose streamer/studio Wasabi keys to cameras. Cameras receive only generated FTP/SFTP credentials. The gateway service, for example SFTPGo deployed in Coolify, should map those credentials to the album owner’s BYOS storage prefix.

Optional gateway display settings:

| Variable | Meaning |
| --- | --- |
| `CLIENT_GALLERY_CAMERA_INGEST_HOST` | Public hostname shown to streamers/studios for camera setup. |
| `CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET` | Optional DNS target for branded studio upload hosts. Defaults to `CLIENT_GALLERY_CAMERA_INGEST_HOST`. |
| `NEXT_PUBLIC_CLIENT_GALLERY_CAMERA_INGEST_HOST` | Public display copy of the gateway host for browser-side manual DNS instructions. |
| `NEXT_PUBLIC_CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET` | Public display copy of the DNS target for browser-side manual DNS instructions. |
| `CLIENT_GALLERY_CAMERA_INGEST_PROTOCOL` | Preferred protocol shown in setup copy: `sftp`, `ftps`, or `ftp` (default `sftp`). |
| `CLIENT_GALLERY_CAMERA_INGEST_SFTP_PORT` | SFTP port shown to users (default `22`). |
| `CLIENT_GALLERY_CAMERA_INGEST_FTP_PORT` | FTP port shown to users (default `21`). |
| `CLIENT_GALLERY_CAMERA_INGEST_FTPS_PORT` | FTPS port shown to users (default `990`). |
| `CLIENT_GALLERY_CAMERA_INGEST_WEBHOOK_SECRET` | Shared secret required by `POST /api/client-gallery/camera-ingest/import` when SFTPGo or a worker registers an uploaded object. |

The current app implementation manages album-scoped credential records and setup details. SFTPGo or a worker can register a completed upload by calling:

```http
POST /api/client-gallery/camera-ingest/import
x-client-gallery-camera-ingest-secret: <CLIENT_GALLERY_CAMERA_INGEST_WEBHOOK_SECRET>
content-type: application/json

{
  "username": "cg_...",
  "key": "cg/<owner>/<album>/incoming/<credentialId>/image.jpg",
  "contentType": "image/jpeg",
  "byteSize": 1234567
}
```

The import endpoint validates the username, enabled/expiry state, and object prefix before inserting into `client_gallery_assets`.

For studios with custom domains, the setup wizard and Studio → Domains manual instructions include an optional branded camera upload hostname:

```text
sftp.<studio-domain>  CNAME  <CLIENT_GALLERY_CAMERA_INGEST_DNS_TARGET or CLIENT_GALLERY_CAMERA_INGEST_HOST>
```

If the configured target is an IPv4 address, the UI/API uses an `A` record instead of `CNAME`. Cloudflare auto-setup creates this record along with the normal platform routing and TXT verification records. The client gallery camera setup panel prefers the branded `sftp.<studio-domain>` host and shows the central gateway host as a fallback.

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

**Wallet (streamer/studio):** **Retail** per processed image (`faceIndexCreditPricePaisa` in `photo_gallery_addon`) is debited **once per asset** after at least one face is stored, if retail > 0. The same public URL and person-filter UI do **not** trigger extra debits. Album-creation and per-upload wallet fees are disabled (stored as 0). Face processing uses **AWS Rekognition** when `CLIENT_GALLERY_FACE_RECOGNITION=1`; OpenRouter is not used for face identity in this app.

**Admin optional:** `faceRecognitionProviderCostReferencePaisa` — your estimated AWS cost per processed image (margin planning only; optional transparency on Packages when set).

---

See also: [deploy-coolify-ozero.md](deploy-coolify-ozero.md) for the main Stream-Livee stack.
