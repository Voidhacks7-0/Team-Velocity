import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";
import { apiRequest } from "@/lib/api";

export default function Calendar() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    const weekStart = startOfWeek(selectedDate).toISOString();
    const weekEnd = endOfWeek(selectedDate).toISOString();
    try {
      const data = await apiRequest<any[]>(
        `/common/events?start=${weekStart}&end=${weekEnd}`,
        { token }
      );
      setEvents(data);
    } catch (error) {
      console.error("Failed to load events", error);
    }
  }, [selectedDate, token]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate),
    end: endOfWeek(selectedDate),
  });

  const getEventsForDay = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.start_time), date)
    );
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      class: "primary",
      exam: "destructive",
      meeting: "secondary",
      workshop: "accent",
      general: "default",
      deadline: "warning",
    };
    return colors[type] || "default";
  };

  const canCreateEvent = user?.role === "faculty" || user?.role === "admin";

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            View your schedule and upcoming events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setSelectedDate((d) => subWeeks(d, 1))}
          >
            ← Prev
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelectedDate((d) => addWeeks(d, 1))}
          >
            Next →
          </Button>
          {canCreateEvent && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-lg shadow-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Week of {format(startOfWeek(selectedDate), "MMMM d, yyyy")}
          </CardTitle>
          <CardDescription>Your schedule for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const isDayToday = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[200px] rounded-lg p-3 transition-smooth ${
                    isDayToday
                      ? "border-l-4 border-primary bg-primary/5"
                      : "bg-card"
                  }`}
                >
                  <div className="mb-2 text-center">
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={`text-lg font-semibold ${
                        isDayToday ? "text-primary" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-md bg-background p-2 text-xs shadow-sm transition-smooth hover:shadow-md cursor-pointer"
                      >
                        <div className="font-medium line-clamp-2 mb-1">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(event.start_time), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1 text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="line-clamp-1">
                              {event.location}
                            </span>
                          </div>
                        )}
                        <Badge
                          variant={getEventTypeColor(event.event_type) as any}
                          className="mt-2 text-xs"
                        >
                          {event.event_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg shadow-elevated">
        <CardHeader>
          <CardTitle>All Events This Week</CardTitle>
          <CardDescription>Complete list of scheduled events</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events scheduled
            </p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                    <div className="text-xs font-medium text-muted-foreground">
                      {format(new Date(event.start_time), "MMM")}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(new Date(event.start_time), "d")}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold">{event.title}</h4>
                      <Badge
                        variant={getEventTypeColor(event.event_type) as any}
                      >
                        {event.event_type}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.start_time), "h:mm a")} -{" "}
                        {format(new Date(event.end_time), "h:mm a")}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created by {event.creator?.full_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
