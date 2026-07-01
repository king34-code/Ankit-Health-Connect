import React, { useEffect, useState } from "react";
import { supabase, edgeFn } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, Clock, Stethoscope, Hospital } from "lucide-react";

type Booking = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor: {
    consultation_fee: number;
    specialty: string;
    hospital_name: string;
    profile: {
      full_name: string;
    };
  };
};

export default function MyBookingsTab() {
  const { user, session } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, appointment_date, appointment_time, status,
          doctor:doctors!appointments_doctor_id_fkey(
            consultation_fee, specialty, hospital_name,
            profile:profiles!doctors_id_fkey(full_name)
          )
        `)
        .eq("patient_id", user?.id)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      
      setBookings((data as any[])?.map(d => {
        const doctorObj = Array.isArray(d.doctor) ? d.doctor[0] : d.doctor;
        return {
          ...d,
          doctor: {
            ...doctorObj,
            profile: Array.isArray(doctorObj.profile) ? doctorObj.profile[0] : doctorObj.profile
          }
        };
      }) || []);
    } catch (error: any) {
      toast.error("Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePaymentLink(appointmentId: string) {
    if (!session) return;
    setActionLoading(`pay-${appointmentId}`);
    try {
      const res = await edgeFn("razorpay-create-payment-link", { appointment_id: appointmentId }, session.access_token);
      
      if (res.error) throw new Error(res.error);
      if (res.payment_link_url) {
        window.open(res.payment_link_url, "_blank");
        toast.info("Payment window opened. Please confirm once paid.");
      } else {
        throw new Error("Invalid response from payment gateway");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment. Gateway might not be configured.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCheckPayment(appointmentId: string) {
    if (!session) return;
    setActionLoading(`check-${appointmentId}`);
    try {
      const res = await edgeFn("razorpay-check-payment", { appointment_id: appointmentId }, session.access_token);
      
      if (res.success) {
        toast.success("Payment confirmed successfully!");
        setBookings(prev => prev.map(b => b.id === appointmentId ? { ...b, status: "confirmed" } : b));
      } else {
        toast.error("Payment not confirmed yet, please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify payment status.");
    } finally {
      setActionLoading(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending_payment': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Payment</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Confirmed</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatTime(time: string) {
    return format(new Date(`2000-01-01T${time}`), 'h:mm a');
  }

  function formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy');
  }

  if (loading) {
    return <div className="py-12 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-xl">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-serif font-medium text-foreground">No bookings found</h3>
        <p className="text-muted-foreground text-sm mt-1">Book an appointment with a doctor to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between" data-testid={`booking-card-${booking.id}`}>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                Dr. {booking.doctor?.profile?.full_name || "Unknown Doctor"}
              </h3>
              {getStatusBadge(booking.status)}
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Stethoscope className="w-4 h-4" /> {booking.doctor?.specialty}</span>
              <span className="flex items-center gap-1.5"><Hospital className="w-4 h-4" /> {booking.doctor?.hospital_name || "Clinic"}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(booking.appointment_date)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTime(booking.appointment_time)}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0 md:min-w-[200px]">
            {booking.status === "pending_payment" && (
              <>
                <Button 
                  onClick={() => handleCreatePaymentLink(booking.id)}
                  disabled={!!actionLoading}
                  className="w-full"
                >
                  {actionLoading === `pay-${booking.id}` && <Spinner className="w-4 h-4 mr-2" />}
                  Finish Payment
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleCheckPayment(booking.id)}
                  disabled={!!actionLoading}
                  className="w-full"
                >
                  {actionLoading === `check-${booking.id}` && <Spinner className="w-4 h-4 mr-2" />}
                  I've paid — Confirm
                </Button>
              </>
            )}
            {booking.status === "confirmed" && (
               <Button 
                 variant="outline"
                 onClick={() => handleCheckPayment(booking.id)}
                 disabled={!!actionLoading}
                 className="w-full"
               >
                 {actionLoading === `check-${booking.id}` && <Spinner className="w-4 h-4 mr-2" />}
                 Verify Payment Status
               </Button>
            )}
            
            <div className="text-center text-sm font-medium mt-1">
              Fee: ₹{booking.doctor?.consultation_fee}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
