import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, BookOpen, Users, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    announcements: 0,
    upcomingEvents: 0,
    activeBookings: 0,
    myGroups: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    
    if (profileData) setProfile(profileData);

    // Fetch announcements count
    const { count: announcementsCount } = await supabase
      .from("announcements")
      .select("*", { count: "exact", head: true })
      .gte("expires_at", new Date().toISOString())
      .or(`expires_at.is.null`);

    // Fetch upcoming events
    const { data: eventsData, count: eventsCount } = await supabase
      .from("events")
      .select("*")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(3);

    // Fetch active bookings
    const { count: bookingsCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .in("status", ["pending", "approved"]);

    // Fetch groups
    const { count: groupsCount } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    // Fetch recent announcements with author info
    const { data: announcementsData } = await supabase
      .from("announcements")
      .select(`
        *,
        author:profiles(full_name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(3);

    setStats({
      announcements: announcementsCount || 0,
      upcomingEvents: eventsCount || 0,
      activeBookings: bookingsCount || 0,
      myGroups: groupsCount || 0,
    });

    setRecentAnnouncements(announcementsData || []);
    setUpcomingEvents(eventsData || []);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening on campus today</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {profile?.role || 'Loading...'}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-smooth hover:shadow-lg cursor-pointer" onClick={() => navigate("/announcements")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.announcements}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3" /> Stay informed
            </p>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-lg cursor-pointer" onClick={() => navigate("/calendar")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="inline h-3 w-3" /> This week
            </p>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-lg cursor-pointer" onClick={() => navigate("/resources")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending or approved</p>
          </CardContent>
        </Card>

        <Card className="transition-smooth hover:shadow-lg cursor-pointer" onClick={() => navigate("/groups")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myGroups}</div>
            <p className="text-xs text-muted-foreground mt-1">Collaboration spaces</p>
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
            <p className="text-sm text-muted-foreground">No announcements yet</p>
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
                      <Badge variant={getPriorityColor(announcement.priority) as any}>
                        {announcement.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {announcement.author?.full_name} • {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/announcements")}>
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
                      {format(new Date(event.start_time), 'MMM d, yyyy • h:mm a')}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">📍 {event.location}</p>
                    )}
                  </div>
                  <Badge variant="outline">{event.event_type}</Badge>
                </div>
              ))}
            </div>
          )}
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/calendar")}>
            View Full Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
