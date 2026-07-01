import React, { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const onboardingSchema = z.object({
  specialty: z.string().min(2, "Specialty is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience_years: z.coerce.number().min(0, "Invalid years of experience"),
  consultation_fee: z.coerce.number().min(0, "Invalid consultation fee"),
  hospital_name: z.string().min(2, "Hospital name is required"),
  bio: z.string().min(10, "Please provide a brief bio"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function DoctorOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      specialty: "",
      qualification: "",
      experience_years: 0,
      consultation_fee: 500,
      hospital_name: "",
      bio: "",
    },
  });

  async function onSubmit(data: OnboardingFormValues) {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from("doctors").insert({
        id: user.id,
        ...data,
      });

      if (error) throw error;

      toast.success("Profile completed successfully");
      setLocation("/doctor/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Complete Your Profile</h1>
        <p className="text-muted-foreground mt-2">Please provide your professional details to start accepting appointments.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specialty</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cardiology" {...field} data-testid="input-specialty" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MBBS, MD" {...field} data-testid="input-qualification" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-experience" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consultation_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultation Fee (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} data-testid="input-fee" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="hospital_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital / Clinic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Apollo Hospitals" {...field} data-testid="input-hospital" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your expertise and background..." 
                      className="min-h-[120px]"
                      {...field} 
                      data-testid="input-bio" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isLoading} data-testid="button-save-profile">
                {isLoading && <Spinner className="mr-2" />}
                Complete Profile
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
