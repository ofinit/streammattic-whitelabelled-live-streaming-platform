import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

const imagePrompts = [
  // Event Type images
  {
    id: "evt-1-weddings",
    prompt: "Beautiful Indian wedding ceremony, vibrant decorations, mandap with flowers, warm golden lighting, professional photography, cinematic wide angle shot, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "evt-2-corporate",
    prompt: "Modern corporate event in a luxury conference hall, professional stage setup with screens, audience seated, blue and white lighting, professional event photography, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "evt-3-birthday",
    prompt: "Beautifully decorated birthday celebration, colorful balloons and cake, warm ambient lighting, joyful atmosphere, professional event photography, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "evt-4-private",
    prompt: "Elegant private ceremony, traditional Indian pooja setup, warm lights and flowers, intimate gathering, professional photography, cinematic, no text, no watermark",
    size: "landscape_16_9",
  },
  // Gallery images
  {
    id: "gal-1-sharma-wedding",
    prompt: "Stunning Indian wedding reception, bride and groom on stage, elaborate floral decorations, warm golden lighting, cinematic photography, no faces closeup, wide shot, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "gal-2-techcon",
    prompt: "Large technology conference on stage, modern LED screens, professional speaker presentation, audience in auditorium, blue and white lighting, corporate event photography, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "gal-3-birthday",
    prompt: "Colorful first birthday party decoration, themed party setup with balloons and banners, cake table, warm joyful lighting, event photography, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "gal-4-reception",
    prompt: "Grand Indian wedding reception hall, elaborate stage decoration with flowers, warm amber lighting, banquet tables, cinematic wide shot photography, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "gal-5-meetup",
    prompt: "Professional annual company meetup event, outdoor team gathering, branded stage setup, professional event photography, natural daylight, no text, no watermark",
    size: "landscape_16_9",
  },
  {
    id: "gal-6-housewarming",
    prompt: "Traditional Indian housewarming ceremony, pooja setup with flowers and lamps, warm intimate lighting, family gathering, professional photography, no text, no watermark",
    size: "landscape_16_9",
  },
  // About section image
  {
    id: "about-team",
    prompt: "Professional photography team at work, camera equipment setup at an event venue, behind the scenes of event photography, cinematic lighting, professional camera gear, no text, no watermark",
    size: "landscape_16_9",
  },
  // Hero background
  {
    id: "hero-bg",
    prompt: "Professional photographer capturing a beautiful Indian wedding ceremony, camera in foreground with blurred wedding scene behind, warm golden bokeh lights, cinematic depth of field, dark moody aesthetic, no text, no watermark",
    size: "landscape_16_9",
  },
]

async function generateImage(item) {
  console.log(`Generating: ${item.id}...`)
  try {
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: item.prompt,
        image_size: item.size,
        num_inference_steps: 4,
        num_images: 1,
      },
    })
    const url = result.images?.[0]?.url
    if (url) {
      console.log(`  OK: ${item.id} -> ${url}`)
      return { id: item.id, url }
    } else {
      console.log(`  FAIL: ${item.id} - no image returned`)
      return { id: item.id, url: null }
    }
  } catch (err) {
    console.log(`  ERROR: ${item.id} - ${err.message}`)
    return { id: item.id, url: null }
  }
}

async function main() {
  console.log(`Generating ${imagePrompts.length} images via Fal AI...\n`)
  
  // Generate images sequentially to avoid rate limits
  const results = []
  for (const item of imagePrompts) {
    const result = await generateImage(item)
    results.push(result)
  }

  console.log("\n=== RESULTS ===\n")
  console.log(JSON.stringify(results, null, 2))
  
  console.log("\n=== COPY THIS TO UPDATE MOCK DATA ===\n")
  
  const eventTypeUrls = results.filter(r => r.id.startsWith("evt-"))
  const galleryUrls = results.filter(r => r.id.startsWith("gal-"))
  const aboutUrl = results.find(r => r.id === "about-team")
  const heroUrl = results.find(r => r.id === "hero-bg")
  
  console.log("Event Types:")
  eventTypeUrls.forEach(r => console.log(`  ${r.id}: ${r.url}`))
  
  console.log("\nGallery:")
  galleryUrls.forEach(r => console.log(`  ${r.id}: ${r.url}`))
  
  console.log(`\nAbout: ${aboutUrl?.url}`)
  console.log(`Hero: ${heroUrl?.url}`)
}

main()
