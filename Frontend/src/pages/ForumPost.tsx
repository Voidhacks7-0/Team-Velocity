import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ThumbsUp, ArrowLeft, Pin, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
  parent_reply_id: string | null;
  likes: number;
  is_solution: boolean;
  created_at: string;
}

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
  replies: ForumReply[];
  created_at: string;
}

export default function ForumPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [parentReplyId, setParentReplyId] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await apiRequest<ForumPost>(`/forums/${id}`, { token });
      setPost(data);
    } catch (error: any) {
      console.error("Failed to load forum post", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token, id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleReply = async () => {
    try {
      if (!token || !id) {
        throw new Error("Missing session. Please sign in again.");
      }
      if (!replyContent.trim()) {
        throw new Error("Reply content is required");
      }

      await apiRequest(`/forums/${id}/replies`, {
        method: "POST",
        token,
        body: {
          content: replyContent,
          parentReplyId: parentReplyId,
        },
      });

      toast({ title: "Success", description: "Reply posted successfully" });
      setReplyContent("");
      setParentReplyId(null);
      fetchPost();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleLike = async (replyId: string) => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      await apiRequest(`/forums/replies/${replyId}/like`, {
        method: "POST",
        token,
      });
      fetchPost();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/forums")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Forums
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {post.is_pinned && <Pin className="h-4 w-4 text-yellow-500" />}
                {post.is_locked && <Lock className="h-4 w-4 text-muted-foreground" />}
                <Badge variant="outline">{post.category}</Badge>
              </div>
              <CardTitle className="text-2xl">{post.title}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 mb-6">
            <Avatar>
              <AvatarImage src={post.author.avatar_url} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{post.author.name}</span>
                <Badge variant="secondary">{post.author.role}</Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{post.content}</p>
              <div className="flex gap-2 flex-wrap">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <span>{post.views} views</span>
            <span>{post.reply_count} replies</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {!post.is_locked && (
        <Card>
          <CardHeader>
            <CardTitle>Post a Reply</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply here..."
              rows={4}
              className="mb-4"
            />
            <Button onClick={handleReply}>Post Reply</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Replies ({post.replies.length})</h2>
        {post.replies.map((reply) => (
          <Card key={reply.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={reply.author.avatar_url} />
                  <AvatarFallback>{reply.author.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{reply.author.name}</span>
                    <Badge variant="secondary">{reply.author.role}</Badge>
                    {reply.is_solution && (
                      <Badge variant="default" className="bg-green-500">
                        Solution
                      </Badge>
                    )}
                  </div>
                  <p className="mb-4">{reply.content}</p>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(reply.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {reply.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setParentReplyId(reply.id);
                        setReplyContent(`@${reply.author.name} `);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Reply
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {new Date(reply.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {post.replies.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No replies yet. Be the first to reply!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

