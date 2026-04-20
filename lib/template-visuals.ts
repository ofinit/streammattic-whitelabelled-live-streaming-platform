/**
 * Shared visual tokens for event templates: picker card gradients (by category)
 * and watch-page banner themes (by category) + per-template accent borders.
 */

import { getTemplateFields } from "@/lib/template-fields"

/** Tailwind gradient classes for template cards in the event form picker */
export const TEMPLATE_CATEGORY_CARD_GRADIENTS: Record<string, string> = {
  General: "from-slate-700 to-slate-900",
  Wedding: "from-pink-800 to-rose-900",
  Corporate: "from-blue-800 to-blue-950",
  Entertainment: "from-purple-800 to-violet-950",
  Religious: "from-amber-700 to-yellow-900",
  Sports: "from-green-700 to-emerald-900",
  Political: "from-red-800 to-red-950",
  Education: "from-cyan-700 to-teal-900",
  Celebration: "from-fuchsia-700 to-pink-900",
  Memorial: "from-stone-600 to-stone-900",
  Cultural: "from-orange-700 to-amber-900",
  Business: "from-indigo-800 to-slate-900",
  Social: "from-sky-700 to-cyan-900",
  Health: "from-lime-800 to-emerald-900",
}

/** Dark watch-page banner: shell, typography, category pill */
export const TEMPLATE_CATEGORY_BANNER_THEME: Record<
  string,
  { shell: string; headline: string; body: string; sub: string; pill: string }
> = {
  General: {
    shell: "border-zinc-700/60 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950",
    headline: "text-zinc-50",
    body: "text-zinc-300",
    sub: "text-zinc-500",
    pill: "bg-zinc-800 text-zinc-200 border-zinc-600",
  },
  Wedding: {
    shell: "border-rose-500/35 bg-gradient-to-r from-rose-950/95 via-pink-950/90 to-amber-950/80",
    headline: "text-rose-50",
    body: "text-rose-200/95",
    sub: "text-rose-400/80",
    pill: "bg-rose-900/70 text-rose-100 border-rose-600/50",
  },
  Corporate: {
    shell: "border-blue-500/35 bg-gradient-to-r from-slate-950 via-blue-950/90 to-slate-950",
    headline: "text-slate-50",
    body: "text-slate-300",
    sub: "text-slate-500",
    pill: "bg-blue-950/80 text-blue-100 border-blue-700/50",
  },
  Entertainment: {
    shell: "border-violet-500/35 bg-gradient-to-r from-violet-950/95 via-purple-950/90 to-fuchsia-950/85",
    headline: "text-violet-50",
    body: "text-violet-200/90",
    sub: "text-violet-400/75",
    pill: "bg-violet-900/70 text-violet-100 border-violet-600/50",
  },
  Religious: {
    shell: "border-amber-500/35 bg-gradient-to-r from-amber-950/90 via-yellow-950/85 to-amber-950/90",
    headline: "text-amber-50",
    body: "text-amber-200/90",
    sub: "text-amber-400/80",
    pill: "bg-amber-900/70 text-amber-100 border-amber-600/50",
  },
  Sports: {
    shell: "border-emerald-500/35 bg-gradient-to-r from-emerald-950/95 via-green-950/90 to-teal-950/85",
    headline: "text-emerald-50",
    body: "text-emerald-200/90",
    sub: "text-emerald-400/75",
    pill: "bg-emerald-900/70 text-emerald-100 border-emerald-600/50",
  },
  Political: {
    shell: "border-red-500/35 bg-gradient-to-r from-red-950/95 via-rose-950/88 to-zinc-950",
    headline: "text-red-50",
    body: "text-red-200/90",
    sub: "text-red-400/75",
    pill: "bg-red-950/80 text-red-100 border-red-700/50",
  },
  Education: {
    shell: "border-teal-500/35 bg-gradient-to-r from-teal-950/95 via-cyan-950/88 to-slate-950",
    headline: "text-teal-50",
    body: "text-teal-200/90",
    sub: "text-teal-400/75",
    pill: "bg-teal-900/70 text-teal-100 border-teal-600/50",
  },
  Celebration: {
    shell: "border-fuchsia-500/35 bg-gradient-to-r from-fuchsia-950/92 via-pink-950/88 to-rose-950/85",
    headline: "text-fuchsia-50",
    body: "text-fuchsia-200/90",
    sub: "text-fuchsia-400/75",
    pill: "bg-fuchsia-900/65 text-fuchsia-100 border-fuchsia-600/50",
  },
  Memorial: {
    shell: "border-stone-600/50 bg-gradient-to-r from-stone-950 via-zinc-900 to-stone-950",
    headline: "text-stone-100",
    body: "text-stone-300",
    sub: "text-stone-500",
    pill: "bg-stone-800 text-stone-200 border-stone-600",
  },
  Cultural: {
    shell: "border-orange-500/35 bg-gradient-to-r from-orange-950/92 via-amber-950/88 to-red-950/80",
    headline: "text-orange-50",
    body: "text-orange-200/90",
    sub: "text-orange-400/75",
    pill: "bg-orange-900/65 text-orange-100 border-orange-600/50",
  },
  Business: {
    shell: "border-indigo-500/35 bg-gradient-to-r from-indigo-950/95 via-slate-900 to-indigo-950/90",
    headline: "text-indigo-50",
    body: "text-indigo-200/88",
    sub: "text-indigo-400/70",
    pill: "bg-indigo-900/70 text-indigo-100 border-indigo-600/50",
  },
  Social: {
    shell: "border-sky-500/35 bg-gradient-to-r from-sky-950/90 via-cyan-950/85 to-blue-950/88",
    headline: "text-sky-50",
    body: "text-sky-200/90",
    sub: "text-sky-400/75",
    pill: "bg-sky-900/65 text-sky-100 border-sky-600/50",
  },
  Health: {
    shell: "border-lime-500/30 bg-gradient-to-r from-lime-950/88 via-emerald-950/92 to-teal-950/88",
    headline: "text-lime-50",
    body: "text-lime-200/90",
    sub: "text-lime-400/70",
    pill: "bg-emerald-900/70 text-emerald-100 border-emerald-600/50",
  },
}

/** Unique left accent per template id (35) for distinction on watch banner */
export const TEMPLATE_BANNER_ACCENT_BORDER: Record<string, string> = {
  "tpl-default": "border-l-4 border-l-zinc-400",
  "tpl-wedding": "border-l-4 border-l-rose-400",
  "tpl-wedding-garden": "border-l-4 border-l-emerald-500",
  "tpl-wedding-midnight": "border-l-4 border-l-amber-500",
  "tpl-wedding-coastal": "border-l-4 border-l-teal-500",
  "tpl-wedding-celestial": "border-l-4 border-l-violet-500",
  "tpl-wedding-traditional-hindu": "border-l-4 border-l-amber-600",
  "tpl-corporate": "border-l-4 border-l-blue-400",
  "tpl-corporate-tech-forward": "border-l-4 border-l-cyan-400",
  "tpl-concert": "border-l-4 border-l-violet-400",
  "tpl-christian": "border-l-4 border-l-amber-300",
  "tpl-christian-wedding-rose": "border-l-4 border-l-[#b76e79]",
  "tpl-muslim-wedding-nikah": "border-l-4 border-l-[#2d5f5d]",
  "tpl-muslim": "border-l-4 border-l-emerald-400",
  "tpl-hindu": "border-l-4 border-l-orange-400",
  "tpl-sports": "border-l-4 border-l-green-400",
  "tpl-political": "border-l-4 border-l-red-400",
  "tpl-school": "border-l-4 border-l-cyan-400",
  "tpl-funeral": "border-l-4 border-l-stone-400",
  "tpl-indian-festival": "border-l-4 border-l-fuchsia-400",
  "tpl-gaming": "border-l-4 border-l-lime-400",
  "tpl-podcast": "border-l-4 border-l-indigo-400",
  "tpl-movie-premiere": "border-l-4 border-l-red-500",
  "tpl-award-ceremony": "border-l-4 border-l-yellow-500",
  "tpl-comedy-show": "border-l-4 border-l-pink-400",
  "tpl-product-launch": "border-l-4 border-l-sky-400",
  "tpl-webinar": "border-l-4 border-l-blue-300",
  "tpl-auction": "border-l-4 border-l-amber-500",
  "tpl-real-estate": "border-l-4 border-l-teal-400",
  "tpl-baby-shower": "border-l-4 border-l-pink-300",
  "tpl-birthday-party": "border-l-4 border-l-fuchsia-500",
  "tpl-graduation": "border-l-4 border-l-emerald-300",
  "tpl-engagement": "border-l-4 border-l-pink-500",
  "tpl-anniversary": "border-l-4 border-l-rose-300",
  "tpl-reunion": "border-l-4 border-l-sky-300",
  "tpl-chinese-festival": "border-l-4 border-l-red-400",
  "tpl-christmas": "border-l-4 border-l-green-500",
  "tpl-eid": "border-l-4 border-l-emerald-500",
  "tpl-thanksgiving": "border-l-4 border-l-amber-600",
  "tpl-halloween": "border-l-4 border-l-orange-500",
  "tpl-fitness": "border-l-4 border-l-lime-500",
  "tpl-charity": "border-l-4 border-l-violet-300",
}

export function getTemplateCategoryAndName(templateId: string): { category: string; name: string } {
  // Direct mapping — keep template visuals independent of the event template registry
  if (templateId.includes("wedding")) return { category: "Wedding", name: "Wedding" }
  if (templateId.includes("corporate")) return { category: "Corporate", name: "Corporate" }
  if (templateId === "tpl-concert") return { category: "Entertainment", name: "Concert" }
  if (templateId === "tpl-christian") return { category: "Wedding", name: "Christian Wedding" }
  if (templateId === "tpl-muslim") return { category: "Wedding", name: "Muslim Wedding" }
  if (templateId === "tpl-hindu") return { category: "Religious", name: "Hindu Ceremony" }
  if (templateId === "tpl-sports") return { category: "Sports", name: "Sports Event" }
  if (templateId === "tpl-political") return { category: "Political", name: "Political Event" }
  if (templateId === "tpl-school") return { category: "Education", name: "School Event" }
  if (templateId === "tpl-funeral") return { category: "Memorial", name: "Memorial Service" }
  if (templateId === "tpl-gaming") return { category: "Entertainment", name: "Gaming/Esports" }
  if (templateId === "tpl-podcast") return { category: "Entertainment", name: "Podcast/Talk Show" }
  if (templateId === "tpl-webinar") return { category: "Business", name: "Webinar/Training" }
  
  return {
    category: "General",
    name: "Event",
  }
}

function trimField(s: string, max: number): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/**
 * Build headline + detail lines for watch banner from template_data + event fields.
 */
export function extractTemplateBannerContent(
  templateId: string,
  data: Record<string, string | undefined>,
  eventTitle: string,
  eventDescription: string,
): { headline: string; accent: string | null; lines: string[] } {
  const { category } = getTemplateCategoryAndName(templateId)
  const d = data

  const pushUnique = (arr: string[], v: string | undefined | null) => {
    const s = v?.trim()
    if (!s) return
    if (!arr.includes(s)) arr.push(s)
  }

  // --- High-signal template-specific layouts ---
  if (
    templateId === "tpl-wedding" ||
    templateId === "tpl-wedding-garden" ||
    templateId === "tpl-wedding-midnight" ||
    templateId === "tpl-wedding-coastal" ||
    templateId === "tpl-wedding-celestial" ||
    templateId === "tpl-wedding-traditional-hindu" ||
    templateId === "tpl-christian-wedding-rose" ||
    templateId === "tpl-muslim-wedding-nikah"
  ) {
    const couple = [d.brideName, d.groomName].filter(Boolean).join(" & ")
    const lines: string[] = []
    pushUnique(lines, d.venueName)
    pushUnique(lines, d.familyNames)
    pushUnique(lines, d.customMessage)
    pushUnique(lines, eventDescription)
    return {
      headline: couple || eventTitle,
      accent: eventTitle && couple ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-engagement") {
    const couple = [d.partnerOneName, d.partnerTwoName].filter(Boolean).join(" & ")
    const lines: string[] = []
    pushUnique(lines, d.venueName)
    pushUnique(lines, d.saveTheDateMessage || eventDescription)
    return {
      headline: couple || eventTitle,
      accent: eventTitle && couple ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-anniversary") {
    const couple = [d.partnerOneName, d.partnerTwoName].filter(Boolean).join(" & ")
    const y = d.yearsCount ? `${d.yearsCount} years` : ""
    const lines: string[] = []
    if (y) pushUnique(lines, y)
    pushUnique(lines, d.celebrationMessage)
    pushUnique(lines, eventDescription)
    return {
      headline: couple || eventTitle,
      accent: eventTitle && couple ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-sports" && (d.homeTeam || d.awayTeam)) {
    const match = [d.homeTeam, d.awayTeam].filter(Boolean).join(" vs ")
    const lines: string[] = []
    pushUnique(lines, d.leagueName)
    pushUnique(lines, d.venueName)
    pushUnique(lines, d.sportType ? `Sport: ${d.sportType}` : undefined)
    pushUnique(lines, eventDescription)
    return { headline: match || eventTitle, accent: eventTitle !== match ? eventTitle : null, lines }
  }

  if (templateId === "tpl-corporate" || templateId === "tpl-corporate-tech-forward") {
    const lines: string[] = []
    pushUnique(lines, d.companyName)
    const speaker = [d.speakerName, d.speakerTitle].filter(Boolean).join(" · ")
    pushUnique(lines, speaker)
    pushUnique(lines, d.companyTagline)
    pushUnique(lines, d.eventTagline)
    pushUnique(lines, eventDescription)
    return {
      headline: eventTitle,
      accent: d.companyName || null,
      lines,
    }
  }

  if (templateId === "tpl-webinar") {
    const lines: string[] = []
    pushUnique(lines, d.topicTitle)
    const speaker = [d.speakerName, d.speakerTitle].filter(Boolean).join(" · ")
    pushUnique(lines, speaker)
    pushUnique(lines, d.companyName)
    pushUnique(lines, d.webinarDescription || eventDescription)
    return {
      headline: eventTitle,
      accent: d.topicTitle || null,
      lines: lines.filter(Boolean),
    }
  }

  if (templateId === "tpl-funeral") {
    const lines: string[] = []
    pushUnique(lines, d.memorialTagline)
    pushUnique(lines, d.memorialQuote)
    pushUnique(lines, d.memorialVenueDetails)
    pushUnique(lines, d.familyName)
    pushUnique(lines, d.tributeMessage || d.welcomeMessage)
    pushUnique(lines, eventDescription)
    return {
      headline: d.deceasedName || eventTitle,
      accent: (d.memorialHeadline as string | undefined)?.trim() || null,
      lines,
    }
  }

  if (templateId === "tpl-concert") {
    const lines: string[] = []
    pushUnique(lines, d.venueName)
    pushUnique(lines, d.tourName)
    pushUnique(lines, d.openingAct ? `Opening: ${d.openingAct}` : undefined)
    pushUnique(lines, d.concertMessage || eventDescription)
    return {
      headline: d.artistName || eventTitle,
      accent: d.artistName ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-baby-shower") {
    const lines: string[] = []
    pushUnique(lines, d.parentNames)
    pushUnique(lines, d.babyName ? `Baby: ${d.babyName}` : undefined)
    pushUnique(lines, d.themeMessage)
    pushUnique(lines, eventDescription)
    return {
      headline: eventTitle,
      accent: d.parentNames || null,
      lines,
    }
  }

  if (templateId === "tpl-birthday-party") {
    const lines: string[] = []
    pushUnique(lines, d.partyTagline)
    pushUnique(lines, d.birthdayAge != null && String(d.birthdayAge).trim() !== "" ? `Turning ${String(d.birthdayAge).trim()}` : undefined)
    pushUnique(lines, eventDescription)
    return {
      headline: d.honoreeName?.trim() || eventTitle,
      accent: d.partyHeadline?.trim() || null,
      lines,
    }
  }

  if (templateId === "tpl-graduation") {
    const lines: string[] = []
    pushUnique(lines, [d.degree, d.institution].filter(Boolean).join(" · "))
    pushUnique(lines, d.graduationYear ? `Class of ${d.graduationYear}` : undefined)
    pushUnique(lines, d.congratsMessage || eventDescription)
    return {
      headline: d.graduateName || eventTitle,
      accent: d.graduateName ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-reunion") {
    const lines: string[] = []
    pushUnique(lines, d.reunionName)
    pushUnique(lines, d.reunionYear)
    pushUnique(lines, d.location)
    pushUnique(lines, d.welcomeMessage || eventDescription)
    return {
      headline: d.reunionName || eventTitle,
      accent: d.reunionName && d.reunionName !== eventTitle ? eventTitle : null,
      lines,
    }
  }

  if (templateId === "tpl-product-launch") {
    const lines: string[] = []
    pushUnique(lines, d.companyName)
    pushUnique(lines, d.productName)
    pushUnique(lines, d.productTagline)
    pushUnique(lines, d.launchMessage || eventDescription)
    return { headline: eventTitle, accent: d.productName || null, lines }
  }

  if (templateId === "tpl-gaming") {
    const lines: string[] = []
    pushUnique(lines, d.gamerTag)
    pushUnique(lines, d.gameTitle)
    pushUnique(lines, d.tournamentName)
    pushUnique(lines, d.streamMessage || eventDescription)
    return { headline: eventTitle, accent: d.gameTitle || d.gamerTag || null, lines }
  }

  if (templateId === "tpl-podcast") {
    const lines: string[] = []
    pushUnique(lines, d.podcastName)
    pushUnique(lines, d.hostName ? `Host: ${d.hostName}` : undefined)
    pushUnique(lines, d.episodeTitle)
    pushUnique(lines, d.guestName ? `Guest: ${d.guestName}` : undefined)
    pushUnique(lines, d.episodeDescription || eventDescription)
    return { headline: eventTitle, accent: d.episodeTitle || d.podcastName || null, lines }
  }

  if (templateId === "tpl-movie-premiere") {
    const lines: string[] = []
    pushUnique(lines, d.movieTitle)
    pushUnique(lines, [d.directorName, d.studioName].filter(Boolean).join(" · "))
    pushUnique(lines, d.movieTagline)
    pushUnique(lines, d.castList)
    pushUnique(lines, eventDescription)
    return { headline: eventTitle, accent: d.movieTitle || null, lines }
  }

  if (templateId === "tpl-award-ceremony") {
    const lines: string[] = []
    pushUnique(lines, d.organizationName)
    pushUnique(lines, d.awardName)
    pushUnique(lines, d.ceremonyYear ? `${d.ceremonyYear}` : undefined)
    pushUnique(lines, d.hostName ? `Host: ${d.hostName}` : undefined)
    pushUnique(lines, d.ceremonyTagline || eventDescription)
    return { headline: eventTitle, accent: d.awardName || null, lines }
  }

  if (templateId === "tpl-comedy-show") {
    const lines: string[] = []
    pushUnique(lines, d.comedianName)
    pushUnique(lines, d.showTitle)
    pushUnique(lines, d.venueName)
    pushUnique(lines, d.showTagline || eventDescription)
    return { headline: eventTitle, accent: d.comedianName || null, lines }
  }

  if (templateId === "tpl-auction") {
    const lines: string[] = []
    pushUnique(lines, d.auctionHouseName)
    pushUnique(lines, d.auctionTitle)
    pushUnique(lines, d.auctioneerName ? `Auctioneer: ${d.auctioneerName}` : undefined)
    pushUnique(lines, d.auctionDescription || eventDescription)
    return { headline: eventTitle, accent: d.auctionTitle || null, lines }
  }

  if (templateId === "tpl-real-estate") {
    const lines: string[] = []
    pushUnique(lines, d.agencyName)
    pushUnique(lines, d.agentName ? `Agent: ${d.agentName}` : undefined)
    pushUnique(lines, d.propertyAddress)
    pushUnique(lines, d.propertyPrice)
    pushUnique(lines, d.propertyFeatures || eventDescription)
    return { headline: eventTitle, accent: d.propertyAddress?.split("\n")[0] || null, lines }
  }

  if (templateId === "tpl-political") {
    const lines: string[] = []
    pushUnique(lines, d.candidateName)
    pushUnique(lines, d.partyName)
    pushUnique(lines, d.campaignSlogan)
    pushUnique(lines, d.eventLocation)
    pushUnique(lines, eventDescription)
    return { headline: eventTitle, accent: d.candidateName || null, lines }
  }

  if (templateId === "tpl-school") {
    const lines: string[] = []
    pushUnique(lines, d.schoolName)
    pushUnique(lines, d.principalName)
    pushUnique(lines, d.classGrade)
    pushUnique(lines, d.eventMessage || eventDescription)
    return { headline: eventTitle, accent: d.schoolName || null, lines }
  }

  if (templateId === "tpl-charity") {
    const lines: string[] = []
    pushUnique(lines, d.organizationName)
    pushUnique(lines, d.causeName)
    pushUnique(lines, d.goalAmount ? `Goal: ${d.goalAmount}` : undefined)
    pushUnique(lines, d.beneficiary)
    pushUnique(lines, d.causeDescription || eventDescription)
    return { headline: eventTitle, accent: d.causeName || null, lines }
  }

  if (templateId === "tpl-fitness") {
    const lines: string[] = []
    pushUnique(lines, d.instructorName)
    pushUnique(lines, d.classType ? `Class: ${d.classType}` : undefined)
    pushUnique(lines, d.studioName)
    pushUnique(lines, [d.classDuration, d.difficultyLevel].filter(Boolean).join(" · "))
    pushUnique(lines, eventDescription)
    return { headline: eventTitle, accent: d.instructorName || null, lines }
  }

  // Religious & cultural: shared patterns
  if (templateId === "tpl-christian") {
    const lines: string[] = []
    pushUnique(lines, d.churchName)
    pushUnique(lines, d.pastorName)
    pushUnique(lines, d.ceremonyType ? `Service: ${d.ceremonyType}` : undefined)
    pushUnique(lines, d.scriptureReference)
    pushUnique(lines, d.serviceMessage || eventDescription)
    return { headline: eventTitle, accent: d.churchName || null, lines }
  }

  if (templateId === "tpl-muslim") {
    const lines: string[] = []
    pushUnique(lines, d.mosqueName)
    pushUnique(lines, d.imamName)
    pushUnique(lines, d.ceremonyType ? `Gathering: ${d.ceremonyType}` : undefined)
    pushUnique(lines, d.greetingMessage)
    pushUnique(lines, d.duaText || eventDescription)
    return { headline: eventTitle, accent: d.mosqueName || null, lines }
  }

  if (templateId === "tpl-hindu") {
    const lines: string[] = []
    pushUnique(lines, d.templeName)
    pushUnique(lines, d.panditName)
    pushUnique(lines, d.ceremonyType ? `Ceremony: ${d.ceremonyType}` : undefined)
    pushUnique(lines, d.muhuratTime ? `Muhurat: ${d.muhuratTime}` : undefined)
    pushUnique(lines, d.mantraText || eventDescription)
    return { headline: eventTitle, accent: d.templeName || null, lines }
  }

  if (templateId === "tpl-indian-festival") {
    const lines: string[] = []
    pushUnique(lines, d.customFestivalName || d.festivalName)
    pushUnique(lines, d.hostFamilyName)
    pushUnique(lines, d.festivalGreeting || eventDescription)
    return { headline: eventTitle, accent: d.festivalName || d.customFestivalName || null, lines }
  }

  if (templateId === "tpl-chinese-festival") {
    const lines: string[] = []
    pushUnique(lines, d.festivalName)
    pushUnique(lines, d.zodiacYear)
    pushUnique(lines, d.hostFamilyName)
    pushUnique(lines, d.festivalGreeting || eventDescription)
    return { headline: eventTitle, accent: d.festivalName || null, lines }
  }

  if (templateId === "tpl-christmas") {
    const lines: string[] = []
    pushUnique(lines, d.hostName)
    pushUnique(lines, d.churchName)
    pushUnique(lines, d.eventType ? `Type: ${d.eventType}` : undefined)
    pushUnique(lines, d.christmasMessage || eventDescription)
    return { headline: eventTitle, accent: d.hostName || null, lines }
  }

  if (templateId === "tpl-eid") {
    const lines: string[] = []
    pushUnique(lines, d.hostFamilyName)
    pushUnique(lines, d.mosqueName)
    pushUnique(lines, d.eidType ? `${d.eidType}` : undefined)
    pushUnique(lines, d.eidGreeting || eventDescription)
    return { headline: eventTitle, accent: d.hostFamilyName || null, lines }
  }

  if (templateId === "tpl-thanksgiving") {
    const lines: string[] = []
    pushUnique(lines, d.hostFamilyName)
    pushUnique(lines, d.location)
    pushUnique(lines, d.thanksgivingMessage || eventDescription)
    return { headline: eventTitle, accent: d.hostFamilyName || null, lines }
  }

  if (templateId === "tpl-halloween") {
    const lines: string[] = []
    pushUnique(lines, d.eventName)
    pushUnique(lines, d.hostName)
    pushUnique(lines, d.partyTheme)
    pushUnique(lines, d.spookyTagline || eventDescription)
    return { headline: eventTitle, accent: d.eventName || null, lines }
  }

  // Default & fallback: scan field definitions for filled values
  const groups = getTemplateFields(templateId, category)
  const collected: string[] = []
  for (const g of groups) {
    for (const f of g.fields) {
      if (f.type === "image") continue
      const raw = d[f.key]
      if (raw == null || String(raw).trim() === "") continue
      const val = String(raw).trim()
      if (f.type === "textarea") {
        collected.push(trimField(`${f.label}: ${val}`, 160))
      } else {
        collected.push(trimField(val.length > 60 ? `${f.label}: ${val}` : val, 120))
      }
    }
  }

  const headline = eventTitle || collected[0] || "Live event"
  const lines: string[] = []
  for (const c of collected) {
    pushUnique(lines, c)
    if (lines.length >= 4) break
  }
  pushUnique(lines, eventDescription)
  return {
    headline,
    accent: collected[0] && collected[0] !== eventTitle ? collected[0] : null,
    lines: lines.filter((l) => l !== headline).slice(0, 5),
  }
}

export function getCardGradientForCategory(category: string): string {
  return TEMPLATE_CATEGORY_CARD_GRADIENTS[category] ?? "from-muted to-muted/60"
}

export function getBannerThemeForCategory(category: string) {
  return TEMPLATE_CATEGORY_BANNER_THEME[category] ?? TEMPLATE_CATEGORY_BANNER_THEME.General
}

export function getBannerAccentBorder(templateId: string): string {
  return TEMPLATE_BANNER_ACCENT_BORDER[templateId] ?? "border-l-4 border-l-primary"
}
