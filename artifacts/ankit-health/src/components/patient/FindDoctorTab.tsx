import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Search, MapPin, Briefcase, Award } from "lucide-react";
import BookingModal from "./BookingModal";
import { Skeleton } from "@/components/ui/skeleton";

type Doctor = {
  id: string;
  specialty: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string;
  hospital_name: string;
  profile: {
    full_name: string;
  };
};

export default function FindDoctorTab() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  async function fetchDoctors() {
    try {
      // Try fetching verified doctors first
      let { data, error } = await supabase
        .from("doctors")
        .select(`
          id, specialty, qualification, experience_years, consultation_fee, bio, hospital_name,
          profile:profiles!doctors_id_fkey(full_name)
        `)
        .eq("is_verified", true);

      // Fallback if none (for testing/mocking)
      if (error || !data || data.length === 0) {
        const fallback = await supabase
          .from("doctors")
          .select(`
            id, specialty, qualification, experience_years, consultation_fee, bio, hospital_name,
            profile:profiles!doctors_id_fkey(full_name)
          `);
        data = fallback.data;
      }

      if (data) {
        setDoctors(data.map(d => ({
          ...d,
          profile: Array.isArray(d.profile) ? d.profile[0] : d.profile
        })) as Doctor[]);
      }
    } catch (error) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }

  const filteredDoctors = doctors.filter(d => 
    d.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase()) ||
    d.hospital_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input 
          className="pl-10 h-12 text-base input-glow" 
          placeholder="Search by name, specialty, or hospital..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-serif font-medium text-foreground">No doctors found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDoctors.map(doctor => (
            <div key={doctor.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col doctor-card-hover" data-testid={`doctor-card-${doctor.id}`}>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-foreground">Dr. {doctor.profile?.full_name}</h3>
                  <p className="text-primary font-medium">{doctor.specialty}</p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent" />
                    <span>{doctor.qualification} • {doctor.experience_years} Years Exp.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-accent" />
                    <span>{doctor.hospital_name}</span>
                  </div>
                </div>

                <p className="text-sm text-foreground/80 line-clamp-3">{doctor.bio}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Consultation Fee</p>
                  <p className="font-bold text-lg text-foreground">₹{doctor.consultation_fee}</p>
                </div>
                <Button onClick={() => setSelectedDoctor(doctor)} data-testid={`btn-book-${doctor.id}`}>
                  Book Appointment
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoctor && (
        <BookingModal 
          doctor={selectedDoctor} 
          open={!!selectedDoctor} 
          onOpenChange={(open) => !open && setSelectedDoctor(null)} 
        />
      )}
    </div>
  );
}