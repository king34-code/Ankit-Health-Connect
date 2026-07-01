import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type DayAvailability = {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AvailabilityTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS.map((_, i) => ({
      day_of_week: i,
      enabled: false,
      start_time: "09:00",
      end_time: "17:00",
      slot_duration_minutes: 30
    }))
  );

  useEffect(() => {
    if (user) fetchAvailability();
  }, [user]);

  async function fetchAvailability() {
    try {
      const { data, error } = await supabase
        .from("doctor_availability")
        .select("*")
        .eq("doctor_id", user?.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setAvailability(prev => prev.map(day => {
          const found = data.find(d => d.day_of_week === day.day_of_week);
          if (found) {
            return {
              day_of_week: found.day_of_week,
              enabled: true,
              start_time: found.start_time.substring(0, 5), // '09:00:00' -> '09:00'
              end_time: found.end_time.substring(0, 5),
              slot_duration_minutes: found.slot_duration_minutes
            };
          }
          return day;
        }));
      }
    } catch (error) {
      toast.error("Failed to load availability");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      // Delete existing
      await supabase.from("doctor_availability").delete().eq("doctor_id", user.id);
      
      // Insert new
      const toInsert = availability
        .filter(d => d.enabled)
        .map(d => ({
          doctor_id: user.id,
          day_of_week: d.day_of_week,
          start_time: d.start_time,
          end_time: d.end_time,
          slot_duration_minutes: d.slot_duration_minutes
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("doctor_availability").insert(toInsert);
        if (error) throw error;
      }
      
      toast.success("Availability updated successfully");
    } catch (error: any) {
      toast.error("Failed to update availability");
    } finally {
      setSaving(false);
    }
  }

  function updateDay(index: number, updates: Partial<DayAvailability>) {
    setAvailability(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  }

  if (loading) {
    return <div className="py-12 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-serif font-bold text-foreground mb-6">Weekly Schedule</h3>
      
      <div className="space-y-4 mb-8">
        {availability.map((day, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-3 w-40">
              <Checkbox 
                id={`day-${i}`} 
                checked={day.enabled}
                onCheckedChange={(c) => updateDay(i, { enabled: !!c })}
                data-testid={`check-day-${i}`}
              />
              <label htmlFor={`day-${i}`} className="font-medium cursor-pointer select-none">
                {DAYS[day.day_of_week]}
              </label>
            </div>
            
            {day.enabled ? (
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Input 
                    type="time" 
                    value={day.start_time} 
                    onChange={e => updateDay(i, { start_time: e.target.value })}
                    className="w-[120px]"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input 
                    type="time" 
                    value={day.end_time} 
                    onChange={e => updateDay(i, { end_time: e.target.value })}
                    className="w-[120px]"
                  />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground hidden md:inline">Slot:</span>
                  <Input 
                    type="number" 
                    value={day.slot_duration_minutes} 
                    onChange={e => updateDay(i, { slot_duration_minutes: parseInt(e.target.value) || 30 })}
                    className="w-[80px]"
                    min={10}
                    step={5}
                  />
                  <span className="text-sm text-muted-foreground hidden md:inline">min</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-muted-foreground text-sm py-2">
                Unavailable
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} data-testid="button-save-availability">
          {saving && <Spinner className="w-4 h-4 mr-2" />}
          Save Availability
        </Button>
      </div>
    </div>
  );
}
