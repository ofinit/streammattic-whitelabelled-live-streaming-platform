// Template Custom Field Types
export type TemplateFieldType = "text" | "textarea" | "image" | "date" | "time" | "number" | "select" | "color"

export interface TemplateField {
  key: string
  label: string
  type: TemplateFieldType
  placeholder?: string
  required?: boolean
  maxLength?: number
  options?: { value: string; label: string }[] // For select type
  helpText?: string
}

export interface TemplateFieldGroup {
  title: string
  fields: TemplateField[]
}

// Standard event media (player image, hero image, photo gallery, photographer logo & contact)
// are implemented as a shared block in the event form (Design tab) and stored on the event
// (hero_image_url, player_image_url, etc.), not in template_data. All templates use that
// same block plus the template-specific groups below.

// Template category to fields mapping
export const templateFieldDefinitions: Record<string, TemplateFieldGroup[]> = {
  // Default/General - Minimal fields
  default: [
    {
      title: "Event Information",
      fields: [
        { key: "hostName", label: "Host Name", type: "text", placeholder: "Enter host name" },
        {
          key: "welcomeMessage",
          label: "Welcome Message",
          type: "textarea",
          placeholder: "Welcome to our event!",
          maxLength: 200,
        },
      ],
    },
  ],

  // Wedding Template
  wedding: [
    {
      title: "Couple Details",
      fields: [
        { key: "brideName", label: "Bride Name", type: "text", placeholder: "Enter bride's name", required: true },
        { key: "groomName", label: "Groom Name", type: "text", placeholder: "Enter groom's name", required: true },
        { key: "couplePhoto", label: "Couple Photo", type: "image", helpText: "Upload a photo of the couple" },
      ],
    },
    {
      title: "Venue & Message",
      fields: [
        { key: "venueName", label: "Venue Name", type: "text", placeholder: "Grand Ballroom, Mumbai" },
        { key: "familyNames", label: "Family Names", type: "text", placeholder: "The Smith & Johnson Families" },
        {
          key: "customMessage",
          label: "Custom Message",
          type: "textarea",
          placeholder: "Join us to celebrate our special day!",
          maxLength: 300,
        },
      ],
    },
  ],

  // Engagement Template
  engagement: [
    {
      title: "Couple Details",
      fields: [
        { key: "partnerOneName", label: "Partner 1 Name", type: "text", required: true },
        { key: "partnerTwoName", label: "Partner 2 Name", type: "text", required: true },
        { key: "couplePhoto", label: "Couple Photo", type: "image" },
      ],
    },
    {
      title: "Event Details",
      fields: [
        { key: "venueName", label: "Venue", type: "text" },
        { key: "saveTheDateMessage", label: "Save the Date Message", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Anniversary Template
  anniversary: [
    {
      title: "Couple Details",
      fields: [
        { key: "partnerOneName", label: "Partner 1 Name", type: "text", required: true },
        { key: "partnerTwoName", label: "Partner 2 Name", type: "text", required: true },
        { key: "yearsCount", label: "Years Celebrating", type: "number", placeholder: "25" },
        { key: "couplePhoto", label: "Couple Photo", type: "image" },
      ],
    },
    {
      title: "Message",
      fields: [{ key: "celebrationMessage", label: "Celebration Message", type: "textarea", maxLength: 300 }],
    },
  ],

  // Birthday party (animated bash)
  "birthday-party": [
    {
      title: "Birthday celebration",
      fields: [
        { key: "honoreeName", label: "Birthday name", type: "text", placeholder: "Sarah" },
        { key: "birthdayAge", label: "Age", type: "number", placeholder: "25" },
        {
          key: "partyHeadline",
          label: "Hero slogan",
          type: "text",
          placeholder: "We're getting married!",
        },
        {
          key: "partyTagline",
          label: "Party tagline (optional)",
          type: "textarea",
          placeholder: "Optional line under the age badge",
          maxLength: 200,
        },
      ],
    },
  ],

  // Baby Shower Template
  "baby-shower": [
    {
      title: "Parent Details",
      fields: [
        { key: "parentNames", label: "Parent Names", type: "text", placeholder: "Sarah & John", required: true },
        { key: "babyName", label: "Baby Name (if known)", type: "text", placeholder: "Baby Smith" },
        {
          key: "babyGender",
          label: "Baby Gender",
          type: "select",
          options: [
            { value: "boy", label: "Boy" },
            { value: "girl", label: "Girl" },
            { value: "surprise", label: "It's a Surprise!" },
          ],
        },
      ],
    },
    {
      title: "Event Details",
      fields: [
        { key: "themeMessage", label: "Theme/Message", type: "textarea", maxLength: 200 },
        { key: "registryLink", label: "Registry Link", type: "text", placeholder: "https://..." },
      ],
    },
  ],

  // Graduation Template
  graduation: [
    {
      title: "Graduate Details",
      fields: [
        { key: "graduateName", label: "Graduate Name", type: "text", required: true },
        { key: "graduatePhoto", label: "Graduate Photo", type: "image" },
        { key: "degree", label: "Degree/Diploma", type: "text", placeholder: "Bachelor of Science" },
        { key: "institution", label: "School/University", type: "text", required: true },
        { key: "graduationYear", label: "Year", type: "number", placeholder: "2024" },
      ],
    },
    {
      title: "Message",
      fields: [{ key: "congratsMessage", label: "Congratulations Message", type: "textarea", maxLength: 300 }],
    },
  ],

  // Funeral/Memorial Template
  funeral: [
    {
      title: "In Memory Of",
      fields: [
        { key: "deceasedName", label: "Name", type: "text", required: true },
        { key: "deceasedPhoto", label: "Photo", type: "image" },
        { key: "birthDate", label: "Date of Birth", type: "date" },
        { key: "passedDate", label: "Date of Passing", type: "date" },
      ],
    },
    {
      title: "Tribute",
      fields: [
        { key: "familyName", label: "Family Name", type: "text" },
        { key: "tributeMessage", label: "Tribute Message", type: "textarea", maxLength: 500 },
        { key: "inLieuOf", label: "In Lieu of Flowers", type: "textarea", placeholder: "Donations may be made to..." },
      ],
    },
    {
      title: "Memorial page copy",
      fields: [
        { key: "memorialHeadline", label: "Hero headline", type: "text", placeholder: "In Loving Memory" },
        { key: "memorialTagline", label: "Tagline", type: "textarea", maxLength: 200 },
        { key: "memorialQuote", label: "Quote", type: "textarea", maxLength: 400 },
        { key: "memorialVenueDetails", label: "Venue / address", type: "textarea", maxLength: 400 },
        { key: "dressCode", label: "Dress code", type: "textarea", maxLength: 200 },
        { key: "footerVerse", label: "Footer verse / note", type: "textarea", maxLength: 400 },
      ],
    },
  ],

  // Reunion Template
  reunion: [
    {
      title: "Reunion Details",
      fields: [
        {
          key: "reunionName",
          label: "Reunion Name",
          type: "text",
          placeholder: "Smith Family Reunion 2024",
          required: true,
        },
        {
          key: "reunionType",
          label: "Type",
          type: "select",
          options: [
            { value: "family", label: "Family Reunion" },
            { value: "class", label: "Class Reunion" },
            { value: "alumni", label: "Alumni Reunion" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "reunionYear", label: "Year/Class", type: "text", placeholder: "Class of 1994" },
      ],
    },
    {
      title: "Location & Message",
      fields: [
        { key: "location", label: "Location", type: "text" },
        { key: "welcomeMessage", label: "Welcome Message", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Christian Ceremony Template
  christian: [
    {
      title: "Church Details",
      fields: [
        { key: "churchName", label: "Church Name", type: "text", required: true },
        { key: "churchLogo", label: "Church Logo", type: "image" },
        { key: "pastorName", label: "Pastor/Priest Name", type: "text" },
      ],
    },
    {
      title: "Ceremony Details",
      fields: [
        {
          key: "ceremonyType",
          label: "Ceremony Type",
          type: "select",
          options: [
            { value: "sunday_service", label: "Sunday Service" },
            { value: "wedding", label: "Wedding Ceremony" },
            { value: "baptism", label: "Baptism" },
            { value: "funeral", label: "Funeral Service" },
            { value: "christmas", label: "Christmas Service" },
            { value: "easter", label: "Easter Service" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "scriptureReference", label: "Scripture Reference", type: "text", placeholder: "John 3:16" },
        { key: "serviceMessage", label: "Service Message", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Islamic Ceremony Template
  islamic: [
    {
      title: "Mosque Details",
      fields: [
        { key: "mosqueName", label: "Mosque Name", type: "text" },
        { key: "mosqueLogo", label: "Mosque Logo", type: "image" },
        { key: "imamName", label: "Imam Name", type: "text" },
      ],
    },
    {
      title: "Ceremony Details",
      fields: [
        {
          key: "ceremonyType",
          label: "Ceremony Type",
          type: "select",
          options: [
            { value: "nikah", label: "Nikah (Wedding)" },
            { value: "aqiqah", label: "Aqiqah" },
            { value: "janazah", label: "Janazah (Funeral)" },
            { value: "jummah", label: "Jummah Prayer" },
            { value: "eid", label: "Eid Prayer" },
            { value: "quran", label: "Quran Recitation" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "duaText", label: "Dua/Prayer Text", type: "textarea", maxLength: 300 },
        { key: "greetingMessage", label: "Greeting Message", type: "text" },
      ],
    },
  ],

  // Hindu Ceremony Template
  hindu: [
    {
      title: "Temple/Venue Details",
      fields: [
        { key: "templeName", label: "Temple/Venue Name", type: "text" },
        { key: "templeLogo", label: "Temple Logo", type: "image" },
        { key: "panditName", label: "Pandit/Priest Name", type: "text" },
      ],
    },
    {
      title: "Ceremony Details",
      fields: [
        {
          key: "ceremonyType",
          label: "Ceremony Type",
          type: "select",
          options: [
            { value: "puja", label: "Puja" },
            { value: "havan", label: "Havan/Homa" },
            { value: "wedding", label: "Vivah (Wedding)" },
            { value: "mundan", label: "Mundan" },
            { value: "satyanarayan", label: "Satyanarayan Katha" },
            { value: "griha_pravesh", label: "Griha Pravesh" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "muhuratTime", label: "Muhurat Time", type: "time" },
        { key: "mantraText", label: "Mantra/Shloka", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Indian Festival Template
  "indian-festival": [
    {
      title: "Festival Details",
      fields: [
        {
          key: "festivalName",
          label: "Festival Name",
          type: "select",
          options: [
            { value: "diwali", label: "Diwali" },
            { value: "holi", label: "Holi" },
            { value: "navratri", label: "Navratri" },
            { value: "ganesh_chaturthi", label: "Ganesh Chaturthi" },
            { value: "durga_puja", label: "Durga Puja" },
            { value: "onam", label: "Onam" },
            { value: "pongal", label: "Pongal" },
            { value: "raksha_bandhan", label: "Raksha Bandhan" },
            { value: "other", label: "Other" },
          ],
          required: true,
        },
        { key: "customFestivalName", label: "Custom Festival Name", type: "text", helpText: "If 'Other' selected" },
      ],
    },
    {
      title: "Host & Message",
      fields: [
        { key: "hostFamilyName", label: "Host Family Name", type: "text" },
        { key: "festivalGreeting", label: "Festival Greeting", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Chinese Festival Template
  "chinese-festival": [
    {
      title: "Festival Details",
      fields: [
        {
          key: "festivalName",
          label: "Festival Name",
          type: "select",
          options: [
            { value: "lunar_new_year", label: "Lunar New Year" },
            { value: "mid_autumn", label: "Mid-Autumn Festival" },
            { value: "dragon_boat", label: "Dragon Boat Festival" },
            { value: "lantern", label: "Lantern Festival" },
            { value: "qingming", label: "Qingming Festival" },
            { value: "other", label: "Other" },
          ],
          required: true,
        },
        { key: "zodiacYear", label: "Zodiac Year", type: "text", placeholder: "Year of the Dragon" },
      ],
    },
    {
      title: "Host & Message",
      fields: [
        { key: "hostFamilyName", label: "Host Family Name", type: "text" },
        { key: "festivalGreeting", label: "Festival Greeting", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Christmas Template
  christmas: [
    {
      title: "Host Details",
      fields: [
        { key: "hostName", label: "Host Name/Family", type: "text", required: true },
        { key: "churchName", label: "Church Name (if applicable)", type: "text" },
      ],
    },
    {
      title: "Event Details",
      fields: [
        {
          key: "eventType",
          label: "Event Type",
          type: "select",
          options: [
            { value: "christmas_eve", label: "Christmas Eve Service" },
            { value: "christmas_day", label: "Christmas Day Service" },
            { value: "carol_service", label: "Carol Service" },
            { value: "family_gathering", label: "Family Gathering" },
            { value: "party", label: "Christmas Party" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "christmasMessage", label: "Christmas Message", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Eid Template
  eid: [
    {
      title: "Host Details",
      fields: [
        { key: "hostFamilyName", label: "Host Family Name", type: "text", required: true },
        { key: "mosqueName", label: "Mosque Name (if applicable)", type: "text" },
      ],
    },
    {
      title: "Event Details",
      fields: [
        {
          key: "eidType",
          label: "Eid Type",
          type: "select",
          options: [
            { value: "eid_ul_fitr", label: "Eid ul-Fitr" },
            { value: "eid_ul_adha", label: "Eid ul-Adha" },
          ],
          required: true,
        },
        { key: "eidGreeting", label: "Eid Greeting", type: "textarea", maxLength: 200, placeholder: "Eid Mubarak!" },
      ],
    },
  ],

  // Thanksgiving Template
  thanksgiving: [
    {
      title: "Host Details",
      fields: [
        { key: "hostFamilyName", label: "Host Family Name", type: "text", required: true },
        { key: "location", label: "Location", type: "text" },
      ],
    },
    {
      title: "Message",
      fields: [{ key: "thanksgivingMessage", label: "Thanksgiving Message", type: "textarea", maxLength: 300 }],
    },
  ],

  // Halloween Template
  halloween: [
    {
      title: "Event Details",
      fields: [
        { key: "eventName", label: "Event Name", type: "text", required: true, placeholder: "Spooky Halloween Party" },
        { key: "hostName", label: "Host Name", type: "text" },
        { key: "partyTheme", label: "Party Theme", type: "text", placeholder: "Haunted House, Costume Party, etc." },
      ],
    },
    {
      title: "Spooky Message",
      fields: [
        {
          key: "spookyTagline",
          label: "Spooky Tagline",
          type: "textarea",
          maxLength: 150,
          placeholder: "Enter if you dare...",
        },
      ],
    },
  ],

  // Corporate Template
  corporate: [
    {
      title: "Company Details",
      fields: [
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "companyLogo", label: "Company Logo", type: "image" },
        { key: "companyTagline", label: "Company Tagline", type: "text", placeholder: "2026 Summit" },
        {
          key: "brandMark",
          label: "Brand mark (nav initials)",
          type: "text",
          maxLength: 4,
          placeholder: "TF",
        },
        {
          key: "heroLeadLine",
          label: "Hero headline — lead line (Tech Forward skin)",
          type: "text",
          placeholder: "THE FUTURE",
        },
        {
          key: "heroAccentLine",
          label: "Hero headline — gradient line",
          type: "text",
          placeholder: "IS NOW",
        },
      ],
    },
    {
      title: "Event Details",
      fields: [
        { key: "speakerName", label: "Speaker/Host Name", type: "text" },
        { key: "speakerTitle", label: "Speaker Title", type: "text", placeholder: "CEO, Director, etc." },
        { key: "eventTagline", label: "Event Tagline", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Webinar Template
  webinar: [
    {
      title: "Company Details",
      fields: [
        { key: "companyName", label: "Company/Organization Name", type: "text", required: true },
        { key: "companyLogo", label: "Logo", type: "image" },
      ],
    },
    {
      title: "Webinar Details",
      fields: [
        { key: "topicTitle", label: "Topic Title", type: "text", required: true },
        { key: "speakerName", label: "Speaker Name", type: "text", required: true },
        { key: "speakerTitle", label: "Speaker Title", type: "text" },
        { key: "speakerPhoto", label: "Speaker Photo", type: "image" },
        { key: "duration", label: "Duration", type: "text", placeholder: "60 minutes" },
        { key: "webinarDescription", label: "Description", type: "textarea", maxLength: 500 },
      ],
    },
  ],

  // Product Launch Template
  "product-launch": [
    {
      title: "Company Details",
      fields: [
        { key: "companyName", label: "Company Name", type: "text", required: true },
        { key: "companyLogo", label: "Company Logo", type: "image" },
      ],
    },
    {
      title: "Product Details",
      fields: [
        { key: "productName", label: "Product Name", type: "text", required: true },
        { key: "productImage", label: "Product Image", type: "image" },
        { key: "productTagline", label: "Product Tagline", type: "text" },
        { key: "launchMessage", label: "Launch Message", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Auction Template
  auction: [
    {
      title: "Auction House Details",
      fields: [
        { key: "auctionHouseName", label: "Auction House Name", type: "text", required: true },
        { key: "auctionLogo", label: "Logo", type: "image" },
        { key: "auctioneerName", label: "Auctioneer Name", type: "text" },
      ],
    },
    {
      title: "Auction Details",
      fields: [
        { key: "auctionTitle", label: "Auction Title", type: "text", required: true },
        { key: "auctionDescription", label: "Description", type: "textarea", maxLength: 300 },
        { key: "registrationLink", label: "Registration Link", type: "text" },
      ],
    },
  ],

  // Real Estate Template
  "real-estate": [
    {
      title: "Agency Details",
      fields: [
        { key: "agencyName", label: "Agency Name", type: "text", required: true },
        { key: "agencyLogo", label: "Agency Logo", type: "image" },
        { key: "agentName", label: "Agent Name", type: "text", required: true },
        { key: "agentPhone", label: "Agent Phone", type: "text" },
        { key: "agentPhoto", label: "Agent Photo", type: "image" },
      ],
    },
    {
      title: "Property Details",
      fields: [
        { key: "propertyAddress", label: "Property Address", type: "textarea", required: true },
        { key: "propertyPrice", label: "Property Price", type: "text" },
        { key: "propertyFeatures", label: "Key Features", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Gaming Template
  gaming: [
    {
      title: "Gamer Details",
      fields: [
        { key: "gamerTag", label: "Gamer Tag/Channel Name", type: "text", required: true },
        { key: "gamerAvatar", label: "Avatar/Logo", type: "image" },
      ],
    },
    {
      title: "Game Details",
      fields: [
        { key: "gameTitle", label: "Game Title", type: "text", required: true },
        { key: "tournamentName", label: "Tournament Name (if applicable)", type: "text" },
        { key: "streamMessage", label: "Stream Message", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Podcast Template
  podcast: [
    {
      title: "Podcast Details",
      fields: [
        { key: "podcastName", label: "Podcast Name", type: "text", required: true },
        { key: "podcastLogo", label: "Podcast Logo", type: "image" },
        { key: "hostName", label: "Host Name", type: "text", required: true },
        { key: "hostPhoto", label: "Host Photo", type: "image" },
      ],
    },
    {
      title: "Episode Details",
      fields: [
        { key: "episodeTitle", label: "Episode Title", type: "text" },
        { key: "episodeNumber", label: "Episode Number", type: "number" },
        { key: "guestName", label: "Guest Name (if any)", type: "text" },
        { key: "episodeDescription", label: "Episode Description", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Movie Premiere Template
  "movie-premiere": [
    {
      title: "Movie Details",
      fields: [
        { key: "movieTitle", label: "Movie Title", type: "text", required: true },
        { key: "moviePoster", label: "Movie Poster", type: "image" },
        { key: "directorName", label: "Director Name", type: "text" },
        { key: "studioName", label: "Studio Name", type: "text" },
      ],
    },
    {
      title: "Premiere Details",
      fields: [
        { key: "movieTagline", label: "Movie Tagline", type: "text" },
        { key: "castList", label: "Cast List", type: "textarea", maxLength: 300 },
      ],
    },
  ],

  // Award Ceremony Template
  "award-ceremony": [
    {
      title: "Award Details",
      fields: [
        { key: "awardName", label: "Award Name", type: "text", required: true },
        { key: "awardLogo", label: "Award Logo", type: "image" },
        { key: "organizationName", label: "Organization Name", type: "text", required: true },
        { key: "ceremonyYear", label: "Year", type: "number" },
      ],
    },
    {
      title: "Host Details",
      fields: [
        { key: "hostName", label: "Host Name", type: "text" },
        { key: "ceremonyTagline", label: "Ceremony Tagline", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Comedy Show Template
  "comedy-show": [
    {
      title: "Comedian Details",
      fields: [
        { key: "comedianName", label: "Comedian Name", type: "text", required: true },
        { key: "comedianPhoto", label: "Comedian Photo", type: "image" },
      ],
    },
    {
      title: "Show Details",
      fields: [
        { key: "showTitle", label: "Show Title", type: "text" },
        { key: "venueName", label: "Venue Name", type: "text" },
        { key: "showTagline", label: "Show Tagline", type: "textarea", maxLength: 150 },
      ],
    },
  ],

  // Concert Template
  concert: [
    {
      title: "Artist Details",
      fields: [
        { key: "artistName", label: "Artist/Band Name", type: "text", required: true },
        { key: "artistPhoto", label: "Artist Photo", type: "image" },
        { key: "tourName", label: "Tour Name", type: "text" },
      ],
    },
    {
      title: "Venue Details",
      fields: [
        { key: "venueName", label: "Venue Name", type: "text" },
        { key: "openingAct", label: "Opening Act (if any)", type: "text" },
        { key: "concertMessage", label: "Concert Message", type: "textarea", maxLength: 200 },
      ],
    },
  ],

  // Sports Template
  sports: [
    {
      title: "Teams",
      fields: [
        { key: "homeTeam", label: "Home Team", type: "text", required: true },
        { key: "homeTeamLogo", label: "Home Team Logo", type: "image" },
        { key: "awayTeam", label: "Away Team", type: "text", required: true },
        { key: "awayTeamLogo", label: "Away Team Logo", type: "image" },
      ],
    },
    {
      title: "Match Details",
      fields: [
        {
          key: "sportType",
          label: "Sport",
          type: "select",
          options: [
            { value: "cricket", label: "Cricket" },
            { value: "football", label: "Football" },
            { value: "basketball", label: "Basketball" },
            { value: "tennis", label: "Tennis" },
            { value: "hockey", label: "Hockey" },
            { value: "kabaddi", label: "Kabaddi" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "leagueName", label: "League/Tournament", type: "text" },
        { key: "venueName", label: "Venue", type: "text" },
      ],
    },
  ],

  // Fitness Template
  fitness: [
    {
      title: "Instructor Details",
      fields: [
        { key: "instructorName", label: "Instructor Name", type: "text", required: true },
        { key: "instructorPhoto", label: "Instructor Photo", type: "image" },
        { key: "certifications", label: "Certifications", type: "text" },
      ],
    },
    {
      title: "Class Details",
      fields: [
        {
          key: "classType",
          label: "Class Type",
          type: "select",
          options: [
            { value: "hiit", label: "HIIT" },
            { value: "strength", label: "Strength Training" },
            { value: "cardio", label: "Cardio" },
            { value: "zumba", label: "Zumba" },
            { value: "pilates", label: "Pilates" },
            { value: "crossfit", label: "CrossFit" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "studioName", label: "Studio/Gym Name", type: "text" },
        { key: "classDuration", label: "Duration", type: "text", placeholder: "45 minutes" },
        {
          key: "difficultyLevel",
          label: "Level",
          type: "select",
          options: [
            { value: "beginner", label: "Beginner" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
            { value: "all", label: "All Levels" },
          ],
        },
      ],
    },
  ],

  // Charity Template
  charity: [
    {
      title: "Organization Details",
      fields: [
        { key: "organizationName", label: "Organization Name", type: "text", required: true },
        { key: "organizationLogo", label: "Organization Logo", type: "image" },
      ],
    },
    {
      title: "Campaign Details",
      fields: [
        { key: "causeName", label: "Cause/Campaign Name", type: "text", required: true },
        { key: "goalAmount", label: "Goal Amount", type: "text", placeholder: "₹10,00,000" },
        { key: "beneficiary", label: "Beneficiary", type: "text" },
        { key: "donationLink", label: "Donation Link", type: "text" },
        { key: "causeDescription", label: "Cause Description", type: "textarea", maxLength: 400 },
      ],
    },
  ],

  // Political Template
  political: [
    {
      title: "Candidate/Party Details",
      fields: [
        { key: "candidateName", label: "Candidate/Leader Name", type: "text", required: true },
        { key: "candidatePhoto", label: "Candidate Photo", type: "image" },
        { key: "partyName", label: "Party Name", type: "text" },
        { key: "partyLogo", label: "Party Logo", type: "image" },
      ],
    },
    {
      title: "Event Details",
      fields: [
        { key: "campaignSlogan", label: "Campaign Slogan", type: "text" },
        {
          key: "eventType",
          label: "Event Type",
          type: "select",
          options: [
            { value: "rally", label: "Rally" },
            { value: "speech", label: "Speech" },
            { value: "debate", label: "Debate" },
            { value: "town_hall", label: "Town Hall" },
            { value: "press_conference", label: "Press Conference" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "eventLocation", label: "Location", type: "text" },
      ],
    },
  ],

  // School Template
  school: [
    {
      title: "School Details",
      fields: [
        { key: "schoolName", label: "School Name", type: "text", required: true },
        { key: "schoolLogo", label: "School Logo", type: "image" },
        { key: "principalName", label: "Principal/Host Name", type: "text" },
      ],
    },
    {
      title: "Event Details",
      fields: [
        {
          key: "eventType",
          label: "Event Type",
          type: "select",
          options: [
            { value: "annual_day", label: "Annual Day" },
            { value: "sports_day", label: "Sports Day" },
            { value: "graduation", label: "Graduation Ceremony" },
            { value: "concert", label: "School Concert" },
            { value: "parent_meeting", label: "Parent Meeting" },
            { value: "assembly", label: "Assembly" },
            { value: "competition", label: "Competition" },
            { value: "other", label: "Other" },
          ],
        },
        { key: "classGrade", label: "Class/Grade (if applicable)", type: "text" },
        { key: "eventMessage", label: "Event Message", type: "textarea", maxLength: 300 },
      ],
    },
  ],
}

/** Merge two field defs for the same key (e.g. select options from Christian + Islamic ceremonyType). */
function mergeTemplateFieldForUnified(existing: TemplateField, incoming: TemplateField): TemplateField {
  const base = { ...existing, required: false }
  if (base.type === "select" && incoming.type === "select") {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const o of [...(base.options ?? []), ...(incoming.options ?? [])]) {
      if (!seen.has(o.value)) {
        seen.add(o.value)
        opts.push(o)
      }
    }
    return { ...base, options: opts.length > 0 ? opts : base.options }
  }
  return base
}

/**
 * Single form for every template except Default: union of all non-default field defs (deduped by key).
 * Default (`tpl-default`) still uses only `templateFieldDefinitions.default` — unchanged.
 */
function buildMergedNonDefaultFieldGroups(): TemplateFieldGroup[] {
  const byKey = new Map<string, TemplateField>()
  for (const [defName, groups] of Object.entries(templateFieldDefinitions)) {
    if (defName === "default") continue
    for (const g of groups) {
      for (const f of g.fields) {
        const cur = byKey.get(f.key)
        if (!cur) {
          byKey.set(f.key, { ...f, required: false })
        } else {
          byKey.set(f.key, mergeTemplateFieldForUnified(cur, f))
        }
      }
    }
  }
  const sorted = [...byKey.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  )
  const chunkSize = 16
  const totalChunks = Math.max(1, Math.ceil(sorted.length / chunkSize))
  const out: TemplateFieldGroup[] = []
  for (let i = 0; i < sorted.length; i += chunkSize) {
    const slice = sorted.slice(i, i + chunkSize)
    const n = Math.floor(i / chunkSize) + 1
    out.push({
      title: totalChunks > 1 ? `Event details (${n} of ${totalChunks})` : "Event details",
      fields: slice,
    })
  }
  return out
}

let cachedMergedNonDefaultGroups: TemplateFieldGroup[] | null = null

export function getMergedNonDefaultTemplateFieldGroups(): TemplateFieldGroup[] {
  if (!cachedMergedNonDefaultGroups) {
    cachedMergedNonDefaultGroups = buildMergedNonDefaultFieldGroups()
  }
  return cachedMergedNonDefaultGroups
}

/**
 * Logical schema key: `default` only for tpl-default; everything else shares the merged field set.
 */
export function getTemplateFieldKey(templateId: string, _category: string): string {
  return templateId === "tpl-default" ? "default" : "unified"
}

// Get fields for a specific template
export function getTemplateFields(templateId: string, _category: string): TemplateFieldGroup[] {
  if (templateId === "tpl-default") {
    return templateFieldDefinitions.default
  }
  return getMergedNonDefaultTemplateFieldGroups()
}

// Validate template data
export function validateTemplateData(
  templateId: string,
  category: string,
  data: Record<string, unknown>,
): { isValid: boolean; errors: Record<string, string> } {
  const fieldGroups = getTemplateFields(templateId, category)
  const errors: Record<string, string> = {}

  for (const group of fieldGroups) {
    for (const field of group.fields) {
      if (field.required && !data[field.key]) {
        errors[field.key] = `${field.label} is required`
      }
      if (field.maxLength && typeof data[field.key] === "string") {
        const value = data[field.key] as string
        if (value.length > field.maxLength) {
          errors[field.key] = `${field.label} must be ${field.maxLength} characters or less`
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
