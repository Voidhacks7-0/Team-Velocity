import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MessageSquare, Calendar } from "lucide-react";

const groups = [
  {
    id: 1,
    name: "Full Stack Dev Club",
    members: 234,
    description: "Learn web development with React, Node.js, and modern tools.",
  },
  {
    id: 2,
    name: "AI & ML Enthusiasts",
    members: 156,
    description:
      "Explore machine learning, deep learning, and AI applications.",
  },
  {
    id: 3,
    name: "Mobile App Dev",
    members: 142,
    description: "Build iOS and Android apps with the latest frameworks.",
  },
  {
    id: 4,
    name: "DevOps & Cloud",
    members: 98,
    description: "Master AWS, Docker, Kubernetes, and cloud infrastructure.",
  },
];

const forums = [
  {
    id: 1,
    title: "How to get started with React?",
    author: "Alex Johnson",
    replies: 24,
    views: 342,
  },
  {
    id: 2,
    title: "Best practices for API design",
    author: "Sarah Lee",
    replies: 18,
    views: 289,
  },
  {
    id: 3,
    title: "Database optimization tips",
    author: "Mike Chen",
    replies: 12,
    views: 156,
  },
];

const meetups = [
  {
    id: 1,
    title: "Weekly Code Review Session",
    date: "Dec 1, 2025",
    time: "6:00 PM",
    attendees: 32,
  },
  {
    id: 2,
    title: "Frontend Developers Meetup",
    date: "Dec 5, 2025",
    time: "5:30 PM",
    attendees: 47,
  },
  {
    id: 3,
    title: "Backend Architecture Discussion",
    date: "Dec 8, 2025",
    time: "7:00 PM",
    attendees: 28,
  },
];

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-200/20 dark:border-purple-900/20 p-8">
          <h1 className="text-4xl font-bold mb-2">Community Hub</h1>
          <p className="text-muted-foreground">
            Connect with peers, join groups, and participate in discussions.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="groups">
            <Users className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="forums">
            <MessageSquare className="h-4 w-4 mr-2" />
            Forums
          </TabsTrigger>
          <TabsTrigger value="meetups">
            <Calendar className="h-4 w-4 mr-2" />
            Meetups
          </TabsTrigger>
        </TabsList>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {group.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-accent">
                    {group.members} members
                  </span>
                  <Button size="sm">Join</Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Forums Tab */}
        <TabsContent value="forums" className="space-y-4">
          <div className="space-y-4">
            {forums.map((forum) => (
              <Card
                key={forum.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <h3 className="text-lg font-semibold mb-2">{forum.title}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>By {forum.author}</span>
                  <span>{forum.replies} replies</span>
                  <span>{forum.views} views</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Meetups Tab */}
        <TabsContent value="meetups" className="space-y-4">
          <div className="space-y-4">
            {meetups.map((meetup) => (
              <Card
                key={meetup.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{meetup.title}</h3>
                  <Button size="sm">RSVP</Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{meetup.date}</span>
                  <span>{meetup.time}</span>
                  <span className="ml-auto">{meetup.attendees} attending</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
