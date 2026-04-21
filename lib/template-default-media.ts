/**
 * Default hero/backdrop images when an event has no hero_image_url or template image upload.
 * - Classic wedding: remote Unsplash (reliable CDN).
 * - Ethereal Garden & Tech Forward: bundled assets in /public/templates (theme-matched; reliable offline).
 */

import { THE_HEART_DEFAULT_HERO_URL } from "@/lib/the-heart-template-assets"

export const TEMPLATE_DEFAULT_HERO_BACKDROP: Partial<Record<string, string>> = {
  "tpl-wedding":
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=80",
  /** Generated botanical / sage-cream garden hero; see `public/templates/ethereal-garden-hero.png` */
  "tpl-wedding-garden": "/templates/ethereal-garden-hero.png",
  /** Midnight Elegance — dark luxury / city night */
  "tpl-wedding-midnight":
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=2400&q=80",
  "tpl-wedding-coastal":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
  /** Celestial Dreams — night sky / Milky Way */
  "tpl-wedding-celestial":
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2400&q=80",
  /** Shubh Vivah — brass diyas / temple lamps (spiritual, prayer, ritual) */
  "tpl-wedding-traditional-hindu":
    "https://images.unsplash.com/photo-1771929712047-3e7022669175?auto=format&fit=crop&w=2400&q=80",
  /** The Heart — same hero as templates/Wedding Template 03/index.html (R2 CDN) */
  "tpl-wedding-the-heart": THE_HEART_DEFAULT_HERO_URL,
  /** Tech Forward Summit — dark grid + blue/cyan/neon orbs (matches watch skin `#0a0a0a` palette) */
  "tpl-corporate-tech-forward": "/templates/corporate-tech-forward-hero.svg",
  /** Classic corporate — same bundled hero as Tech Forward */
  "tpl-corporate": "/templates/corporate-tech-forward-hero.svg",
  /** Christian wedding / ceremony — church interior (reliable CDN; public JPG paths were missing) */
  "tpl-christian":
    "https://images.unsplash.com/photo-1519167758481-83f29da30471?auto=format&fit=crop&w=2400&q=80",
  /** Rose & faith animated Christian wedding — rings / soft romantic (optional hero overlay) */
  "tpl-christian-wedding-rose":
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2400&q=80",
  /** Muslim / Islamic wedding or ceremony */
  "tpl-muslim":
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2400&q=80",
  /** Nikah live stream — emerald & gold hero overlay */
  "tpl-muslim-wedding-nikah":
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2400&q=80",
  /**
   * Memorial — live hero is CSS gradient only (see memorial watch view).
   * Bundled SVG matches that look for template picker thumbnails / metadata fallbacks.
   */
  "tpl-funeral": "/templates/memorial-hero-default.svg",
  /** Birthday party bash — colorful cake / celebration */
  "tpl-birthday-party":
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2400&q=80",
  /** Default / General */
  "tpl-default":
    "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=2400&q=80",
  /** Music Concert */
  "tpl-concert":
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=2400&q=80",
  /** Hindu Ceremony */
  "tpl-hindu":
    "https://images.unsplash.com/photo-1603204077779-bed963ea7d0e?auto=format&fit=crop&w=2400&q=80",
  /** Sports Event */
  "tpl-sports":
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=2400&q=80",
  /** Political Event */
  "tpl-political":
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=2400&q=80",
  /** School / Education */
  "tpl-school":
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=2400&q=80",
  /** Indian Festival */
  "tpl-indian-festival":
    "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=2400&q=80",
  /** Gaming Event */
  "tpl-gaming":
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2400&q=80",
  /** Podcast */
  "tpl-podcast":
    "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=2400&q=80",
  /** Movie Premiere */
  "tpl-movie-premiere":
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=2400&q=80",
  /** Award Ceremony */
  "tpl-award-ceremony":
    "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2400&q=80",
  /** Comedy Show */
  "tpl-comedy-show":
    "https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&w=2400&q=80",
  /** Product Launch */
  "tpl-product-launch":
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2400&q=80",
  /** Webinar */
  "tpl-webinar":
    "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=2400&q=80",
  /** Auction */
  "tpl-auction":
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=2400&q=80",
  /** Real Estate */
  "tpl-real-estate":
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2400&q=80",
  /** Baby Shower */
  "tpl-baby-shower":
    "https://images.unsplash.com/photo-1535572290543-960a8046f5af?auto=format&fit=crop&w=2400&q=80",
  /** Graduation */
  "tpl-graduation":
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=2400&q=80",
  /** Engagement */
  "tpl-engagement":
    "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=2400&q=80",
  /** Anniversary */
  "tpl-anniversary":
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2400&q=80",
  /** Reunion */
  "tpl-reunion":
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=2400&q=80",
  /** Chinese Festival */
  "tpl-chinese-festival":
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=2400&q=80",
  /** Christmas */
  "tpl-christmas":
    "https://images.unsplash.com/photo-1511895426328-dc8714191011?auto=format&fit=crop&w=2400&q=80",
  /** Eid Celebration */
  "tpl-eid":
    "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?auto=format&fit=crop&w=2400&q=80",
  /** Thanksgiving */
  "tpl-thanksgiving":
    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=2400&q=80",
  /** Halloween */
  "tpl-halloween":
    "https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?auto=format&fit=crop&w=2400&q=80",
  /** Fitness */
  "tpl-fitness":
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=2400&q=80",
  /** Charity */
  "tpl-charity":
    "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=2400&q=80",
}

export function getDefaultTemplateHeroBackdropUrl(templateId: string): string | undefined {
  const url = TEMPLATE_DEFAULT_HERO_BACKDROP[templateId]
  return typeof url === "string" && url.length > 0 ? url : undefined
}
