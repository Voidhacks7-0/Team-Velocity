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
import {
  Bell,
  Calendar,
  BookOpen,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "@/lib/api";

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    announcements: 0,
    upcomingEvents: 0,
    activeBookings: 0,
    myGroups: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{
        stats: typeof stats;
        recentAnnouncements: any[];
        upcomingEvents: any[];
      }>("/common/dashboard", { token });

      setStats(data.stats);
      setRecentAnnouncements(data.recentAnnouncements || []);
      setUpcomingEvents(data.upcomingEvents || []);
    } catch (error) {
      // Silently fail on dashboard load to avoid blocking entire page
      console.error("Failed to load dashboard data", error);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "destructive",
      high: "warning",
      normal: "secondary",
      low: "muted",
    };
    return colors[priority] || "secondary";
  };

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening on campus today
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {user?.role || "Loading..."}
        </Badge>
      </div>
      {/* Hero */}
      <div className="rounded-lg shadow-elevated overflow-hidden">
        <div className="bg-gradient-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Campus at a glance</h2>
              <p className="opacity-90 mt-1">
                Quick access to announcements, events, resources, and groups
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => navigate("/announcements")}
              >
                View Announcements
              </Button>
              <Button variant="ghost" onClick={() => navigate("/calendar")}>
                Open Calendar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="transition-smooth hover:shadow-lg cursor-pointer"
          onClick={() => navigate("/announcements")}
        >
          <CardHeader className="flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-card p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium">
                Active Announcements
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3" /> Stay informed
            </p>
          </CardContent>
        </Card>

        <Card
          className="transition-smooth hover:shadow-lg cursor-pointer"
          onClick={() => navigate("/calendar")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3" /> This week
            </p>
          </CardContent>
        </Card>

        <Card
          className="transition-smooth hover:shadow-lg cursor-pointer"
          onClick={() => navigate("/resources")}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Bookings
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending or approved
            </p>
          </CardContent>
        </Card>

        <Card
          className="transition-smooth hover:shadow-lg cursor-pointer"
          onClick={() => navigate("/groups")}
        >
          <CardHeader className="flex items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-card p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium">My Groups</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myGroups}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Collaboration spaces
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>Latest updates from campus</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No announcements yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{announcement.title}</h4>
                      <Badge
                        variant={getPriorityColor(announcement.priority) as any}
                      >
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {announcement.author?.full_name} •{" "}
                      {format(new Date(announcement.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/announcements")}
          >
            View All Announcements
          </Button>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Your schedule for this week</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events</p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(event.start_time),
                        "MMM d, yyyy • h:mm a"
                      )}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">
                        📍 {event.location}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">{event.event_type}</Badge>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate("/calendar")}
          >
            View Full Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
