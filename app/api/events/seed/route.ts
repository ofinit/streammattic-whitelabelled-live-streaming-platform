import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { eventFormSelectableTemplates } from "@/lib/mock-data"

function generateStreamKey() {
  return `sk_mock_${Math.random().toString(36).substring(2, 18)}`
}

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")   // Replace & with 'and'
    .replace(/\//g, "-")      // Replace / with -
    .replace(/[-\s]+/g, "-")  // Replace spaces and dashes with a single dash
    .replace(/[^\w-]+/g, "")  // Remove all remaining non-word chars except dashes
    .replace(/--+/g, "-")     // Final pass to collapse multiple dashes
    .replace(/^-+|-+$/g, "")  // Remove leading/trailing dashes
}

const CATEGORY_SAMPLE_DATA: Record<string, any> = {
  Wedding: {
    brideName: "Sophia",
    groomName: "James",
    venueName: "Royal Garden Estates",
    familyNames: "The Andersons & The Smiths",
    customMessage: "Thank you for joining our special day!",
  },
  Corporate: {
    companyName: "TechFlow Systems",
    speakerName: "Dr. Elena Vance",
    speakerTitle: "Chief Innovation Officer",
    eventTagline: "Future of Decentralized AI",
  },
  Entertainment: {
    artistName: "The Midnight Echoes",
    venueName: "Neon Blue Lounge",
    tourName: "Acoustic Journeys Tour",
  },
  Health: {
    instructorName: "Maya Rivers",
    sessionType: "Vinyasa Flow",
    studioName: "Inner Peace Studio",
    sessionDuration: "60 mins",
    level: "All Levels",
  },
  Education: {
    schoolName: "Evergreen Academy",
    graduationClass: "2025",
    speakerName: "Prof. Arthur Miller",
  },
  Business: {
    productName: "Quantum Streamer X",
    companyName: "Innovate Labs",
    priceRange: "Premium",
  },
  Celebration: {
    hostName: "The Roberts Family",
    celebrationType: "Annual Gala",
    venueName: "Ballroom",
  },
  Memorial: {
    deceasedName: "Robert Winston",
    dateOfBirth: "1945-05-12",
    dateOfPassing: "2024-11-20",
    serviceLocation: "Grace Memorial Chapel",
  },
  Cultural: {
    festivalName: "Spring Harmony Festival",
    traditionOrigin: "Eastern Heritage",
    performanceType: "Traditional Dance",
  },
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    // Only streamers are allowed to seed mock data
    if (user.role !== "streamer") {
      return NextResponse.json({ error: "Only streamer accounts can seed mock data" }, { status: 403 })
    }

    const sql = getDb()

    // Ensure is_mock column exists
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false`.catch(() => {})

    const rtmpUrl = process.env.RTMP_SERVER_URL || "rtmp://stream.streamlivee.com/live"

    const createdEvents = []

    // Seed an event for every selectable template (exactly 12)
    for (const template of eventFormSelectableTemplates) {
      if (!template.isActive) continue

      const streamKey = generateStreamKey()
      // Robust slug generation
      const baseSlug = slugify(template.name === "Default" ? `Mock ${template.category} Event` : template.name)
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`
      
      const sampleData = CATEGORY_SAMPLE_DATA[template.category] || {
        hostName: "Platform User",
        location: "Virtual Studio",
        message: "Welcome to this live stream!",
      }

      const templateDataJson = JSON.stringify({
        ...sampleData,
        templateId: template.id,
        category: template.category,
      })

      const description = `This is a mock event using the ${template.name} template (${template.category}). Preview all interactive features like live chat and reactions.`

      const rows = await sql`
        INSERT INTO events (
          user_id, title, description, stream_type, stream_key, rtmp_url,
          status, scheduled_at, is_mock, slug, template_data,
          allow_chat, allow_reactions, template_id
        ) VALUES (
          ${user.id}, ${template.name === "Default" ? `Mock ${template.category} Stream` : template.name}, 
          ${description}, 'rtmp', ${streamKey},
          ${rtmpUrl},
          'scheduled', NOW() + INTERVAL '1 day', true, ${slug}, ${templateDataJson}::jsonb,
          true, true, ${template.id}
        )
        RETURNING *
      `
      createdEvents.push(toCamel(rows[0] as Record<string, unknown>))
    }

    return NextResponse.json({ 
      events: createdEvents, 
      count: createdEvents.length,
      message: `Successfully seeded ${createdEvents.length} templates` 
    })
  } catch (error) {
    console.error("[api/events/seed POST] Error:", error)
    return NextResponse.json({ error: "Failed to seed mock data" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Only streamers are allowed to clear mock data
    if (user.role !== "streamer") {
      return NextResponse.json({ error: "Only streamer accounts can manage mock data" }, { status: 403 })
    }

    const sql = getDb()
    
    // Ensure is_mock column exists before attempting to delete (prevents errors if it doesn't exist yet)
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN DEFAULT false`.catch(() => {})
    // Ensure mock_data_cleared column exists on users
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS mock_data_cleared BOOLEAN DEFAULT false`.catch(() => {})

    const res = await sql`
      DELETE FROM events 
      WHERE user_id = ${user.id} AND is_mock = true
      RETURNING id
    `

    // Mark that the user has cleared mock data so we don't show the seeding option again
    await sql`UPDATE users SET mock_data_cleared = true WHERE id = ${user.id}`

    return NextResponse.json({ 
      deletedCount: res.length, 
      message: res.length > 0 ? "Mock data cleared" : "No mock data found to clear" 
    })
  } catch (error) {
    console.error("[api/events/seed DELETE] Error:", error)
    return NextResponse.json({ error: "Failed to clear mock data" }, { status: 500 })
  }
}
