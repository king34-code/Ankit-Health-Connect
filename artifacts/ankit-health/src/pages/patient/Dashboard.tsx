import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FindDoctorTab from "@/components/patient/FindDoctorTab";
import MyBookingsTab from "@/components/patient/MyBookingsTab";

export default function PatientDashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Patient Dashboard</h1>
        <p className="text-muted-foreground mt-2">Find a doctor and manage your bookings.</p>
      </div>

      <Tabs defaultValue="find-doctor" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="find-doctor" data-testid="tab-find-doctor">Find a Doctor</TabsTrigger>
          <TabsTrigger value="my-bookings" data-testid="tab-my-bookings">My Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="find-doctor">
          <FindDoctorTab />
        </TabsContent>
        <TabsContent value="my-bookings">
          <MyBookingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
