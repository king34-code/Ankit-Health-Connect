import React, { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, CreditCard, HeartPulse, Search, CalendarCheck, BadgeCheck, Star, ChevronRight } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useCountUp } from "@/hooks/useCountUp";

// Fade-up animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } }
};

// SVG heartbeat pulse path
function PulseLine() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
      viewBox="0 0 1200 200"
      preserveAspectRatio="none"
      fill="none"
    >
      <path
        d="M0,100 L200,100 L240,40 L280,160 L320,60 L360,140 L400,100 L600,100 L640,30 L680,170 L720,50 L760,150 L800,100 L1200,100"
        stroke="hsl(197 74% 45%)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-draw-pulse"
      />
    </svg>
  );
}

// Floating blob background
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft gradient mesh */}
      <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-accent/8 to-primary/5 blur-3xl animate-float-blob" />
      <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-primary/6 to-accent/4 blur-3xl animate-float-blob-2" />
      <div className="absolute -bottom-24 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-accent/6 to-transparent blur-2xl animate-float-blob" style={{ animationDelay: '3s' }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'linear-gradient(hsl(218 75% 16%) 1px, transparent 1px), linear-gradient(to right, hsl(218 75% 16%) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
    </div>
  );
}

// Animated stat card
function StatCard({ value, suffix, label, delay }: { value: number, suffix: string, label: string, delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const count = useCountUp(value, 1800, isInView);

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={delay}
      className="text-center"
    >
      <div className="text-4xl md:text-5xl font-serif font-bold text-primary">
        {count >= 48 && label === "Patient Rating out of 5" ? "4.8" : count.toLocaleString("en-IN")}{suffix}
      </div>
      <div className="mt-2 text-muted-foreground text-sm font-medium uppercase tracking-wider">{label}</div>
    </motion.div>
  );
}

// Feature card with scroll reveal
function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className="flex flex-col items-start p-7 rounded-xl border border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
    >
      <div className="p-3 bg-primary/5 text-primary rounded-xl mb-5 group-hover:bg-accent/10 group-hover:text-accent transition-colors duration-300">
        {icon}
      </div>
      <h3 className="text-lg font-serif font-bold text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

// How it works step
function HowStep({ number, icon, title, description, delay }: { number: string, icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div variants={fadeUp} custom={delay} className="flex flex-col items-center text-center relative">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          {icon}
        </div>
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shadow">
          {number}
        </div>
      </div>
      <h3 className="text-lg font-serif font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{description}</p>
    </motion.div>
  );
}

// Testimonial card
function TestimonialCard({ quote, name, location, rating, delay }: { quote: string, name: string, location: string, rating: number, delay: number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      className="bg-card border border-border rounded-xl p-7 shadow-sm flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-foreground/80 text-sm leading-relaxed italic">"{quote}"</p>
      <div>
        <p className="font-semibold text-foreground text-sm">{name}</p>
        <p className="text-muted-foreground text-xs">{location}</p>
      </div>
    </motion.div>
  );
}

// Section wrapper with scroll reveal
function RevealSection({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <PublicLayout>
      {/* ── HERO ── */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-24 text-center overflow-hidden min-h-[90vh]">
        <HeroBackground />
        <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden">
          <PulseLine />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <BadgeCheck className="w-4 h-4" />
            Trusted by 10,000+ patients across India
          </motion.div>

          <motion.h1
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-7xl font-serif font-bold text-primary max-w-4xl mx-auto tracking-tight leading-[1.08]"
          >
            Book a doctor,{" "}
            <span className="relative inline-block">
              <span className="relative z-10">without</span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/15 -z-0 rounded" />
            </span>
            {" "}the phone tag.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed"
          >
            India's trusted platform for doctor appointments — online, instant, real.
            Find verified specialists and book your slot in under 2 minutes.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              className="text-lg px-10 py-6 h-auto font-medium btn-interactive shadow-lg shadow-primary/20"
              asChild
            >
              <Link href="/signup">
                Get Started
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-10 py-6 h-auto font-medium btn-interactive border-primary/20 hover:border-primary/40"
              asChild
            >
              <Link href="/login">Log In</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="relative z-10 mt-16 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground"
        >
          {["No waiting on hold", "Instant confirmation", "Secure payments"].map((t) => (
            <span key={t} className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5 text-accent" />
              {t}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 bg-primary text-white">
        <RevealSection className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-12">
          <StatCard value={500} suffix="+" label="Verified Doctors" delay={0} />
          <StatCard value={10000} suffix="+" label="Appointments Booked" delay={1} />
          <StatCard value={48} suffix="★" label="Patient Rating out of 5" delay={2} />
          <StatCard value={25} suffix="+" label="Specialties" delay={3} />
        </RevealSection>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <RevealSection>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Why MedBook</p>
              <h2 className="text-4xl font-serif font-bold text-primary">Healthcare that works for you</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard delay={1} icon={<ShieldCheck className="w-8 h-8" />} title="Verified Doctors" description="Every medical professional is thoroughly vetted, credential-checked, and hospital-affiliated." />
              <FeatureCard delay={2} icon={<Clock className="w-8 h-8" />} title="Instant Slots" description="View real-time availability and confirm your appointment instantly — no calls, no hold music." />
              <FeatureCard delay={3} icon={<CreditCard className="w-8 h-8" />} title="Secure Payments" description="Safe, hassle-free online payment processing via Razorpay for all consultations." />
              <FeatureCard delay={4} icon={<HeartPulse className="w-8 h-8" />} title="Always Available" description="Book anytime, anywhere. Your healthcare doesn't wait for business hours." />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-white border-y border-border">
        <div className="container mx-auto px-4">
          <RevealSection>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Simple Process</p>
              <h2 className="text-4xl font-serif font-bold text-primary">How it works</h2>
              <p className="mt-4 text-muted-foreground max-w-xl mx-auto">From search to confirmed appointment in three steps.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting line (desktop) */}
              <div className="hidden md:block absolute top-10 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-0.5 bg-gradient-to-r from-primary/20 via-accent/40 to-primary/20" />
              <HowStep delay={1} number="1" icon={<Search className="w-9 h-9" />} title="Find a Doctor" description="Browse verified specialists by name, specialty, or hospital. Read profiles and check availability." />
              <HowStep delay={2} number="2" icon={<CalendarCheck className="w-9 h-9" />} title="Pick a Slot" description="Select a convenient date and time slot from the doctor's real-time availability calendar." />
              <HowStep delay={3} number="3" icon={<BadgeCheck className="w-9 h-9" />} title="Pay & Confirm" description="Complete the secure payment and receive instant confirmation for your appointment." />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <RevealSection>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <p className="text-accent font-medium text-sm uppercase tracking-widest mb-3">Patient Stories</p>
              <h2 className="text-4xl font-serif font-bold text-primary">Trusted by patients across India</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TestimonialCard
                delay={1}
                rating={5}
                quote="I booked a cardiologist appointment within minutes. No more calling up clinics and being put on hold for 20 minutes. MedBook is a game changer."
                name="Priya S."
                location="Mumbai, Maharashtra"
              />
              <TestimonialCard
                delay={2}
                rating={5}
                quote="As someone managing a busy schedule, the ability to see a doctor's availability in real time and book instantly is invaluable. Highly recommend."
                name="Arjun M."
                location="Bengaluru, Karnataka"
              />
              <TestimonialCard
                delay={3}
                rating={5}
                quote="The platform is clean, professional, and easy to use. I was able to find a dermatologist near me and confirm an appointment the same day."
                name="Kavitha R."
                location="Chennai, Tamil Nadu"
              />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="py-20 bg-primary text-white text-center">
        <RevealSection className="container mx-auto px-4">
          <motion.div variants={fadeUp} custom={0}>
            <h2 className="text-4xl font-serif font-bold mb-4">Ready to get started?</h2>
            <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">Join thousands of patients who manage their health with MedBook.</p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 h-auto font-medium btn-interactive shadow-xl"
              asChild
            >
              <Link href="/signup">Create Free Account <ChevronRight className="w-5 h-5 ml-1" /></Link>
            </Button>
          </motion.div>
        </RevealSection>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-primary/95 text-white/70 py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="10" y="2" width="4" height="20" rx="2" fill="white"/>
                  <rect x="2" y="10" width="20" height="4" rx="2" fill="white"/>
                </svg>
                <span className="font-serif font-bold text-white text-lg">MedBook</span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm text-white/60">
                India's trusted digital platform for doctor appointments. Verified specialists, instant booking, secure payments.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/signup" className="hover:text-white transition-colors">For Patients</Link></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">For Doctors</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
                <li><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <span>© {new Date().getFullYear()} MedBook. All rights reserved.</span>
            <span>Made with care in India 🇮🇳</span>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}