import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BrandedLogo } from "@/components/branding/branded-logo"
import {
    Menu, X, PlayCircle, Users, Palette, Radio, Banknote, ShieldCheck, Video,
    Settings, Activity, Globe, Zap, ArrowRight, CheckCircle2
} from "lucide-react"

export function PlatformLandingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const features = [
        {
            title: "100% White-Label",
            description: "Host your own scalable live streaming platform. Your logo, your brand colors, and your custom domain (e.g., live.yourstudio.com). Completely hide the StreamLivee engine.",
            icon: Palette,
            theme: "text-blue-400 bg-blue-500/10 border-blue-500/20"
        },
        {
            title: "Pay-Per-Event Scaling",
            description: "No massive monthly subscriptions. You only pay for the streaming credits you actually use per event. Scale with usage.",
            icon: Zap,
            theme: "text-amber-400 bg-amber-500/10 border-amber-500/20"
        },
        {
            title: "Built-In Simulcasting",
            description: "Broadcast simultaneously to custom RTMP endpoints, Facebook pages, and YouTube Live, managed entirely through your centralized cloud dashboard.",
            icon: Radio,
            theme: "text-rose-400 bg-rose-500/10 border-rose-500/20"
        },
        {
            title: "Zero-Code Deployments",
            description: "You provide the video content, we handle the video CDNs, HLS transcoding, access control, and password protections dynamically on the edge.",
            icon: Activity,
            theme: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        },
        {
            title: "Payments & Credits",
            description: "Platform-level payment gateways (Razorpay, Instamojo) for wallet top-ups. Streamers and studios use credits for streaming.",
            icon: Banknote,
            theme: "text-violet-400 bg-violet-500/10 border-violet-500/20"
        },
        {
            title: "Streamer Management",
            description: "Studios and streamers use the platform to run and manage live streams. Studio accounts get a branded portal on their custom domain; credits, schedules, and permissions are managed on the platform.",
            icon: Users,
            theme: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
        }
    ]

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link href="/" className="flex items-center gap-3">
                        <BrandedLogo size="lg" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</a>
                        <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
                        <Link href="/login">
                            <Button variant="outline" size="sm">Sign In</Button>
                        </Link>
                        <Link href="/login">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </nav>

                    <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-16">
                {/* Hero Section */}
                <section className="relative px-6 pt-20 pb-32 text-center overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

                    <div className="mx-auto max-w-5xl relative z-10">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            StreamLivee 2.0 is Live
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-balance animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150">
                            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">White-Label</span><br className="hidden md:block" /> Live Streaming Platform
                        </h1>

                        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-300">
                            Run live streaming at scale or launch your own white-label platform on a custom domain—with zero coding required.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                            <Link href="/login">
                                <Button size="lg" className="w-full sm:w-auto text-md h-12 px-8">
                                    Start Your Studio
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="#how-it-works">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto text-md h-12 px-8">
                                    How It Works
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* Dashboard Abstract Preview */}
                    <div className="mx-auto max-w-6xl mt-20 relative animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
                        {/* Glow effect */}
                        <div className="absolute inset-0 -z-10 bg-primary/20 blur-[100px] rounded-full" />

                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
                        <div className="rounded-xl border border-border bg-card shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                            <div className="border-b border-border bg-muted/80 p-4 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex flex-row items-center gap-2 px-2">
                                    <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                                </div>
                                <div className="h-7 w-64 bg-background border border-border rounded-md hidden sm:flex items-center px-3 justify-center">
                                    <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                        www.your-domain.com
                                    </div>
                                </div>
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                    <div className="h-4 w-4 rounded-full bg-primary/50"></div>
                                </div>
                            </div>
                            <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9] bg-background flex flex-col p-4 sm:p-6 sm:p-8 gap-6 relative">
                                <div className="flex justify-between items-center z-0">
                                    <div>
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <div className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                                            Live Events Dashboard
                                        </h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 px-4 rounded bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium shadow-sm">New Event</div>
                                        <div className="h-8 w-8 rounded border border-border bg-card flex items-center justify-center"><Settings className="h-4 w-4 text-muted-foreground" /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-6 w-full flex-1 z-0">
                                    {/* Sidebar */}
                                    <div className="col-span-3 rounded-xl border border-border bg-card hidden md:flex flex-col gap-3 p-4 shadow-sm">
                                        <div className="h-9 w-full rounded bg-primary/10 border border-primary/20 flex items-center px-3 mb-2">
                                            <div className="h-4 w-2/3 bg-primary/40 rounded"></div>
                                        </div>
                                        <div className="h-9 w-full rounded hover:bg-secondary/50 flex items-center px-3 transition-colors">
                                            <div className="h-4 w-1/2 bg-secondary rounded"></div>
                                        </div>
                                        <div className="h-9 w-full rounded hover:bg-secondary/50 flex items-center px-3 transition-colors">
                                            <div className="h-4 w-3/4 bg-secondary rounded"></div>
                                        </div>
                                        <div className="h-9 w-full rounded hover:bg-secondary/50 flex items-center px-3 transition-colors">
                                            <div className="h-4 w-1/2 bg-secondary rounded"></div>
                                        </div>
                                    </div>

                                    {/* Main Content */}
                                    <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
                                        {/* Video/Stream area */}
                                        <div className="h-[220px] rounded-xl border border-border bg-card overflow-hidden relative flex flex-col sm:flex-row shadow-sm">
                                            <div className="w-full sm:w-2/5 md:w-1/3 bg-zinc-950 flex items-center justify-center group relative border-r border-border">
                                                <PlayCircle className="h-12 w-12 text-white/30 group-hover:text-white transition-colors cursor-pointer" />
                                                <div className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded shadow-sm">Live</div>
                                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] px-2.5 py-1 rounded flex items-center gap-1.5"><Users className="h-3 w-3 text-zinc-400" /> 1,204</div>
                                            </div>
                                            <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between bg-card">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="h-7 w-2/3 bg-foreground/10 rounded-md"></div>
                                                        <div className="h-6 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-[11px] flex items-center justify-center font-medium shadow-sm">Excellent Stream</div>
                                                    </div>
                                                    <div className="h-4 w-1/3 bg-muted-foreground/20 rounded-md"></div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                                                        <div className="text-[10px] text-muted-foreground mb-1.5 uppercase font-medium">Ingest Bitrate</div>
                                                        <div className="font-mono text-sm font-semibold text-foreground">4,500 <span className="text-xs text-muted-foreground">kbps</span></div>
                                                    </div>
                                                    <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                                                        <div className="text-[10px] text-muted-foreground mb-1.5 uppercase font-medium">Resolution</div>
                                                        <div className="font-mono text-sm font-semibold text-foreground">1080p<span className="text-xs text-muted-foreground">60</span></div>
                                                    </div>
                                                    <div className="p-3 bg-secondary/50 rounded-lg border border-border/50">
                                                        <div className="text-[10px] text-muted-foreground mb-1.5 uppercase font-medium">Simulcast</div>
                                                        <div className="font-mono text-sm font-semibold text-foreground">3 <span className="text-xs text-muted-foreground">Destinations</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lower cards */}
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center">
                                                        <Banknote className="h-3 w-3 text-primary" />
                                                    </div>
                                                    <div className="h-4 w-1/3 bg-foreground/10 rounded"></div>
                                                </div>
                                                <div className="h-16 w-full bg-secondary/30 rounded-lg border border-border border-dashed flex items-center px-4">
                                                    <div className="h-3 w-1/2 bg-muted-foreground/20 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-5 w-5 rounded bg-amber-500/20 flex items-center justify-center">
                                                        <Radio className="h-3 w-3 text-amber-500" />
                                                    </div>
                                                    <div className="h-4 w-1/3 bg-foreground/10 rounded"></div>
                                                </div>
                                                <div className="h-16 w-full bg-secondary/30 rounded-lg border border-border border-dashed flex items-center px-4">
                                                    <div className="h-3 w-2/3 bg-muted-foreground/20 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="px-6 py-24 bg-card/20 border-y border-border/40">
                    <div className="mx-auto max-w-7xl">
                        <div className="text-center mb-20 max-w-3xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-primary">broadcast at scale.</span></h2>
                            <p className="text-lg text-muted-foreground">StreamLivee turns your single web-server into a fully fledged streaming agency. We provide the architecture, you provide the vision.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((f, idx) => (
                                <div key={idx} className="group relative rounded-2xl border border-border/60 bg-card p-8 hover:bg-secondary/50 transition-colors">
                                    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border ${f.theme}`}>
                                        <f.icon className="h-7 w-7" />
                                    </div>
                                    <h3 className="mb-3 text-xl font-semibold">{f.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How it Works / Trust */}
                <section id="how-it-works" className="px-6 py-24 scroll-mt-24">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Zero configuration.<br />Instant white-labeling.</h2>
                                <ul className="space-y-6 mt-8 mb-10">
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <h4 className="font-semibold text-lg text-foreground">1. Connect Your Domain</h4>
                                            <p className="text-muted-foreground">Map your custom A/CNAME record to our Edge router and instantly secure a custom SSL certificate.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <h4 className="font-semibold text-lg text-foreground">2. Add Branding</h4>
                                            <p className="text-muted-foreground">Upload your logos, pick your primary hex colors, and update your local emails right from the Admin Dashboard.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
                                        <div>
                                            <h4 className="font-semibold text-lg text-foreground">3. Use Credits</h4>
                                            <p className="text-muted-foreground">Studios and streamers sign up on the platform and use stream credits to run their streams.</p>
                                        </div>
                                    </li>
                                </ul>
                                <Link href="/login">
                                    <Button variant="outline" className="h-12 px-6">Explore the Platform</Button>
                                </Link>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                                <div className="relative rounded-2xl border border-border bg-card shadow-xl p-8 overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-emerald-500"></div>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between pb-6 border-b border-border">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"><Globe className="text-primary h-6 w-6" /></div>
                                                <div><div className="font-bold text-lg">live.yourstudio.com</div><div className="text-xs text-emerald-500 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secured by SSL</div></div>
                                            </div>
                                            <Badge variant="outline" className="bg-primary/5 text-primary">Connected</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="rounded-lg bg-secondary/50 p-4">
                                                <div className="text-xs text-muted-foreground mb-1">Primary Color</div>
                                                <div className="flex items-center gap-2"><div className="h-5 w-5 rounded bg-[#8b5cf6]"></div> <span className="font-mono text-xs">#8B5CF6</span></div>
                                            </div>
                                            <div className="rounded-lg bg-secondary/50 p-4">
                                                <div className="text-xs text-muted-foreground mb-1">Secondary Color</div>
                                                <div className="flex items-center gap-2"><div className="h-5 w-5 rounded bg-[#7c3aed]"></div> <span className="font-mono text-xs">#7C3AED</span></div>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <Button className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">Example Call to Action</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="px-6 py-24">
                    <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-b from-primary/10 to-transparent border border-primary/20 p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-balance mb-6">Stop building infrastructure.<br />Start streaming.</h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                            Join the modern era of scalable, white-labeled live streaming arrays.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login">
                                <Button size="lg" className="h-14 px-8 text-lg">Create Admin Account</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border/40 py-12 text-center text-sm text-muted-foreground">
                <div className="container mx-auto px-6">
                    <BrandedLogo size="sm" className="mx-auto mb-4 opacity-50 grayscale" />
                    <p>© {new Date().getFullYear()} StreamLivee Software. All rights reserved.</p>
                    <p className="mt-2">
                        Powered by{" "}
                        <a href="https://www.ofinit.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            OfinIT
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
}
