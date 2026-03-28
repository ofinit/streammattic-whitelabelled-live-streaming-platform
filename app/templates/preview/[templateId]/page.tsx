"use client"

import { useState, useEffect, use } from "react";
import { mockEventTemplates } from "@/lib/mock-data"
import type { EventTemplate } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Radio, ArrowLeft } from "lucide-react"
import Link from "next/link"

// Existing templates
import { DefaultTemplate } from "@/components/templates/default-template"
import { WeddingTemplate } from "@/components/templates/wedding-template"
import { WeddingGardenTemplate } from "@/components/templates/wedding-garden-template"
import { WeddingMidnightTemplate } from "@/components/templates/wedding-midnight-template"
import { WeddingCoastalTemplate } from "@/components/templates/wedding-coastal-template"
import { WeddingCelestialTemplate } from "@/components/templates/wedding-celestial-template"
import { CorporateTemplate } from "@/components/templates/corporate-template"
import { CorporateTechForwardTemplate } from "@/components/templates/corporate-tech-forward-template"
import { ConcertTemplate } from "@/components/templates/concert-template"
import { ChristianTemplate } from "@/components/templates/christian-template"
import { MuslimTemplate } from "@/components/templates/muslim-template"
import { HinduTemplate } from "@/components/templates/hindu-template"
import { SportsTemplate } from "@/components/templates/sports-template"
import { PoliticalTemplate } from "@/components/templates/political-template"
import { SchoolTemplate } from "@/components/templates/school-template"
import { BirthdayTemplate } from "@/components/templates/birthday-template"
import { FuneralTemplate } from "@/components/templates/funeral-template"
import { IndianFestivalTemplate } from "@/components/templates/indian-festival-template"

import { GamingTemplate } from "@/components/templates/gaming-template"
import { PodcastTemplate } from "@/components/templates/podcast-template"
import { MoviePremiereTemplate } from "@/components/templates/movie-premiere-template"
import { AwardCeremonyTemplate } from "@/components/templates/award-ceremony-template"
import { ComedyShowTemplate } from "@/components/templates/comedy-show-template"

import { ProductLaunchTemplate } from "@/components/templates/product-launch-template"
import { WebinarTemplate } from "@/components/templates/webinar-template"
import { AuctionTemplate } from "@/components/templates/auction-template"
import { RealEstateTemplate } from "@/components/templates/real-estate-template"

import { BabyShowerTemplate } from "@/components/templates/baby-shower-template"
import { GraduationTemplate } from "@/components/templates/graduation-template"
import { EngagementTemplate } from "@/components/templates/engagement-template"
import { AnniversaryTemplate } from "@/components/templates/anniversary-template"
import { ReunionTemplate } from "@/components/templates/reunion-template"

import { ChineseFestivalTemplate } from "@/components/templates/chinese-festival-template"
import { ChristmasTemplate } from "@/components/templates/christmas-template"
import { EidTemplate } from "@/components/templates/eid-template"
import { ThanksgivingTemplate } from "@/components/templates/thanksgiving-template"
import { HalloweenTemplate } from "@/components/templates/halloween-template"

import { FitnessTemplate } from "@/components/templates/fitness-template"
import { YogaTemplate } from "@/components/templates/yoga-template"
import { CharityTemplate } from "@/components/templates/charity-template"

const templateContent: Record<string, { title: string; description: string }> = {
  // Existing templates
  "tpl-default": {
    title: "Live Stream Event",
    description: "Welcome to our live streaming event",
  },
  "tpl-wedding": {
    title: "Sarah & Michael's Wedding",
    description: "Join us to celebrate the union of two hearts",
  },
  "tpl-wedding-garden": {
    title: "Emma & James",
    description: "Join us among the gardens for our ceremony — live with family and friends near and far.",
  },
  "tpl-wedding-midnight": {
    title: "Alexander & Victoria",
    description: "Join us for a midnight celebration — live from the city skyline.",
  },
  "tpl-wedding-coastal": {
    title: "Luna & Marco",
    description: "Tying the knot by the sea — live with family and friends near and far.",
  },
  "tpl-wedding-celestial": {
    title: "Orion & Stella",
    description: "Written in the stars — join our live union beneath the night sky.",
  },
  "tpl-corporate-tech-forward": {
    title: "TechForward 2026 | Annual Innovation Summit",
    description:
      "Join 50,000+ innovators, developers, and visionaries for the premier tech event — live keynotes and Q&A.",
  },
  "tpl-corporate": {
    title: "Annual Tech Summit 2024",
    description: "Corporate keynote featuring industry leaders",
  },
  "tpl-concert": {
    title: "Summer Music Festival",
    description: "Live performances from top artists",
  },
  "tpl-christian": {
    title: "Sunday Morning Service",
    description: "Join us in worship and prayer",
  },
  "tpl-muslim": {
    title: "Jummah Prayer Service",
    description: "Peace and blessings upon you",
  },
  "tpl-hindu": {
    title: "Ganesh Chaturthi Puja",
    description: "Experience the sacred ceremony",
  },
  "tpl-sports": {
    title: "Championship Finals 2024",
    description: "Watch the action unfold live",
  },
  "tpl-political": {
    title: "Town Hall Address",
    description: "Live broadcast for citizens",
  },
  "tpl-school": {
    title: "Annual Day Celebration",
    description: "Celebrating our students",
  },
  "tpl-birthday": {
    title: "Happy Birthday Celebration",
    description: "Join us for a special celebration",
  },
  "tpl-funeral": {
    title: "Memorial Service",
    description: "Celebrating a life well lived",
  },
  "tpl-indian-festival": {
    title: "Diwali Celebration",
    description: "Experience the festival of lights",
  },
  "tpl-gaming": {
    title: "Championship Esports Finals",
    description: "Watch the ultimate gaming showdown",
  },
  "tpl-podcast": {
    title: "The Daily Talk Show",
    description: "Live conversations with interesting guests",
  },
  "tpl-movie-premiere": {
    title: "Midnight Horizon Premiere",
    description: "Exclusive first look at the blockbuster",
  },
  "tpl-award-ceremony": {
    title: "Excellence Awards 2024",
    description: "Celebrating outstanding achievements",
  },
  "tpl-comedy-show": {
    title: "Comedy Night Live",
    description: "Laugh out loud with top comedians",
  },
  "tpl-product-launch": {
    title: "Product X Launch Event",
    description: "Introducing our latest innovation",
  },
  "tpl-webinar": {
    title: "Digital Marketing Masterclass",
    description: "Learn from industry experts",
  },
  "tpl-auction": {
    title: "Fine Art Auction",
    description: "Rare collectibles and masterpieces",
  },
  "tpl-real-estate": {
    title: "Luxury Villa Tour",
    description: "Experience premium living spaces",
  },
  "tpl-baby-shower": {
    title: "Baby Johnson Shower",
    description: "Welcoming our little bundle of joy",
  },
  "tpl-graduation": {
    title: "Class of 2024 Graduation",
    description: "Celebrating academic excellence",
  },
  "tpl-engagement": {
    title: "Emma & James Engagement",
    description: "Celebrating our love story",
  },
  "tpl-anniversary": {
    title: "25th Silver Anniversary",
    description: "Celebrating 25 years of love",
  },
  "tpl-reunion": {
    title: "Class of 2004 Reunion",
    description: "Reconnecting after 20 years",
  },
  "tpl-chinese-festival": {
    title: "Lunar New Year Celebration",
    description: "Welcome the Year of the Dragon",
  },
  "tpl-christmas": {
    title: "Christmas Eve Service",
    description: "Celebrating the season of joy",
  },
  "tpl-eid": {
    title: "Eid al-Fitr Celebration",
    description: "Eid Mubarak to all",
  },
  "tpl-thanksgiving": {
    title: "Thanksgiving Gathering",
    description: "Grateful hearts come together",
  },
  "tpl-halloween": {
    title: "Halloween Spooktacular",
    description: "A frightfully fun celebration",
  },
  "tpl-fitness": {
    title: "HIIT Workout Live",
    description: "Get fit with our trainers",
  },
  "tpl-yoga": {
    title: "Morning Yoga Flow",
    description: "Find your inner peace",
  },
  "tpl-charity": {
    title: "Hope Foundation Fundraiser",
    description: "Together we make a difference",
  },
}

export default function TemplatePreviewPage(props: { params: Promise<{ templateId: string }> }) {
  const params = use(props.params);
  const [template, setTemplate] = useState<EventTemplate | null>(null)

  useEffect(() => {
    const foundTemplate = mockEventTemplates.find((t) => t.id === params.templateId)
    setTemplate(foundTemplate || null)
  }, [params.templateId])

  // Not found state
  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Radio className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Template Not Found</h1>
          <p className="text-muted-foreground">This template doesn't exist.</p>
          <Link href="/admin/events">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const content = templateContent[template.id] || {
    title: template.name,
    description: `Preview of ${template.name} template`,
  }

  switch (template.id) {
    // Existing templates
    case "tpl-default":
      return <DefaultTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-wedding":
      return <WeddingTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-wedding-garden":
      return <WeddingGardenTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-wedding-midnight":
      return <WeddingMidnightTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-wedding-coastal":
      return <WeddingCoastalTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-wedding-celestial":
      return <WeddingCelestialTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-corporate-tech-forward":
      return <CorporateTechForwardTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-corporate":
      return <CorporateTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-concert":
      return <ConcertTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-christian":
      return <ChristianTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-muslim":
      return <MuslimTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-hindu":
      return <HinduTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-sports":
      return <SportsTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-political":
      return <PoliticalTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-school":
      return <SchoolTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-birthday":
      return <BirthdayTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-funeral":
      return <FuneralTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-indian-festival":
      return <IndianFestivalTemplate eventTitle={content.title} eventDescription={content.description} />
    // Entertainment & Media templates
    case "tpl-gaming":
      return <GamingTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-podcast":
      return <PodcastTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-movie-premiere":
      return <MoviePremiereTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-award-ceremony":
      return <AwardCeremonyTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-comedy-show":
      return <ComedyShowTemplate eventTitle={content.title} eventDescription={content.description} />
    // Business & Professional templates
    case "tpl-product-launch":
      return <ProductLaunchTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-webinar":
      return <WebinarTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-auction":
      return <AuctionTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-real-estate":
      return <RealEstateTemplate eventTitle={content.title} eventDescription={content.description} />
    // Social & Community templates
    case "tpl-baby-shower":
      return <BabyShowerTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-graduation":
      return <GraduationTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-engagement":
      return <EngagementTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-anniversary":
      return <AnniversaryTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-reunion":
      return <ReunionTemplate eventTitle={content.title} eventDescription={content.description} />
    // Cultural & Regional templates
    case "tpl-chinese-festival":
      return <ChineseFestivalTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-christmas":
      return <ChristmasTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-eid":
      return <EidTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-thanksgiving":
      return <ThanksgivingTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-halloween":
      return <HalloweenTemplate eventTitle={content.title} eventDescription={content.description} />
    // Health & Wellness templates
    case "tpl-fitness":
      return <FitnessTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-yoga":
      return <YogaTemplate eventTitle={content.title} eventDescription={content.description} />
    case "tpl-charity":
      return <CharityTemplate eventTitle={content.title} eventDescription={content.description} />
    default:
      return <DefaultTemplate eventTitle={content.title} eventDescription={content.description} />
  }
}
