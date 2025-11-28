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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, UserPlus, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

export default function Groups() {
  const { token } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    groupType: "general",
    maxMembers: 10,
    tags: "",
    isPublic: true,
  });

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<{ groups: any[]; myGroupIds: string[] }>(
        "/groups",
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
      await apiRequest(`/groups/${groupId}/join`, {
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

  const handleCreateGroup = async () => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      if (!newGroup.name || !newGroup.description) {
        throw new Error("Name and description are required");
      }

      const tags = newGroup.tags.split(",").map(t => t.trim()).filter(Boolean);
      await apiRequest("/groups", {
        method: "POST",
        token,
        body: {
          ...newGroup,
          tags,
        },
      });

      toast({ title: "Success", description: "Group created successfully" });
      setIsCreateOpen(false);
      setNewGroup({
        name: "",
        description: "",
        groupType: "general",
        maxMembers: 10,
        tags: "",
        isPublic: true,
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaboration Groups</h1>
          <p className="text-muted-foreground mt-1">
            Join groups and collaborate with peers
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new collaboration group for hackathons, assignments, or general collaboration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Describe your group..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Group Type</label>
                  <Select
                    value={newGroup.groupType}
                    onValueChange={(value) => setNewGroup({ ...newGroup, groupType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Members</label>
                  <Input
                    type="number"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) || 10 })}
                    min={2}
                    max={50}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newGroup.tags}
                  onChange={(e) => setNewGroup({ ...newGroup, tags: e.target.value })}
                  placeholder="react, nodejs, hackathon"
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Created by {group.creator?.full_name}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count || 0} / {group.max_members || 10}</span>
                  </div>
                </div>
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {group.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  onClick={() => handleJoin(group.id)}
                  disabled={isMember || (group.member_count || 0) >= (group.max_members || 10)}
                  variant={isMember ? "secondary" : "default"}
                  className="w-full"
                >
                  {isMember ? (
                    "Already a member"
                  ) : (group.member_count || 0) >= (group.max_members || 10) ? (
                    "Group is full"
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
