import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Calendar, Clock, Phone, User } from "lucide-react";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  patient: {
    full_name: string;
    phone: string;
  };
};

export default function AppointmentsTab() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchAppointments();
  }, [user]);

  async function fetchAppointments() {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, appointment_date, appointment_time, status, reason,
          patient:profiles!appointments_patient_id_fkey(full_name, phone)
        `)
        .eq("doctor_id", user?.id)
        .order("appointment_date", { ascending: false });

      if (error) throw error;
      // Need to typecast because of the join array behavior
      setAppointments((data as any[])?.map(d => ({
        ...d,
        patient: Array.isArray(d.patient) ? d.patient[0] : d.patient
      })) || []);
    } catch (error: any) {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }

  async function markCompleted(id: string) {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", id);
        
      if (error) throw error;
      
      toast.success("Appointment marked as completed");
      setAppointments(prev => 
        prev.map(apt => apt.id === id ? { ...apt, status: "completed" } : apt)
      );
    } catch (error: any) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending_payment': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">Pending Payment</Badge>;
      case 'confirmed': return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">Confirmed</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">Cancelled</Badge>;
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

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-xl">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-serif font-medium text-foreground">No appointments yet</h3>
        <p className="text-muted-foreground text-sm mt-1">Your upcoming appointments will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((apt) => (
        <div key={apt.id} className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between" data-testid={`appointment-card-${apt.id}`}>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {apt.patient?.full_name || "Unknown Patient"}
              </h3>
              {getStatusBadge(apt.status)}
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(apt.appointment_date)}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTime(apt.appointment_time)}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {apt.patient?.phone || "N/A"}</span>
            </div>
            
            {apt.reason && (
              <div className="text-sm bg-muted/50 p-3 rounded-md text-foreground">
                <span className="font-medium text-muted-foreground mr-2">Reason:</span>
                {apt.reason}
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            {apt.status === "confirmed" && (
              <Button 
                onClick={() => markCompleted(apt.id)} 
                disabled={updatingId === apt.id}
                data-testid={`btn-complete-${apt.id}`}
              >
                {updatingId === apt.id && <Spinner className="w-4 h-4 mr-2" />}
                Mark Completed
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
