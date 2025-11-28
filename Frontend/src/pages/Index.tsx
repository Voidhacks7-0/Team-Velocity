import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center">
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-4">
              Welcome to Campus Connect
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your unified platform for announcements, events, resources, and
              community collaboration.
            </p>
            <div className="flex gap-3">
              <Link to="/auth">
                <Button variant="default">Get Started</Button>
              </Link>
              <Link to="/announcements">
                <Button variant="outline">View Announcements</Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-lg overflow-hidden shadow-elevated bg-card p-6">
              <img
                src="/image.png"
                alt="Campus"
                className="w-full h-64 object-cover rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
