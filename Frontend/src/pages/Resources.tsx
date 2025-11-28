import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Resources() {
  const { user } = useAuth();
  const [resources, setResources] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchResources();
    fetchMyBookings();
  }, [user]);

  const fetchResources = async () => {
    const { data } = await supabase
      .from("resources")
      .select("*")
      .eq("is_available", true)
      .order("name");
    if (data) setResources(data);
  };

  const fetchMyBookings = async () => {
    const { data } = await supabase
      .from("bookings")
      .select("*, resource:resources(*)")
      .eq("user_id", user?.id)
      .order("start_time", { ascending: false });
    if (data) setBookings(data);
  };

  const handleBook = async (resourceId: string) => {
    const { error } = await supabase.from("bookings").insert([{
      resource_id: resourceId,
      user_id: user?.id,
      start_time: new Date(Date.now() + 86400000).toISOString(),
      end_time: new Date(Date.now() + 90000000).toISOString(),
      purpose: "General use",
      status: "pending",
    }]);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Booking request submitted" });
      fetchMyBookings();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1">Book campus resources and equipment</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="transition-smooth hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <Badge variant="outline">{resource.resource_type}</Badge>
              </div>
              <CardTitle>{resource.name}</CardTitle>
              <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {resource.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <MapPin className="h-4 w-4" />
                  {resource.location}
                </p>
              )}
              <Button onClick={() => handleBook(resource.id)} className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Request Booking
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>Your resource booking history</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{booking.resource?.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                  </div>
                  <Badge variant={booking.status === "approved" ? "default" : "secondary"}>
                    {booking.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
