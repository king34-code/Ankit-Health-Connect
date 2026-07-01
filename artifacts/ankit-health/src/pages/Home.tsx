import React from "react";
import { Link } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, CreditCard, HeartPulse } from "lucide-react";

export default function Home() {
  return (
    <PublicLayout>
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-primary max-w-4xl tracking-tight leading-tight">
          Book a doctor, without the phone tag.
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl font-sans">
          India's trusted platform for doctor appointments — online, instant, real.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="text-lg px-8 py-6 h-auto font-medium" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto font-medium" asChild>
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </section>

      <section className="py-24 bg-white border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Verified Doctors"
              description="Every medical professional is thoroughly vetted and credential-checked."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8" />}
              title="Instant Slots"
              description="View real-time availability and confirm your appointment instantly."
            />
            <FeatureCard 
              icon={<CreditCard className="w-8 h-8" />}
              title="Secure Payments"
              description="Safe, hassle-free online payment processing for all consultations."
            />
            <FeatureCard 
              icon={<HeartPulse className="w-8 h-8" />}
              title="24/7 Availability"
              description="Book anytime, anywhere. Your healthcare doesn't wait for business hours."
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-start p-6 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-primary/5 text-primary rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold text-card-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
