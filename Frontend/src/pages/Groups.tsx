import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
  }, [user]);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from("groups")
      .select("*, creator:profiles(full_name), members:group_members(count)")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (data) setGroups(data);
  };

  const fetchMyGroups = async () => {
    const { data } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user?.id);
    if (data) setMyGroups(new Set(data.map(m => m.group_id)));
  };

  const handleJoin = async (groupId: string) => {
    const { error } = await supabase.from("group_members").insert([{
      group_id: groupId,
      user_id: user?.id,
      role: "member",
    }]);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Success", description: "Joined group successfully" });
      fetchMyGroups();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Collaboration Groups</h1>
        <p className="text-muted-foreground mt-1">Join groups and collaborate with peers</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => {
          const isMember = myGroups.has(group.id);
          return (
            <Card key={group.id} className="transition-smooth hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <Badge variant="outline">{group.group_type}</Badge>
                </div>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription className="line-clamp-2">{group.description}</CardDescription>
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
                  {isMember ? "Already a member" : <><UserPlus className="mr-2 h-4 w-4" />Join Group</>}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
