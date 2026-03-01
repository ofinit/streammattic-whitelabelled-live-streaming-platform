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
  // Import paths and component names
  [/from ["']@?\.\.?\/(.*?)reseller(.*?)["']/g, (match) => match.replace(/reseller/g, "studio")],
  
  // Specific patterns (order matters - more specific first)
  [/mockResellerWalletSummary/g, "mockStudioWalletSummary"],
  [/mockResellerStats/g, "mockStudioStats"],
  [/mockResellers/g, "mockStudios"],
  [/ResellerBranding/g, "StudioBranding"],
  [/ResellerStats/g, "StudioStats"],
  [/ResellerFormDialog/g, "StudioFormDialog"],
  [/ResellerYouTubeDialog/g, "StudioYouTubeDialog"],
  [/ResellerDomainDialog/g, "StudioDomainDialog"],
  [/reseller-form-dialog/g, "studio-form-dialog"],
  [/reseller-youtube-dialog/g, "studio-youtube-dialog"],
  [/reseller-domain-dialog/g, "studio-domain-dialog"],
  [/resellerPrice/g, "studioPrice"],
  [/resellerSurcharge/g, "studioSurcharge"],
  [/basePriceReseller/g, "basePriceStudio"],
  [/priceReseller/g, "priceStudio"],
  [/resellerId/g, "studioId"],
  [/resellerNav/g, "studioNav"],
  [/resellerCnameTarget/g, "studioCnameTarget"],
  [/resellerAnnualSubscription/g, "studioAnnualSubscription"],
  [/totalResellers/g, "totalStudios"],
  [/activeResellers/g, "activeStudios"],
  [/isReseller/g, "isStudio"],
  
  // Route paths
  [/\/reseller\//g, "/studio/"],
  [/\/reseller"/g, '/studio"'],
  [/\/reseller'/g, "/studio'"],
  [/\/reseller`/g, "/studio`"],
  [/\/resellers\//g, "/studios/"],
  [/\/resellers"/g, '/studios"'],
  [/\/resellers'/g, "/studios'"],
  [/href="\/admin\/resellers/g, 'href="/admin/studios'],
  
  // Role strings  
  [/"reseller"/g, '"studio"'],
  [/'reseller'/g, "'studio'"],
  
  // Display text (case sensitive)
  [/Reseller Dashboard/g, "Studio Dashboard"],
  [/Reseller Management/g, "Studio Management"],
  [/Reseller Pricing/g, "Studio Pricing"],
  [/Reseller Price/g, "Studio Price"],
  [/Reseller Cost/g, "Studio Cost"],
  [/Reseller Override/g, "Studio Override"],
  [/Reseller Surcharge/g, "Studio Surcharge"],
  [/Reseller YouTube/g, "Studio YouTube"],
  [/Reseller Domain/g, "Studio Domain"],
  [/Reseller Wallet/g, "Studio Wallet"],
  [/Reseller Settings/g, "Studio Settings"],
  [/Reseller Events/g, "Studio Events"],
  [/Reseller Orders/g, "Studio Orders"],
  [/Reseller Analytics/g, "Studio Analytics"],
  [/Reseller Notifications/g, "Studio Notifications"],
  [/Reseller Branding/g, "Studio Branding"],
  [/Reseller Setup/g, "Studio Setup"],
  [/Reseller Calendar/g, "Studio Calendar"],
  [/New Reseller/g, "New Studio"],
  [/Add Reseller/g, "Add Studio"],
  [/Edit Reseller/g, "Edit Studio"],
  [/All Resellers/g, "All Studios"],
  [/Total Resellers/g, "Total Studios"],
  [/Active Resellers/g, "Active Studios"],
  [/Manage Resellers/g, "Manage Studios"],
  [/reseller account/g, "studio account"],
  [/reseller rate/g, "studio rate"],
  [/reseller pricing/g, "studio pricing"],
  [/reseller price/g, "studio price"],
  [/reseller cost/g, "studio cost"],
  [/reseller branding/g, "studio branding"],
  [/reseller dashboard/g, "studio dashboard"],
  [/resellers and/g, "studios and"],
  [/resellers\./g, "studios."],
  [/a reseller/g, "a studio"],
  [/the reseller/g, "the studio"],
  [/for reseller/g, "for studio"],
  [/new reseller/g, "new studio"],
  
  // Remaining generic catches (careful ordering)
  [/Resellers/g, "Studios"],
  [/Reseller/g, "Studio"],
  [/resellers/g, "studios"],
  [/reseller/g, "studio"],
]

let totalReplacements = 0

for (const filePath of files) {
  let content = readFileSync(filePath, "utf-8")
  let fileReplacements = 0
  
  for (const [pattern, replacement] of replacements) {
    const before = content
    if (typeof replacement === "function") {
      content = content.replace(pattern, replacement)
    } else {
      content = content.replace(pattern, replacement)
    }
    if (content !== before) {
      fileReplacements++
    }
  }
  
  if (fileReplacements > 0) {
    writeFileSync(filePath, content)
    totalReplacements += fileReplacements
    console.log(`Updated ${filePath} (${fileReplacements} pattern groups)`)
  }
}

console.log(`\nDone! Updated ${totalReplacements} pattern groups across ${files.length} files`)

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
    console.log("\nNo remaining reseller references found!")
  }
} catch {
  console.log("\nNo remaining reseller references found!")
}
