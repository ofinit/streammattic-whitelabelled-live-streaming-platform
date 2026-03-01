import { readFileSync, writeFileSync, readdirSync, statSync } from "fs"
import { join, extname } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

// Script files are copied to /home/user/ at runtime, so hardcode the actual project path
const projectRoot = "/vercel/share/v0-project"

// Recursively find all .ts/.tsx files
function findFiles(dir, results = []) {
  try {
    const entries = readdirSync(dir)
    for (const entry of entries) {
      const fullPath = join(dir, entry)
      try {
        const stat = statSync(fullPath)
        if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules" && entry !== ".next" && entry !== "scripts") {
          findFiles(fullPath, results)
        } else if (stat.isFile() && (extname(entry) === ".ts" || extname(entry) === ".tsx")) {
          results.push(fullPath)
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results
}

console.log("Project root:", projectRoot)

const allFiles = findFiles(projectRoot)
console.log(`Found ${allFiles.length} .ts/.tsx files total`)

// Filter to those containing reseller/Reseller
const files = allFiles.filter(f => {
  const content = readFileSync(f, "utf-8")
  return /reseller|Reseller|RESELLER/i.test(content)
})

console.log(`Found ${files.length} files with reseller references`)

const replacements = [
  // Import paths and file references  
  [/reseller-form-dialog/g, "studio-form-dialog"],
  [/reseller-youtube-dialog/g, "studio-youtube-dialog"],
  [/reseller-domain-dialog/g, "studio-domain-dialog"],

  // Type/Interface/Class names
  [/mockResellerWalletSummary/g, "mockStudioWalletSummary"],
  [/mockResellerStats/g, "mockStudioStats"],
  [/mockResellers/g, "mockStudios"],
  [/ResellerBranding/g, "StudioBranding"],
  [/ResellerStats/g, "StudioStats"],
  [/ResellerFormDialog/g, "StudioFormDialog"],
  [/ResellerYouTubeDialog/g, "StudioYouTubeDialog"],
  [/ResellerDomainDialog/g, "StudioDomainDialog"],
  [/ResellerDashboard/g, "StudioDashboard"],
  [/ResellerLayout/g, "StudioLayout"],
  [/ResellerLayoutInner/g, "StudioLayoutInner"],

  // Property/variable names
  [/resellerPrice/g, "studioPrice"],
  [/resellerSurcharge/g, "studioSurcharge"],
  [/basePriceReseller/g, "basePriceStudio"],
  [/priceReseller/g, "priceStudio"],
  [/resellerId/g, "studioId"],
  [/resellerNav/g, "studioNav"],
  [/resellerCnameTarget/g, "studioCnameTarget"],
  [/resellerAnnualSubscription/g, "studioAnnualSubscription"],
  [/resellerPerEvent/g, "studioPerEvent"],
  [/totalResellers/g, "totalStudios"],
  [/activeResellers/g, "activeStudios"],
  [/isReseller/g, "isStudio"],
  [/total_resellers/g, "total_studios"],
  [/active_resellers/g, "active_studios"],
  [/reseller_id/g, "studio_id"],
  [/reseller_name/g, "studio_name"],
  [/is_reseller/g, "is_studio"],

  // Route paths
  [/\/api\/reseller\//g, "/api/studio/"],
  [/\/reseller\/events/g, "/studio/events"],
  [/\/reseller\/calendar/g, "/studio/calendar"],
  [/\/reseller\/wallet/g, "/studio/wallet"],
  [/\/reseller\/packages/g, "/studio/packages"],
  [/\/reseller\/analytics/g, "/studio/analytics"],
  [/\/reseller\/branding/g, "/studio/branding"],
  [/\/reseller\/notifications/g, "/studio/notifications"],
  [/\/reseller\/settings/g, "/studio/settings"],
  [/\/reseller\/setup/g, "/studio/setup"],
  [/\/reseller\/orders/g, "/studio/orders"],
  [/\/reseller\/domains/g, "/studio/domains"],
  [/\/reseller\/users/g, "/studio/users"],
  [/\/admin\/resellers/g, "/admin/studios"],
  [/\/reseller"/g, '/studio"'],
  [/\/reseller'/g, "/studio'"],
  [/\/reseller`/g, "/studio`"],
  [/\/reseller\)/g, "/studio)"],

  // Role strings
  [/"reseller"/g, '"studio"'],
  [/'reseller'/g, "'studio'"],

  // Generic catch-all (order matters: plural before singular, capitalized before lowercase)
  [/Resellers/g, "Studios"],
  [/Reseller/g, "Studio"],
  [/resellers/g, "studios"],
  [/reseller/g, "studio"],
  [/RESELLERS/g, "STUDIOS"],
  [/RESELLER/g, "STUDIO"],
]

let totalFiles = 0

for (const filePath of files) {
  let content = readFileSync(filePath, "utf-8")
  const original = content

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }

  if (content !== original) {
    writeFileSync(filePath, content)
    totalFiles++
    console.log(`Updated: ${filePath.replace(projectRoot + "/", "")}`)
  }
}

console.log(`\nDone! Updated ${totalFiles} files`)

// Verify no remaining references
const remaining = allFiles.filter(f => {
  const content = readFileSync(f, "utf-8")
  return /reseller|Reseller|RESELLER/.test(content)
})

if (remaining.length > 0) {
  console.log(`\nRemaining references in ${remaining.length} files:`)
  for (const f of remaining) {
    const content = readFileSync(f, "utf-8")
    const lines = content.split("\n")
    for (let i = 0; i < lines.length; i++) {
      if (/reseller|Reseller|RESELLER/.test(lines[i])) {
        console.log(`  ${f.replace(projectRoot + "/", "")}:${i + 1}: ${lines[i].trim().substring(0, 100)}`)
      }
    }
  }
} else {
  console.log("\nAll clean - no remaining reseller references!")
}
