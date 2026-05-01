/**
 * Streaming Provider Abstraction Layer
 *
 * Defines a common interface that all streaming backends must implement.
 * This allows swapping between Nimble Streamer ($50/mo), SRS (free),
 * Nginx-RTMP (free), and MediaMTX (free) without changing any UI or API route code.
 */

import type {
  NimbleStream,
  NimbleStreamStats,
  NimbleRecording,
  NimbleServerConfig,
  StreamPublishAuth,
  TranscodingProfile,
} from "@/lib/types"

// Re-export these types under generic names for provider use
export type Stream = NimbleStream
export type StreamStats = NimbleStreamStats
export type Recording = NimbleRecording
export type ServerConfig = NimbleServerConfig

export type StreamingBackendType = "nimble" | "srs" | "nginx_rtmp" | "mediamtx"

export interface StreamingBackendInfo {
  type: StreamingBackendType
  name: string
  description: string
  isFree: boolean
  cost: string
  website: string
  features: string[]
  defaultPorts: {
    rtmp: number
    http: number
    api: number
  }
  envVars: {
    apiUrl: string
    apiKey: string
    rtmpUrl: string
    playbackUrl: string
  }
  /** Default server config values for the settings form */
  defaultConfig: {
    name: string
    host: string
    rtmpPort: number
    httpPort: number
    apiKey: string
    rtmpBaseUrl: string
    playbackBaseUrl: string
  }
  /** Backend-specific help texts for settings form tooltips */
  helpTexts: {
    apiHost: string
    apiHostLink?: string
    apiHostLinkLabel?: string
    rtmpPort: string
    httpPort: string
    apiKey: string
    apiKeyLink?: string
    apiKeyLinkLabel?: string
    rtmpUrl: string
    rtmpUrlLink?: string
    rtmpUrlLinkLabel?: string
    playbackUrl: string
    playbackUrlLink?: string
    playbackUrlLinkLabel?: string
    hlsSegment: string
    transcoding: string
    transcodingLink?: string
    transcodingLinkLabel?: string
    streamAuth: string
    tokenAuth: string
    tokenAuthLink?: string
    tokenAuthLinkLabel?: string
    tokenSecret: string
    ipWhitelist: string
    geoRestriction: string
    geoRestrictionLink?: string
    geoRestrictionLinkLabel?: string
    storagePath: string
    testConnection: string
  }
  /** Features not supported by this backend (hidden in UI) */
  unsupportedFeatures?: string[]
}

export interface CreateStreamOptions {
  eventId: string
  eventTitle: string
  enableRecording?: boolean
  enableTranscoding?: boolean
  transcodingProfiles?: string[]
  publishAuth?: StreamPublishAuth
}

/**
 * Common interface that all streaming backends implement.
 * The factory in index.ts picks the right provider based on config.
 */
export interface StreamingProvider {
  readonly backendType: StreamingBackendType
  readonly backendName: string

  // Config
  getConfig(): {
    apiUrl: string
    apiKey: string
    rtmpUrl: string
    playbackUrl: string
  }

  // Stream lifecycle
  createStream(options: CreateStreamOptions): Promise<Stream>
  startStream(streamId: string, applicationName: string): Promise<Stream | null>
  stopStream(streamId: string, applicationName: string): Promise<Stream | null>

  // Status & stats
  getStreamStatus(applicationName: string): Promise<StreamStats | null>
  getServerHealth(): Promise<ServerConfig | null>

  // URL builders
  buildRtmpIngestUrl(applicationName: string): string
  buildHlsPlaybackUrl(applicationName: string, streamName: string): string
  buildDashPlaybackUrl(applicationName: string, streamName: string): string

  // Keys & auth
  generateStreamKey(prefix?: string): string
  generatePublishAuth(): StreamPublishAuth

  // Recordings
  getRecordings(applicationName: string): Promise<Recording[]>

  // Transcoding
  getDefaultTranscodingProfiles(): TranscodingProfile[]
}

/**
 * Metadata for each supported backend (for the admin UI selector)
 */
export const BACKEND_INFO: Record<StreamingBackendType, StreamingBackendInfo> = {
  nimble: {
    type: "nimble",
    name: "Nimble Streamer",
    description: "Full-featured commercial streaming server by Softvelum with WMSPanel cloud management.",
    isFree: false,
    cost: "$50/month per instance",
    website: "https://wmspanel.com/nimble",
    features: [
      "RTMP, SRT, WebRTC, NDI ingest",
      "HLS, MPEG-DASH, SLDP output",
      "WMSPanel cloud management",
      "Built-in transcoding",
      "DVR & recording",
      "Hotlink protection",
      "Geo-restriction",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 8082 },
    envVars: {
      apiUrl: "NIMBLE_API_URL",
      apiKey: "NIMBLE_API_KEY",
      rtmpUrl: "NIMBLE_RTMP_URL",
      playbackUrl: "NIMBLE_PLAYBACK_URL",
    },
    defaultConfig: {
      name: "Primary Nimble Server",
      host: "",
      rtmpPort: 1935,
      httpPort: 8082,
      apiKey: "",
      rtmpBaseUrl: "",
      playbackBaseUrl: "",
    },
    helpTexts: {
      apiHost: "The hostname or IP of your Nimble Streamer server. Find this in your server provider's dashboard (e.g., AWS EC2 Public IPv4, DigitalOcean Droplet IP, or your custom domain pointing to the server).",
      apiHostLink: "https://wmspanel.com/nimble/install",
      apiHostLinkLabel: "Installation Guide",
      rtmpPort: "Default RTMP port is 1935. Find or change this in Nimble Streamer Admin Panel > Global Settings > RTMP Interfaces. Only change if your server uses a non-standard port.",
      httpPort: "The management API port for Nimble Streamer. Default is 8082. Find this in /etc/nimble/nimble.conf under 'management_listen_interfaces'. Ensure this port is open in your firewall.",
      apiKey: "Your Nimble Streamer management API key. Generate this in Nimble Admin Panel > Global Settings > Management API > API Key. If using WMSPanel, find it at wmspanel.com > Account > API Keys.",
      apiKeyLink: "https://wmspanel.com/api",
      apiKeyLinkLabel: "WMSPanel API Docs",
      rtmpUrl: "The base URL encoders use to push RTMP streams. Format: rtmp://{your-server-ip}/live. The '/live' is the Nimble application name. Create applications in Nimble Admin > Live Streams > RTMP Applications.",
      rtmpUrlLink: "https://wmspanel.com/nimble/live",
      rtmpUrlLinkLabel: "RTMP Setup Guide",
      playbackUrl: "The base URL viewers use to watch streams via HLS/DASH. If using Nimble directly, this is your server's HTTP output address. If using a CDN (CloudFront, Cloudflare), use the CDN distribution URL.",
      playbackUrlLink: "https://wmspanel.com/nimble/cdn",
      playbackUrlLinkLabel: "CDN Setup Guide",
      hlsSegment: "Duration of each HLS segment. Default: 4s. Lower values (2s) reduce latency but increase server load. For low-latency, use 2s with Low Latency Mode enabled. Find in Nimble Admin > Live Streams > HLS Settings.",
      transcoding: "When ON, all new streams are automatically transcoded using the profiles below. Requires FFmpeg installed on the server. Check via SSH: 'ffmpeg -version'.",
      transcodingLink: "https://wmspanel.com/nimble/transcoding",
      transcodingLinkLabel: "Transcoding Guide",
      streamAuth: "When ON, publishers must provide valid credentials to push a stream. Prevents unauthorized streaming to your server. Configure in Nimble Admin > Live Streams > RTMP Authentication. Recommended: Always ON in production.",
      tokenAuth: "When ON, playback URLs require a signed token to prevent hotlinking. Nimble validates the token using the secret below. Configure in Nimble Admin > Security > Hotlink Protection.",
      tokenAuthLink: "https://wmspanel.com/nimble/security",
      tokenAuthLinkLabel: "Hotlink Protection Docs",
      tokenSecret: "A secret key used to sign playback tokens. Generate a strong random string (32+ chars). Must match the value in Nimble Admin > Security > Hotlink Protection > Secret Key. Generate via: openssl rand -hex 32",
      ipWhitelist: "When ON, only specific IP addresses can publish streams. Add your encoder/studio IPs. Find your IP at whatismyip.com. Configure in Nimble Admin > Security > IP Access Control.",
      geoRestriction: "When ON, restrict playback to specific countries. Uses GeoIP lookup on viewer IPs. Requires MaxMind GeoLite2 database. Configure in Nimble Admin > Security > Geo Restrictions.",
      geoRestrictionLink: "https://dev.maxmind.com/geoip/geolite2-free-geolocation-data",
      geoRestrictionLinkLabel: "MaxMind GeoIP Setup",
      storagePath: "Server directory where recordings are saved. This is a path ON THE NIMBLE SERVER, not your local machine. Ensure it exists and Nimble has write permission: 'mkdir -p /recordings && chown nimble:nimble /recordings'.",
      testConnection: "Nimble Streamer server is reachable and responding",
    },
  },
  srs: {
    type: "srs",
    name: "SRS (Simple Realtime Server)",
    description: "Free, open-source, high-performance streaming server. Supports RTMP, HLS, WebRTC, SRT, and GB28181.",
    isFree: true,
    cost: "Free (open-source, MIT license)",
    website: "https://ossrs.io",
    features: [
      "RTMP, SRT, WebRTC ingest",
      "HLS, HTTP-FLV, WebRTC output",
      "Built-in HTTP API",
      "DVR recording",
      "Edge cluster support",
      "Docker-ready deployment",
      "Active community & docs",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 1985 },
    envVars: {
      apiUrl: "SRS_API_URL",
      apiKey: "SRS_API_KEY",
      rtmpUrl: "SRS_RTMP_URL",
      playbackUrl: "SRS_PLAYBACK_URL",
    },
    defaultConfig: {
      name: "Primary SRS Server",
      host: "",
      rtmpPort: 1935,
      httpPort: 1985,
      apiKey: "",
      rtmpBaseUrl: "",
      playbackBaseUrl: "",
    },
    helpTexts: {
      apiHost: "The hostname or HTTPS API base URL for your SRS server. If the HTTP API is proxied through Nginx, enter the host and leave the API port empty to use https://{host}/api.",
      apiHostLink: "https://ossrs.io/lts/en-us/docs/v5/doc/getting-started",
      apiHostLinkLabel: "SRS Getting Started",
      rtmpPort: "Default RTMP port is 1935. Change in srs.conf under 'listen'. Only modify if you run multiple instances or have port conflicts.",
      httpPort: "SRS HTTP API port. Default is 1985 for direct access. Leave empty when the API is proxied through HTTPS, for example https://rtmplive.in/api.",
      apiKey: "SRS does not require an API key by default. If you've configured HTTP API authentication via 'http_api { auth }' in srs.conf, enter the token here. Otherwise, leave empty.",
      rtmpUrl: "The base URL encoders use to push RTMP streams. Format: rtmp://{your-server}/live. The '/live' is the SRS vhost application. Defined in srs.conf under 'vhost __defaultVhost__ { }'.",
      rtmpUrlLink: "https://ossrs.io/lts/en-us/docs/v5/doc/rtmp",
      rtmpUrlLinkLabel: "SRS RTMP Docs",
      playbackUrl: "The base URL for HLS playback. SRS serves HLS on the HTTP server port (default 8080). Format: http://{your-server}:8080. If using a CDN, enter the CDN URL instead.",
      playbackUrlLink: "https://ossrs.io/lts/en-us/docs/v5/doc/delivery-hls",
      playbackUrlLinkLabel: "SRS HLS Delivery",
      hlsSegment: "Duration of each HLS segment. Default: 10s in SRS. Change in srs.conf under 'hls { hls_fragment }'. Lower values (2-4s) reduce latency. Recommended: 4s for live events.",
      transcoding: "SRS supports FFmpeg-based transcoding. Configure transcoding engines in srs.conf under 'transcode'. Requires FFmpeg installed on the server.",
      transcodingLink: "https://ossrs.io/lts/en-us/docs/v5/doc/ffmpeg",
      transcodingLinkLabel: "SRS Transcoding Docs",
      streamAuth: "SRS supports on_publish HTTP callbacks for stream authentication. Configure in srs.conf under 'http_hooks { on_publish }'. The callback URL receives stream details for validation.",
      tokenAuth: "SRS supports token-based playback via HTTP callbacks. Configure 'on_play' hooks in srs.conf to validate viewer tokens before allowing playback.",
      tokenSecret: "A secret key for signing playback tokens. SRS validates tokens via HTTP callback. Generate via: openssl rand -hex 32. Configure the validation endpoint in your on_play hook.",
      ipWhitelist: "SRS supports IP-based access control via security rules in srs.conf. Configure under 'security { allow publish; deny publish; }' to restrict who can push streams.",
      geoRestriction: "SRS does not have built-in geo-restriction. Implement at the CDN/reverse proxy level (Cloudflare, Nginx) or via on_play HTTP callbacks with a GeoIP lookup.",
      storagePath: "Server directory where DVR recordings are saved. Configure in srs.conf under 'dvr { dvr_path }'. Default: ./objs/nginx/html. Ensure SRS has write permission.",
      testConnection: "SRS server is reachable and responding",
    },
    unsupportedFeatures: ["geoRestriction"],
  },
  nginx_rtmp: {
    type: "nginx_rtmp",
    name: "Nginx-RTMP",
    description: "Free, lightweight RTMP module for Nginx. Converts RTMP to HLS/DASH. Minimal resource usage.",
    isFree: true,
    cost: "Free (open-source, BSD license)",
    website: "https://github.com/arut/nginx-rtmp-module",
    features: [
      "RTMP ingest",
      "HLS, MPEG-DASH output",
      "Recording to FLV",
      "Relay & push support",
      "on_publish/on_done callbacks",
      "Extremely lightweight",
      "Battle-tested in production",
    ],
    defaultPorts: { rtmp: 1935, http: 8080, api: 8080 },
    envVars: {
      apiUrl: "NGINX_RTMP_STAT_URL",
      apiKey: "NGINX_RTMP_API_KEY",
      rtmpUrl: "NGINX_RTMP_URL",
      playbackUrl: "NGINX_RTMP_PLAYBACK_URL",
    },
    defaultConfig: {
      name: "Primary Nginx-RTMP Server",
      host: "",
      rtmpPort: 1935,
      httpPort: 8080,
      apiKey: "",
      rtmpBaseUrl: "",
      playbackBaseUrl: "",
    },
    helpTexts: {
      apiHost: "The hostname or IP of your Nginx server. Nginx-RTMP exposes stats via an HTTP endpoint (e.g., http://{server}/stat). Configure the stat page in nginx.conf under 'rtmp_stat'.",
      apiHostLink: "https://github.com/arut/nginx-rtmp-module/wiki/Directives#rtmp_stat",
      apiHostLinkLabel: "Nginx-RTMP Stats Docs",
      rtmpPort: "Default RTMP port is 1935. Change in nginx.conf under the 'rtmp { server { listen } }' block. Only change if you have port conflicts.",
      httpPort: "The Nginx HTTP port serving HLS files and the stat page. Default is 8080 (or 80). Change in the 'http { server { listen } }' block in nginx.conf.",
      apiKey: "Nginx-RTMP does not have a built-in API key. If you've added HTTP basic auth or a custom auth layer to the stat page, enter credentials here. Otherwise, leave empty.",
      rtmpUrl: "The base URL for RTMP ingest. Format: rtmp://{your-server}/live. The '/live' is the application name defined in nginx.conf under 'rtmp { server { application live { } } }'.",
      rtmpUrlLink: "https://github.com/arut/nginx-rtmp-module/wiki/Directives#application",
      rtmpUrlLinkLabel: "Nginx-RTMP Application Docs",
      playbackUrl: "Nginx-RTMP converts RTMP to HLS files served via Nginx HTTP. Format: http://{your-server}:8080/hls. The HLS root directory is set via 'hls_path' in nginx.conf.",
      playbackUrlLink: "https://github.com/arut/nginx-rtmp-module/wiki/Directives#hls",
      playbackUrlLinkLabel: "Nginx-RTMP HLS Docs",
      hlsSegment: "HLS segment duration in seconds. Set via 'hls_fragment' in nginx.conf (default: 5s). Lower values reduce latency. Example: 'hls_fragment 4s;' in your application block.",
      transcoding: "Nginx-RTMP supports exec-based transcoding. Add 'exec ffmpeg ...' directives in your application block to transcode to multiple bitrates. Requires FFmpeg installed.",
      transcodingLink: "https://github.com/arut/nginx-rtmp-module/wiki/Directives#exec",
      transcodingLinkLabel: "Nginx-RTMP Exec Docs",
      streamAuth: "Nginx-RTMP supports on_publish HTTP callbacks. Add 'on_publish http://localhost/auth;' in your application block. Return 2xx to allow, 3xx to redirect, others to deny.",
      tokenAuth: "Nginx-RTMP supports on_play callbacks for playback authentication. Add 'on_play http://localhost/auth;' to validate viewer tokens or sessions before allowing playback.",
      tokenSecret: "A secret key for signing playback tokens. Nginx-RTMP validates tokens via the on_play callback. Generate via: openssl rand -hex 32",
      ipWhitelist: "Use 'allow publish' and 'deny publish' directives in the application block to restrict by IP. Example: 'allow publish 192.168.1.0/24; deny publish all;'.",
      geoRestriction: "Nginx-RTMP does not have built-in geo-restriction. Use the Nginx GeoIP module (ngx_http_geoip_module) or handle at the CDN level.",
      storagePath: "Directory for recording RTMP streams. Set via 'record_path' in the application block. Example: 'record_path /recordings;'. Ensure Nginx has write permission.",
      testConnection: "Nginx-RTMP server is reachable and responding",
    },
    unsupportedFeatures: ["geoRestriction"],
  },
  mediamtx: {
    type: "mediamtx",
    name: "MediaMTX",
    description: "Free, zero-dependency media server. Supports RTMP, RTSP, HLS, WebRTC, SRT, and more protocols.",
    isFree: true,
    cost: "Free (open-source, MIT license)",
    website: "https://github.com/bluenviron/mediamtx",
    features: [
      "RTMP, RTSP, SRT, WebRTC ingest",
      "HLS, WebRTC, RTSP output",
      "Built-in REST API",
      "Recording support",
      "Authentication hooks",
      "Single binary, zero dependencies",
      "Low resource usage",
    ],
    defaultPorts: { rtmp: 1935, http: 8888, api: 9997 },
    envVars: {
      apiUrl: "MEDIAMTX_API_URL",
      apiKey: "MEDIAMTX_API_KEY",
      rtmpUrl: "MEDIAMTX_RTMP_URL",
      playbackUrl: "MEDIAMTX_PLAYBACK_URL",
    },
    defaultConfig: {
      name: "Primary MediaMTX Server",
      host: "",
      rtmpPort: 1935,
      httpPort: 9997,
      apiKey: "",
      rtmpBaseUrl: "",
      playbackBaseUrl: "",
    },
    helpTexts: {
      apiHost: "The hostname or IP of your MediaMTX server. MediaMTX exposes its REST API on port 9997 by default. Verify by visiting http://{your-server}:9997/v3/paths/list in a browser.",
      apiHostLink: "https://github.com/bluenviron/mediamtx#table-of-contents",
      apiHostLinkLabel: "MediaMTX Documentation",
      rtmpPort: "Default RTMP port is 1935. Change in mediamtx.yml under 'rtmpAddress'. Example: 'rtmpAddress: :1935'. Only change if you have port conflicts.",
      httpPort: "MediaMTX REST API port. Default is 9997. Change in mediamtx.yml under 'apiAddress'. Example: 'apiAddress: :9997'. This is separate from the HLS port (8888).",
      apiKey: "MediaMTX does not require an API key by default. If you've configured API authentication in mediamtx.yml under 'api { credentials }', enter the username:password or token here.",
      rtmpUrl: "The base URL for RTMP ingest. Format: rtmp://{your-server}/live. MediaMTX auto-creates paths on first publish. No application pre-configuration needed.",
      rtmpUrlLink: "https://github.com/bluenviron/mediamtx#publish-to-the-server",
      rtmpUrlLinkLabel: "MediaMTX Publishing Guide",
      playbackUrl: "MediaMTX serves HLS on port 8888 by default. Format: http://{your-server}:8888. Change via 'hlsAddress' in mediamtx.yml. If using a CDN, enter the CDN URL.",
      playbackUrlLink: "https://github.com/bluenviron/mediamtx#hls",
      playbackUrlLinkLabel: "MediaMTX HLS Docs",
      hlsSegment: "HLS segment duration. Set via 'hlsSegmentDuration' in mediamtx.yml (default: 1s for low-latency). Increase to 4s for better compatibility with older players.",
      transcoding: "MediaMTX does not have built-in transcoding. Use FFmpeg as an external process to re-publish transcoded streams. Or use 'runOnReady' hooks to trigger FFmpeg automatically.",
      transcodingLink: "https://github.com/bluenviron/mediamtx#on-demand-publishing",
      transcodingLinkLabel: "MediaMTX Hooks Docs",
      streamAuth: "MediaMTX supports internal authentication via mediamtx.yml and external auth via HTTP hooks (runOnConnect). Configure users under 'paths: { all_others: { publishUser, publishPass } }'.",
      tokenAuth: "MediaMTX supports read authentication. Configure 'readUser' and 'readPass' per-path in mediamtx.yml, or use 'externalAuthenticationURL' for token-based validation via HTTP.",
      tokenSecret: "A secret key for signing playback tokens. When using externalAuthenticationURL, MediaMTX sends credentials to your endpoint for validation. Generate via: openssl rand -hex 32",
      ipWhitelist: "MediaMTX supports IP-based filtering via 'publishIPs' and 'readIPs' per-path in mediamtx.yml. Example: 'publishIPs: [192.168.1.0/24]'.",
      geoRestriction: "MediaMTX does not have built-in geo-restriction. Implement at the CDN/reverse proxy level (Cloudflare, Nginx) or via externalAuthenticationURL with GeoIP lookup.",
      storagePath: "Configure recording via 'record' and 'recordPath' per-path in mediamtx.yml. Default: './recordings'. Ensure MediaMTX has write permission to the directory.",
      testConnection: "MediaMTX server is reachable and responding",
    },
    unsupportedFeatures: ["geoRestriction"],
  },
}
