import { readFileSync, writeFileSync } from "fs"
import { execSync } from "child_process"

// Get all files still referencing reseller/Reseller
const files = execSync(
  `grep -rl "reseller\\|Reseller\\|RESELLER" --include="*.ts" --include="*.tsx" /vercel/share/v0-project/app /vercel/share/v0-project/components /vercel/share/v0-project/lib`,
  { encoding: "utf-8" }
)
  .trim()
  .split("\n")
  .filter(Boolean)

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

  // Generic catch-all (order: plural before singular, capitalized before lowercase)
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
    console.log(`Updated: ${filePath.replace("/vercel/share/v0-project/", "")}`)
  }
}

console.log(`\nDone! Updated ${totalFiles} files`)

// Verify no remaining references
try {
  const remaining = execSync(
    `grep -rn "reseller\\|Reseller\\|RESELLER" --include="*.ts" --include="*.tsx" /vercel/share/v0-project/app /vercel/share/v0-project/components /vercel/share/v0-project/lib | head -20`,
    { encoding: "utf-8" }
  ).trim()
  if (remaining) {
    console.log("\nRemaining references found:")
    console.log(remaining)
  } else {
    console.log("\nAll clean - no remaining reseller references!")
  }
} catch {
  console.log("\nAll clean - no remaining reseller references!")
}
