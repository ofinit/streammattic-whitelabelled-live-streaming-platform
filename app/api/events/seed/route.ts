import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"

function generateStreamKey() {
  return `sk_mock_${Math.random().toString(36).substring(2, 18)}`
}

const MOCK_EVENTS = [
  {
    title: "Enchanted Garden Wedding",
    category: "Wedding",
    templateId: "tpl-wedding-garden",
    description: "A beautiful mock wedding event in a lush garden setting. Experience the premium watch page with live chat and reactions.",
    streamType: "rtmp",
    templateData: {
      brideName: "Sophia",
      groomName: "James",
      venueName: "Royal Garden Estates",
      familyNames: "The Andersons & The Smiths",
      customMessage: "Thank you for joining our special day!",
    },
  },
  {
    title: "Global Tech Summit 2025",
    category: "Corporate",
    templateId: "tpl-corporate-tech-forward",
    description: "Preview the corporate template with professional speaker profiles and company branding.",
    streamType: "youtube_api",
    templateData: {
      companyName: "TechFlow Systems",
      speakerName: "Dr. Elena Vance",
      speakerTitle: "Chief Innovation Officer",
      eventTagline: "Future of Decentralized AI",
    },
  },
  {
    title: "Friday Night Live - Indie Session",
    category: "Entertainment",
    templateId: "tpl-concert",
    description: "See how the concert template highlights the artist and venue with a vibrant theme.",
    streamType: "rtmp",
    templateData: {
      artistName: "The Midnight Echoes",
      venueName: "Neon Blue Lounge",
      tourName: "Acoustic Journeys Tour",
    },
  },
  {
    title: "Morning Yoga & Mindfulness",
    category: "Health",
    templateId: "tpl-yoga",
    description: "A serene mock event showcasing the Health/Yoga template for wellness streams.",
    streamType: "rtmp",
    templateData: {
      instructorName: "Maya Rivers",
      sessionType: "Vinyasa Flow",
      studioName: "Inner Peace Studio",
      sessionDuration: "60 mins",
      level: "All Levels",
    },
  },
]

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

    for (const mock of MOCK_EVENTS) {
      const streamKey = generateStreamKey()
      const slug = `${mock.title.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substring(2, 7)}`
      
      const templateDataJson = JSON.stringify({
        ...mock.templateData,
        templateId: mock.templateId,
      })

      const rows = await sql`
        INSERT INTO events (
          user_id, title, description, stream_type, stream_key, rtmp_url,
          status, scheduled_at, is_mock, slug, template_data,
          allow_chat, allow_reactions
        ) VALUES (
          ${user.id}, ${mock.title}, ${mock.description}, ${mock.streamType}, ${streamKey},
          ${mock.streamType === "rtmp" ? rtmpUrl : null},
          'scheduled', NOW() + INTERVAL '1 day', true, ${slug}, ${templateDataJson}::jsonb,
          true, true
        )
        RETURNING *
      `
      createdEvents.push(toCamel(rows[0] as Record<string, unknown>))
    }

    return NextResponse.json({ events: createdEvents, message: "Mock data seeded successfully" })
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

    const res = await sql`
      DELETE FROM events 
      WHERE user_id = ${user.id} AND is_mock = true
      RETURNING id
    `

    return NextResponse.json({ 
      deletedCount: res.length, 
      message: res.length > 0 ? "Mock data cleared" : "No mock data found to clear" 
    })
  } catch (error) {
    console.error("[api/events/seed DELETE] Error:", error)
    return NextResponse.json({ error: "Failed to clear mock data" }, { status: 500 })
  }
}
