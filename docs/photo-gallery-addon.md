# Client photo gallery add-on (BYOS)

Stream-Livee stores **catalog settings** and **per-user entitlements** in Postgres. The **gallery UI** for clients is served by **this** Next.js app at a configurable path (default **`/client-gallery`**), on the platform domain and on each studio’s custom domain. **Presigned S3 uploads**, thumbnails, and heavy processing can still live in workers or a future service; **same-origin routing** avoids a separate deploy just to host the gallery shell.

## Same-origin gallery path (default)

**What you configure in Admin → Packages** is primarily a **path** on the current host, e.g. `https://your-studio.com/client-gallery` (no extra DNS for “gallery” alone — the domain already points at Coolify).

| Field | Meaning |
| --- | --- |
| **Gallery path (same origin)** | Must start with `/`. Default `/client-gallery`. Entitled users see **Open gallery app** → this path on whatever origin they are on. |
| **Legacy external gallery URL (optional)** | If you still run a separate gallery app, set its full `https://…` origin here; **Open gallery** uses that instead of the path. |

When the legacy URL is **empty**, Packages links to **`/client-gallery`** (or your custom path) on the **current** origin — platform domain or studio custom domain.

**Public access:** `/client-gallery` is a **public** route (guests are not redirected to login for v1). Later you can gate specific albums with query tokens or path segments without changing the “public route” rule.

## Face index credit & “included face indexes / month”

| Field | Meaning |
| --- | --- |
| **Face index credit (₹)** | Intended **retail** price per vision-analysis / indexing job (or per batch) once billing exists; charged from the customer’s **wallet** when that path is implemented. |
| **Included face indexes / month** | Intended **allowance** before overage billing; `0` means “no included quota” in the product design. |

Today these values are **admin configuration only**. They do **not** trigger API calls, wallet debits, or an AI service inside this repository until you implement the gallery worker and hook it to `wallet_transactions` (or equivalent).

## OpenRouter (vision) vs biometric face search

**OpenRouter** in this repo is used for **AI image generation** and can be used for **vision** workloads (captioning, tags, structured JSON about images). That fits an **“AI-assisted gallery”** (text derived from images, smart search on those tags).

**Biometric** same-person search across large libraries (embeddings, face-ID style) is **not** what chat/vision routes are for; industry norm is **AWS Rekognition**, **Azure Face**, **Google Vision** face features, or **self-hosted** stacks (e.g. InsightFace).

**Admin → Packages** mirrors **AI Image Generation**: you pick a **planned OpenRouter vision model** from a catalog, set an **estimated API cost per job** (paise), and see **margin** vs **Face index credit** (retail). Those fields are for planning until a gallery worker calls OpenRouter and debits the wallet. For true biometric search, budget Rekognition/Azure/self-hosted instead.

Adjust estimates against [OpenRouter models pricing](https://openrouter.ai/models); catalog defaults are rough per-job guesses.

### Quick sanity check (vision on OpenRouter)

1. Pick a vision-capable model and note price per 1M input/output tokens.
2. Estimate tokens per image in dev (prompt + image + JSON output).
3. Set **Face index credit** above your expected per-job cost if you want positive margin.

---

See also: [deploy-coolify-ozero.md](deploy-coolify-ozero.md) for the main Stream-Livee stack.
