"use client"

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Brain,
  ShieldCheck,
  Link2,
  Upload,
  Scale,
  Shield,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "AI FIR Analysis",
    description: "Intelligent analysis of First Information Reports with automatic legal section prediction using advanced AI models.",
  },
  {
    icon: ShieldCheck,
    title: "Blockchain Hash Verification",
    description: "Tamper-proof evidence verification using cryptographic hashing stored on immutable blockchain ledger.",
  },
  {
    icon: Link2,
    title: "Chain of Custody Tracking",
    description: "Complete audit trail of evidence handling from collection to court presentation with timestamped records.",
  },
  {
    icon: Upload,
    title: "Secure Evidence Upload",
    description: "Military-grade encrypted file uploads with automatic IPFS distribution and redundant storage.",
  },
  {
    icon: Scale,
    title: "Court Verification Dashboard",
    description: "Judicial interface for instant evidence authenticity verification with blockchain proof certificates.",
  },
  {
    icon: Shield,
    title: "Police Dashboard",
    description: "Comprehensive case management system for law enforcement with AI-assisted documentation.",
  },
]

const stats = [
  { value: "50,000+", label: "Cases Processed" },
  { value: "99.97%", label: "Verification Accuracy" },
  { value: "15", label: "States Deployed" },
  { value: "2.5M", label: "Evidence Files Secured" },
]

const trustedBy = [
  "Ministry of Law & Justice",
  "National Informatics Centre",
  "Supreme Court of India",
  "Central Bureau of Investigation",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/police">Sign In</Link>
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
              <Link href="/police">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8 animate-fade-in-up">
              <Lock className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Government Approved Security Protocol</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up animation-delay-100 text-balance">
              <span className="text-foreground">Nyaya</span>
              <span className="text-accent">-Chain</span>
              <br />
              <span className="text-2xl md:text-3xl lg:text-4xl font-semibold text-muted-foreground mt-4 block">
                Integrity and Evidence System
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-200 text-pretty">
              Secure digital evidence storage with AI-powered legal section prediction and blockchain-based tamper-proof verification for the modern justice system.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8 text-lg" asChild>
                <Link href="/police">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border hover:bg-secondary" asChild>
                <Link href="/judge">View Demo</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`text-center animate-fade-in-up animation-delay-${(index + 4) * 100}`}
              >
                <div className="text-3xl md:text-4xl font-bold text-accent mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-8">TRUSTED BY INDIA&apos;S LEADING INSTITUTIONS</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {trustedBy.map((org) => (
              <div key={org} className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-5 w-5" />
                <span className="font-medium">{org}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Complete Evidence Management Solution
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Built with cutting-edge technology to ensure integrity, security, and transparency in legal proceedings.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className={`glass hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-${index * 100}`}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Nyaya-Chain Works</h2>
            <p className="text-lg text-muted-foreground">
              A seamless workflow from evidence collection to court verification.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Evidence Upload", desc: "Police upload digital evidence with metadata" },
              { step: "02", title: "AI Analysis", desc: "AI predicts relevant legal sections" },
              { step: "03", title: "Blockchain Record", desc: "Hash stored on immutable ledger" },
              { step: "04", title: "Court Verification", desc: "Judges verify evidence authenticity" },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent text-accent-foreground font-bold text-xl mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-accent/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto glass-dark rounded-2xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-sidebar-foreground mb-4">
                Ready to Transform Your Evidence Management?
              </h2>
              <p className="text-lg text-sidebar-foreground/70 mb-8 max-w-2xl mx-auto">
                Join India&apos;s leading judicial institutions in adopting blockchain-powered evidence integrity.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 h-14 px-8" asChild>
                  <Link href="/police">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent" asChild>
                  <Link href="#contact">Contact Sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Security</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Nyaya-Chain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
