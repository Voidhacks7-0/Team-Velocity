import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface ChatMessage {
  id: string;
  content: string;
  message_type: string;
  file_url?: string;
  sender: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
  room_type: string;
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  }>;
}

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(id || null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<ChatRoom[]>("/chats/rooms", { token });
      setRooms(data);
      if (data.length > 0 && !selectedRoomId) {
        setSelectedRoomId(data[0].id);
      }
    } catch (error: any) {
      console.error("Failed to load chat rooms", error);
    }
  }, [token, selectedRoomId]);

  const fetchRoom = useCallback(async (roomId: string) => {
    if (!token) return;
    try {
      const data = await apiRequest<ChatRoom>(`/chats/rooms/${roomId}`, { token });
      setRoom(data);
    } catch (error: any) {
      console.error("Failed to load chat room", error);
    }
  }, [token]);

  const fetchMessages = useCallback(async (roomId: string) => {
    if (!token) return;
    try {
      const data = await apiRequest<ChatMessage[]>(`/chats/rooms/${roomId}/messages`, { token });
      setMessages(data);
    } catch (error: any) {
      console.error("Failed to load messages", error);
    }
  }, [token]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (selectedRoomId) {
      fetchRoom(selectedRoomId);
      fetchMessages(selectedRoomId);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedRoomId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoomId, fetchRoom, fetchMessages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedRoomId) return;
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }

      await apiRequest(`/chats/rooms/${selectedRoomId}/messages`, {
        method: "POST",
        token,
        body: {
          content: messageContent,
        },
      });

      setMessageContent("");
      fetchMessages(selectedRoomId);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (!selectedRoomId && rooms.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chat rooms available. Join a group or project to start chatting!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 h-[calc(100vh-8rem)] flex gap-4">
      {/* Sidebar with chat rooms */}
      <div className="w-64 border-r pr-4">
        <h2 className="text-lg font-semibold mb-4">Chat Rooms</h2>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2">
            {rooms.map((chatRoom) => (
              <Card
                key={chatRoom.id}
                className={`cursor-pointer transition-colors ${
                  selectedRoomId === chatRoom.id ? "bg-primary/10 border-primary" : ""
                }`}
                onClick={() => setSelectedRoomId(chatRoom.id)}
              >
                <CardContent className="p-4">
                  <div className="font-medium">{chatRoom.name}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {chatRoom.description || `${chatRoom.members.length} members`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {room && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>{room.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {room.members.length} members
                </p>
              </CardHeader>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-20rem)] p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender.id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatar_url} />
                            <AvatarFallback>
                              {message.sender.name[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isOwn ? "text-right" : ""}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {message.sender.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <div
                              className={`inline-block p-3 rounded-lg ${
                                isOwn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

