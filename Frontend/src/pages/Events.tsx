import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

type EventAttendee = {
  id: string;
  name?: string;
  email?: string;
  registeredAt?: string;
};

type EventItem = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  capacity?: number;
  attendeesCount?: number;
  createdBy?: {
    name: string;
    role: string;
  };
  attendees?: {
    hasRegistered: boolean;
    list?: EventAttendee[];
  };
};

const defaultForm = {
  title: "",
  description: "",
  location: "",
  startsAt: "",
  endsAt: "",
  capacity: 0,
};

export default function Events() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const [events, setEvents] = useState<EventItem[]>([]);
  const [logs, setLogs] = useState<Record<string, EventAttendee[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<EventItem[]>("/events", { token });
      setEvents(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Unable to load events",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startsAt || !form.endsAt) {
      toast({
        variant: "destructive",
        title: "Missing required fields",
        description: "Title, start, and end times are required.",
      });
      return;
    }
    try {
      setSaving(true);
      await apiRequest("/events", {
        method: "POST",
        token,
        body: form,
      });
      toast({ title: "Event published" });
      setForm(defaultForm);
      fetchEvents();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error creating event", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      await apiRequest(`/events/${eventId}/register`, {
        method: "POST",
        token,
      });
      toast({ title: "Registered successfully" });
      fetchEvents();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message });
    }
  };

  const fetchLogsForEvent = async (eventId: string) => {
    if (!isAdmin) return;
    setLoadingLogs((prev) => ({ ...prev, [eventId]: true }));
    try {
      const data = await apiRequest<EventAttendee[]>(`/events/${eventId}/logs`, { token });
      setLogs((prev) => ({ ...prev, [eventId]: data }));
    } catch (error: any) {
      toast({ variant: "destructive", title: "Unable to load event logs", description: error.message });
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events</h1>
        <p className="text-muted-foreground mt-1">Discover upcoming campus events and register.</p>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Create Event</CardTitle>
            <CardDescription>Share upcoming sessions, workshops, and gatherings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="AI Research Showcase"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="Tell attendees what to expect."
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Innovation Hall"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Ends at</Label>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((prev) => ({ ...prev, endsAt: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full md:col-span-2" disabled={saving}>
                {saving ? "Publishing..." : "Publish Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading events...</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No events yet. {isAdmin ? "Create one above to get started!" : "Check back soon."}
            </CardContent>
          </Card>
        ) : (
          events.map((event) => {
            const isPast = new Date(event.endsAt) < new Date();
            const isRegistered = event.attendees?.hasRegistered;
            const remaining =
              typeof event.capacity === "number" && typeof event.attendeesCount === "number"
                ? Math.max(event.capacity - event.attendeesCount, 0)
                : undefined;

            return (
              <Card key={event._id} className="transition-smooth hover:shadow-lg">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{event.title}</CardTitle>
                      {event.description && (
                        <CardDescription className="mt-1">{event.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={isPast ? "secondary" : "default"}>
                      {isPast ? "Completed" : "Upcoming"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {format(new Date(event.startsAt), "MMM d, yyyy • h:mm a")} -{" "}
                      {format(new Date(event.endsAt), "h:mm a")}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </span>
                    )}
                    {typeof event.capacity === "number" && (
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {remaining !== undefined ? `${remaining} spots left` : `${event.capacity} seats`}
                      </span>
                    )}
                  </div>
                  {!isAdmin && (
                    <Button
                      disabled={isPast || isRegistered || remaining === 0}
                      onClick={() => handleRegister(event._id)}
                      className="w-full md:w-auto"
                    >
                      {isRegistered
                        ? "Registered"
                        : remaining === 0
                        ? "Full"
                        : isPast
                        ? "Event finished"
                        : "Register"}
                    </Button>
                  )}
                  {isAdmin && (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        onClick={() => fetchLogsForEvent(event._id)}
                        disabled={loadingLogs[event._id]}
                      >
                        {loadingLogs[event._id] ? "Loading attendees..." : "Refresh registrations"}
                      </Button>
                      <div className="rounded-lg border p-3">
                        <p className="font-medium mb-2">Registered attendees</p>
                        {event.attendees?.list?.length === 0 && !logs[event._id] ? (
                          <p className="text-sm text-muted-foreground">No one has registered yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {(logs[event._id] || event.attendees?.list || []).map((attendee) => (
                              <div key={attendee.id} className="flex items-center justify-between text-sm">
                                <div>
                                  <p className="font-medium">{attendee.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground">{attendee.email || "No email"}</p>
                                </div>
                                <Badge variant="outline">
                                  {attendee.registeredAt
                                    ? format(new Date(attendee.registeredAt), "MMM d, h:mm a")
                                    : "Registered"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

