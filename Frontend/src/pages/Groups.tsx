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
import { Users, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export default function Groups() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ groups: any[]; myGroupIds: string[] }>(
        "/common/groups",
        { token }
      );
      setGroups(data.groups);
      setMyGroups(new Set(data.myGroupIds));
    } catch (error) {
      console.error("Failed to load groups", error);
    }
  }, [token]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleJoin = async (groupId: string) => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      await apiRequest(`/common/groups/${groupId}/join`, {
        method: "POST",
        token,
      });
      toast({ title: "Success", description: "Joined group successfully" });
      fetchGroups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Collaboration Groups</h1>
        <p className="text-muted-foreground mt-1">
          Join groups and collaborate with peers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const isMember = myGroups.has(group.id);
          return (
            <Card
              key={group.id}
              className="transition-smooth rounded-lg hover:shadow-lg shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{group.group_type}</Badge>
                </div>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {group.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Created by {group.creator?.full_name}
                </p>
                <Button
                  onClick={() => handleJoin(group.id)}
                  disabled={isMember}
                  variant={isMember ? "secondary" : "default"}
                  className="w-full"
                >
                  {isMember ? (
                    "Already a member"
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Join Group
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
