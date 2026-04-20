/**
 * Copies `templates/` HTML theme folders into `public/templates/stream-legacy/<tpl-id>/`
 * and applies small compatibility patches (Typekit href, missing placeholder images).
 *
 * Run: node scripts/sync-stream-legacy-templates.mjs
 */
import fs from "fs"
import path from "path"
import https from "https"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")

const MAPPINGS = [
  ["templates/General Template 1", "public/templates/stream-legacy/tpl-stream-classic-banner"],
  ["templates/General Template 3", "public/templates/stream-legacy/tpl-stream-voguish-hero"],
  ["templates/General Template 4", "public/templates/stream-legacy/tpl-stream-digital-creative"],
  ["templates/General Template 5", "public/templates/stream-legacy/tpl-stream-showcase-home"],
  ["templates/Corporate Template 1", "public/templates/stream-legacy/tpl-stream-corporate-stage"],
  ["templates/Corporate Template 2", "public/templates/stream-legacy/tpl-stream-corporate-countdown"],
  ["templates/Corporate Template 3", "public/templates/stream-legacy/tpl-stream-corporate-clean"],
  ["templates/Wedding Template 03", "public/templates/stream-legacy/tpl-stream-wedding-floral-heart"],
  ["templates/Wedding Template 04", "public/templates/stream-legacy/tpl-stream-wedding-flex"],
  ["templates/Wedding Template 05", "public/templates/stream-legacy/tpl-stream-wedding-cloud"],
  ["templates/Wedding Template 06", "public/templates/stream-legacy/tpl-stream-wedding-cinematic"],
]

function patchIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return
  let html = fs.readFileSync(filePath, "utf8")
  html = html.replace(/href="\.\.\/use\.typekit\.net\//g, 'href="https://use.typekit.net/')
  html = html.replace(/href='\.\.\/use\.typekit\.net\//g, "href='https://use.typekit.net/")
  fs.writeFileSync(filePath, html, "utf8")
}

function downloadIfMissing(url, destPath) {
  if (fs.existsSync(destPath)) return
  const dir = path.dirname(destPath)
  fs.mkdirSync(dir, { recursive: true })
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath)
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location
          res.resume()
          if (!loc) {
            reject(new Error("Redirect without location"))
            return
          }
          downloadIfMissing(loc, destPath).then(resolve).catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        res.pipe(file)
        file.on("finish", () => {
          file.close(() => resolve())
        })
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
  })
}

async function ensurePlaceholderImages() {
  /** Small reliable JPG for missing `images/upload/pic.jpg` references */
  const placeholderUrl =
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"
  const targets = [
    "public/templates/stream-legacy/tpl-stream-wedding-floral-heart/images/upload/pic.jpg",
    "public/templates/stream-legacy/tpl-stream-wedding-flex/images/upload/pic.jpg",
    "public/templates/stream-legacy/tpl-stream-wedding-cloud/images/upload/pic.jpg",
    "public/templates/stream-legacy/tpl-stream-wedding-cinematic/images/upload/pic.jpg",
    "public/templates/stream-legacy/tpl-stream-corporate-countdown/images/upload/pic.jpg",
    "public/templates/stream-legacy/tpl-stream-corporate-clean/images/upload/pic.jpg",
  ]
  for (const rel of targets) {
    const dest = path.join(root, rel)
    try {
      await downloadIfMissing(placeholderUrl, dest)
      process.stdout.write(`ok: ${rel}\n`)
    } catch (e) {
      process.stderr.write(`warn: could not download placeholder for ${rel}: ${e.message}\n`)
    }
  }
}

async function main() {
  for (const [srcRel, destRel] of MAPPINGS) {
    const src = path.join(root, srcRel)
    const dest = path.join(root, destRel)
    if (!fs.existsSync(src)) {
      console.error(`Missing source: ${srcRel}`)
      process.exitCode = 1
      continue
    }
    fs.rmSync(dest, { recursive: true, force: true })
    fs.cpSync(src, dest, { recursive: true })
    patchIndexHtml(path.join(dest, "index.html"))
    console.log(`synced: ${srcRel} -> ${destRel}`)
  }
  await ensurePlaceholderImages()
  console.log("done.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
