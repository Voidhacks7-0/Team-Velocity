import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, Search, Rocket, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
  team_size: number;
  max_team_size: number;
  required_skills: string[];
  project_type: string;
  status: string;
  tags: string[];
  repository_url: string;
  demo_url: string;
  deadline: string | null;
  created_at: string;
  has_applied?: boolean;
  application_status?: string;
}

export default function Projects() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    maxTeamSize: 5,
    requiredSkills: "",
    projectType: "hackathon",
    tags: "",
    repositoryUrl: "",
    demoUrl: "",
    deadline: "",
  });

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (type !== "all") params.append("type", type);
      if (status !== "all") params.append("status", status);
      if (search) params.append("search", search);

      const data = await apiRequest<Project[]>(
        `/projects?${params.toString()}`,
        { token }
      );
      setProjects(data);
    } catch (error: any) {
      console.error("Failed to load projects", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token, type, status, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      if (!newProject.title || !newProject.description) {
        throw new Error("Title and description are required");
      }

      const requiredSkills = newProject.requiredSkills.split(",").map(s => s.trim()).filter(Boolean);
      const tags = newProject.tags.split(",").map(t => t.trim()).filter(Boolean);

      await apiRequest("/projects", {
        method: "POST",
        token,
        body: {
          ...newProject,
          requiredSkills,
          tags,
          deadline: newProject.deadline || null,
        },
      });

      toast({ title: "Success", description: "Project created successfully" });
      setIsCreateOpen(false);
      setNewProject({
        title: "",
        description: "",
        maxTeamSize: 5,
        requiredSkills: "",
        projectType: "hackathon",
        tags: "",
        repositoryUrl: "",
        demoUrl: "",
        deadline: "",
      });
      fetchProjects();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleApply = async (projectId: string) => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }

      const message = prompt("Why do you want to join this project? (optional)");
      await apiRequest(`/projects/${projectId}/apply`, {
        method: "POST",
        token,
        body: {
          message: message || "",
          skills: [],
        },
      });

      toast({ title: "Success", description: "Application submitted successfully" });
      fetchProjects();
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
          <h1 className="text-3xl font-bold">Project Matchmaking</h1>
          <p className="text-muted-foreground mt-1">
            Find or create projects for hackathons and assignments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Start a new project and find team members
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe your project..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project Type</label>
                  <Select
                    value={newProject.projectType}
                    onValueChange={(value) => setNewProject({ ...newProject, projectType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Max Team Size</label>
                  <Input
                    type="number"
                    value={newProject.maxTeamSize}
                    onChange={(e) => setNewProject({ ...newProject, maxTeamSize: parseInt(e.target.value) || 5 })}
                    min={2}
                    max={20}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Required Skills (comma-separated)</label>
                <Input
                  value={newProject.requiredSkills}
                  onChange={(e) => setNewProject({ ...newProject, requiredSkills: e.target.value })}
                  placeholder="react, nodejs, mongodb"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="web, mobile, ai"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Repository URL (optional)</label>
                  <Input
                    value={newProject.repositoryUrl}
                    onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Demo URL (optional)</label>
                  <Input
                    value={newProject.demoUrl}
                    onChange={(e) => setNewProject({ ...newProject, demoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Deadline (optional)</label>
                <Input
                  type="datetime-local"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateProject} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hackathon">Hackathon</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="research">Research</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="recruiting">Recruiting</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card
            key={project.id}
            className="transition-smooth rounded-lg hover:shadow-lg shadow-elevated"
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-primary" />
                <Badge variant="outline">{project.project_type}</Badge>
                <Badge variant={project.status === "recruiting" ? "default" : "secondary"}>
                  {project.status}
                </Badge>
              </div>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription className="line-clamp-3">
                {project.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Created by {project.creator.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>
                      {project.team_size} / {project.max_team_size} members
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.required_skills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {project.required_skills.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{project.required_skills.length - 3} more
                    </Badge>
                  )}
                </div>
                {project.has_applied ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>
                      Application {project.application_status === "pending" ? "pending" : project.application_status}
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleApply(project.id)}
                    disabled={project.status !== "recruiting" || project.team_size >= project.max_team_size}
                    className="w-full"
                    variant={project.status === "recruiting" ? "default" : "secondary"}
                  >
                    {project.status === "recruiting" && project.team_size < project.max_team_size
                      ? "Apply to Join"
                      : "Not Accepting"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {projects.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects found. Create one to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

