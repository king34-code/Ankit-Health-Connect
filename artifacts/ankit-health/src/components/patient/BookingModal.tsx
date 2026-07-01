import React, { useEffect, useState } from "react";
import { format, addDays, startOfDay, parseISO, isBefore, isSameDay } from "date-fns";
import { supabase, edgeFn } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, AlertCircle } from "lucide-react";

type BookingModalProps = {
  doctor: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BookingModal({ doctor, open, onOpenChange }: BookingModalProps) {
  const { user, session } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  
  // Data
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  // Selection
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [createdAppointment, setCreatedAppointment] = useState<any | null>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime(null);
      setReason("");
      setCreatedAppointment(null);
      fetchAvailability();
    }
  }, [open, doctor?.id]);

  useEffect(() => {
    if (selectedDate && step === 2) {
      fetchBookedSlots(selectedDate);
    }
  }, [selectedDate, step]);

  async function fetchAvailability() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", doctor.id);
        
      if (error) throw error;
      setAvailability(data || []);
    } catch (error) {
      toast.error("Failed to load doctor's availability");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookedSlots(date: Date) {
    try {
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time")
        .eq("doctor_id", doctor.id)
        .eq("appointment_date", dateStr)
        .in("status", ["confirmed", "pending_payment"]);
        
      if (error) throw error;
      setBookedSlots(data?.map(a => a.appointment_time) || []);
    } catch (error) {
      toast.error("Failed to load available slots");
    } finally {
      setLoading(false);
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setStep(2);
    }
  };

  const handleCreateAppointmentAndPay = async () => {
    if (!selectedDate || !selectedTime || !user || !session) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      // 1. Create Appointment
      const { data: appointment, error: aptError } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          doctor_id: doctor.id,
          appointment_date: dateStr,
          appointment_time: selectedTime,
          status: "pending_payment",
          reason: reason.trim() || null
        })
        .select()
        .single();
        
      if (aptError) throw aptError;
      setCreatedAppointment(appointment);

      // 2. Generate Payment Link
      const res = await edgeFn("razorpay-create-payment-link", { appointment_id: appointment.id }, session.access_token);
      
      if (res.error) throw new Error(res.error);
      
      if (res.payment_link_url) {
        window.open(res.payment_link_url, "_blank");
        setStep(3);
      } else {
        throw new Error("Invalid response from payment gateway");
      }
      
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate booking. Please try again.");
      if (createdAppointment) setStep(3); // Go to step 3 anyway to allow retry
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!createdAppointment || !session) return;
    setLoading(true);
    try {
      const res = await edgeFn("razorpay-check-payment", { appointment_id: createdAppointment.id }, session.access_token);
      
      if (res.success) {
        toast.success("Payment confirmed successfully!");
        onOpenChange(false);
      } else {
        toast.error("Payment not confirmed yet. If you just paid, please wait a moment and try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify payment status.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to disable dates not in doctor's availability
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return true;
    
    const dayOfWeek = date.getDay();
    return !availability.some(a => a.day_of_week === dayOfWeek);
  };

  // Helper to generate time slots
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);
    if (!dayAvail) return [];

    const slots = [];
    const startStr = dayAvail.start_time;
    const endStr = dayAvail.end_time;
    const duration = dayAvail.slot_duration_minutes || 30;

    let current = new Date(`2000-01-01T${startStr}`);
    const end = new Date(`2000-01-01T${endStr}`);

    while (current < end) {
      const timeStr = format(current, "HH:mm:ss");
      slots.push({
        value: timeStr,
        label: format(current, "h:mm a"),
        booked: bookedSlots.includes(timeStr)
      });
      current = new Date(current.getTime() + duration * 60000);
    }

    return slots;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
          <DialogTitle className="text-2xl font-serif text-foreground">
            Book Appointment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Dr. {doctor?.profile?.full_name} • {doctor?.specialty}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Select a Date</h3>
              <div className="flex justify-center p-4 bg-muted/10 border border-border rounded-xl">
                {loading && availability.length === 0 ? (
                  <Spinner className="w-6 h-6 text-primary my-12" />
                ) : (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDateDisabled}
                    className="rounded-md"
                  />
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-foreground">Select a Time Slot</h3>
                  <p className="text-sm text-muted-foreground">{selectedDate && format(selectedDate, "EEEE, d MMMM yyyy")}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>Change Date</Button>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center"><Spinner className="w-6 h-6 text-primary" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2 pb-2">
                  {generateTimeSlots().map(slot => (
                    <Button
                      key={slot.value}
                      variant={selectedTime === slot.value ? "default" : "outline"}
                      className={`w-full ${slot.booked ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={slot.booked}
                      onClick={() => setSelectedTime(slot.value)}
                    >
                      {slot.label}
                    </Button>
                  ))}
                  {generateTimeSlots().length === 0 && (
                    <div className="col-span-3 text-center py-4 text-muted-foreground text-sm">
                      No slots available on this date.
                    </div>
                  )}
                </div>
              )}

              {selectedTime && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Reason for visit (Optional)</label>
                    <Textarea 
                      placeholder="Briefly describe your symptoms..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-foreground">Consultation Fee</span>
                    <span className="font-bold text-lg text-foreground">₹{doctor?.consultation_fee}</span>
                  </div>

                  <Button 
                    className="w-full text-base h-12 mt-2" 
                    onClick={handleCreateAppointmentAndPay}
                    disabled={loading}
                  >
                    {loading && <Spinner className="w-4 h-4 mr-2" />}
                    Confirm & Proceed to Payment
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 space-y-6">
              <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-serif font-bold text-foreground">Complete Your Payment</h3>
                <p className="text-muted-foreground mt-2">
                  A payment window should have opened securely. Please complete the transaction of ₹{doctor?.consultation_fee} to confirm your appointment.
                </p>
              </div>

              <div className="space-y-3 max-w-sm mx-auto pt-6">
                <Button 
                  className="w-full h-12" 
                  onClick={handleCheckPayment}
                  disabled={loading}
                >
                  {loading && <Spinner className="w-4 h-4 mr-2" />}
                  I've Paid — Confirm Appointment
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12" 
                  onClick={async () => {
                    setLoading(true);
                    try {
                       const res = await edgeFn("razorpay-create-payment-link", { appointment_id: createdAppointment.id }, session!.access_token);
                       if (res.payment_link_url) window.open(res.payment_link_url, "_blank");
                    } finally { setLoading(false); }
                  }}
                  disabled={loading}
                >
                  Re-open Payment Page ↗
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
