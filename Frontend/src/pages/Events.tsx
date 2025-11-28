import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";

const events = [
  {
    id: 1,
    title: "Tech Talk: Building Scalable APIs",
    date: "Dec 10, 2025",
    time: "2:00 PM",
    location: "Engineering Hall 101",
    attendees: 42,
    description:
      "Learn best practices for designing scalable REST and GraphQL APIs.",
  },
  {
    id: 2,
    title: "Campus Hackathon 2025",
    date: "Dec 15-17, 2025",
    time: "9:00 AM",
    location: "Innovation Center",
    attendees: 156,
    description: "24-hour hackathon with prizes, mentorship, and networking.",
  },
  {
    id: 3,
    title: "Networking Mixer",
    date: "Dec 12, 2025",
    time: "5:00 PM",
    location: "Student Center Lounge",
    attendees: 89,
    description: "Meet fellow students, alumni, and tech professionals.",
  },
  {
    id: 4,
    title: "AI & Machine Learning Workshop",
    date: "Dec 20, 2025",
    time: "3:30 PM",
    location: "Science Building 204",
    attendees: 64,
    description:
      "Hands-on workshop covering TensorFlow, PyTorch, and AI fundamentals.",
  },
];

export default function Events() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/20 dark:border-blue-900/20 p-8">
          <h1 className="text-4xl font-bold mb-2">Campus Events</h1>
          <p className="text-muted-foreground">
            Discover upcoming events, workshops, and networking opportunities.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {events.map((event) => (
          <Card
            key={event.id}
            className="overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">{event.title}</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.attendees} interested</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                {event.description}
              </p>

              <div className="flex gap-3">
                <Button className="flex-1">Register</Button>
                <Button variant="outline" className="flex-1">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
