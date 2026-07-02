import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Stethoscope,
  Search,
  ShieldAlert,
} from "lucide-react";

const ADMIN_EMAIL = "shamuc604@gmail.com";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctor: {
    consultation_fee: number;
    specialty: string;
    profile: { full_name: string } | null;
  } | null;
  patient: { full_name: string } | null;
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "pending_payment":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 whitespace-nowrap">Pending Payment</Badge>;
    case "confirmed":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Confirmed</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentBadge(status: string) {
  if (status === "confirmed" || status === "completed") {
    return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">Paid</Badge>;
  }
  if (status === "cancelled") {
    return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">N/A</Badge>;
  }
  return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Unpaid</Badge>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" } }),
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAll();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAdmin]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [apptRes, docRes] = await Promise.all([
        supabase
          .from("appointments")
          .select(`
            id, appointment_date, appointment_time, status, reason,
            doctor:doctors!appointments_doctor_id_fkey(
              consultation_fee, specialty,
              profile:profiles!doctors_id_fkey(full_name)
            ),
            patient:profiles!appointments_patient_id_fkey(full_name)
          `)
          .order("appointment_date", { ascending: false }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
      ]);

      if (apptRes.error) throw apptRes.error;

      const normalized = (apptRes.data as any[]).map((row) => {
        const doc = Array.isArray(row.doctor) ? row.doctor[0] : row.doctor;
        const pat = Array.isArray(row.patient) ? row.patient[0] : row.patient;
        return {
          ...row,
          doctor: doc
            ? {
                ...doc,
                profile: Array.isArray(doc.profile) ? doc.profile[0] : doc.profile,
              }
            : null,
          patient: pat,
        };
      });

      setAppointments(normalized);
      setTotalDoctors(docRes.count ?? 0);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Derived stats
  const stats = useMemo(() => {
    const total = appointments.length;
    const confirmed = appointments.filter((a) => a.status === "confirmed" || a.status === "completed").length;
    const revenue = appointments
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + (a.doctor?.consultation_fee ?? 0), 0);
    return { total, confirmed, revenue };
  }, [appointments]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.patient?.full_name?.toLowerCase().includes(q) ||
          a.doctor?.profile?.full_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [appointments, statusFilter, search]);

  // ── Not authorized ──
  if (!authLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <ShieldAlert className="w-16 h-16 text-muted-foreground opacity-40" />
        <h2 className="text-2xl font-serif font-bold text-foreground">Not Authorized</h2>
        <p className="text-muted-foreground max-w-sm">
          This page is restricted to site administrators. Please sign in with an admin account to continue.
        </p>
      </div>
    );
  }

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <p className="text-accent font-medium text-xs uppercase tracking-widest mb-1">Admin Console</p>
        <h1 className="text-3xl font-serif font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">All appointments and bookings across Sample Health.</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Bookings",
            value: stats.total,
            icon: <CalendarDays className="w-5 h-5" />,
            color: "text-primary",
            bg: "bg-primary/8",
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            icon: <CheckCircle2 className="w-5 h-5" />,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Revenue",
            value: `₹${stats.revenue.toLocaleString("en-IN")}`,
            icon: <IndianRupee className="w-5 h-5" />,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Doctors Registered",
            value: totalDoctors,
            icon: <Stethoscope className="w-5 h-5" />,
            color: "text-violet-600",
            bg: "bg-violet-50",
          },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            custom={i + 1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="bg-card border border-border rounded-xl p-5 shadow-sm"
          >
            <div className={`inline-flex p-2.5 rounded-lg ${card.bg} ${card.color} mb-3`}>
              {card.icon}
            </div>
            <div className="text-2xl font-bold font-serif text-foreground">{card.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by patient or doctor name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground self-center shrink-0">
          {filtered.length} of {appointments.length} appointments
        </span>
      </motion.div>

      {/* Table */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No appointments match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Patient", "Doctor", "Specialty", "Date", "Time", "Status", "Amount", "Payment"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((appt, i) => (
                  <motion.tr
                    key={appt.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.025, duration: 0.2 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-4 font-medium text-foreground whitespace-nowrap">
                      {appt.patient?.full_name ?? <span className="text-muted-foreground italic">Unknown</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-foreground">
                      Dr. {appt.doctor?.profile?.full_name ?? <span className="text-muted-foreground italic">Unknown</span>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                      {appt.doctor?.specialty ?? "—"}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(appt.appointment_date), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                      {format(new Date(`2000-01-01T${appt.appointment_time}`), "h:mm a")}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(appt.status)}</td>
                    <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">
                      ₹{appt.doctor?.consultation_fee?.toLocaleString("en-IN") ?? "—"}
                    </td>
                    <td className="px-5 py-4">{getPaymentBadge(appt.status)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
