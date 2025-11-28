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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageSquare, Plus, Search, ThumbsUp, Pin, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
  category: string;
  tags: string[];
  views: number;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_reply_at: string;
  created_at: string;
}

export default function Forums() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState("recent");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general", tags: "" });

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      if (search) params.append("search", search);
      params.append("sort", sort);

      const data = await apiRequest<ForumPost[]>(
        `/forums?${params.toString()}`,
        { token }
      );
      setPosts(data);
    } catch (error: any) {
      console.error("Failed to load forum posts", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token, category, search, sort]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      if (!newPost.title || !newPost.content) {
        throw new Error("Title and content are required");
      }

      const tags = newPost.tags.split(",").map(t => t.trim()).filter(Boolean);
      await apiRequest("/forums", {
        method: "POST",
        token,
        body: {
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          tags,
        },
      });

      toast({ title: "Success", description: "Post created successfully" });
      setIsCreateOpen(false);
      setNewPost({ title: "", content: "", category: "general", tags: "" });
      fetchPosts();
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
          <h1 className="text-3xl font-bold">Forums</h1>
          <p className="text-muted-foreground mt-1">
            Discuss, ask questions, and share knowledge
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
              <DialogDescription>
                Share your thoughts, ask questions, or start a discussion
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Enter post title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newPost.category}
                  onValueChange={(value) => setNewPost({ ...newPost, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="help">Help</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="Write your post content here..."
                  rows={8}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="react, nodejs, hackathon"
                />
              </div>
              <Button onClick={handleCreatePost} className="w-full">
                Create Post
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
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="hackathon">Hackathon</SelectItem>
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="help">Help</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/forums/${post.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                    {post.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    <Badge variant="outline">{post.category}</Badge>
                  </div>
                  <CardTitle>{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-2">
                    {post.content}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>By {post.author.name}</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.reply_count} replies
                  </span>
                  <span>{post.views} views</span>
                </div>
                <div className="flex gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {posts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts found. Be the first to post!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

