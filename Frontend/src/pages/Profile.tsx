import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  avatarUrl: string;
  preferences: {
    language: string;
    theme: "light" | "dark" | "system";
  };
};

const defaultProfile: ProfileData = {
  id: "",
  name: "",
  email: "",
  role: "",
  phone: "",
  department: "",
  avatarUrl: "",
  preferences: {
    language: "en",
    theme: "light",
  },
};

const languages = [
  { label: "English", value: "en" },
  { label: "Hindi", value: "hi" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
];

const themes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function Profile() {
  const { token, updateUser, user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await apiRequest<ProfileData>("/common/profile", { token });
        setProfile(data);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Unable to load profile",
          description: error.message || "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field: keyof ProfileData["preferences"], value: string) => {
    setProfile((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const updated = await apiRequest<ProfileData>("/common/profile", {
        method: "PUT",
        token,
        body: {
          name: profile.name,
          phone: profile.phone,
          department: profile.department,
          avatarUrl: profile.avatarUrl,
          preferences: profile.preferences,
        },
      });
      setProfile(updated);
      updateUser({ name: updated.name, email: updated.email });
      toast({ title: "Profile updated", description: "Your changes were saved." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  };

  const avatarInitials = profile.name
    ? profile.name
        .split(" ")
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and preferences.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <CardDescription>Review and update your public profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <Label>Avatar URL</Label>
                  <Input
                    value={profile.avatarUrl}
                    onChange={(e) => handleChange("avatarUrl", e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>
              </div>
              <div className="flex-1 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profile.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your name"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={profile.role} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={profile.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="e.g., Computer Science"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Preferred Language</Label>
                <Select
                  value={profile.preferences.language}
                  onValueChange={(value) => handlePreferenceChange("language", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={profile.preferences.theme}
                  onValueChange={(value: "light" | "dark" | "system") => handlePreferenceChange("theme", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        {theme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving || loading}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

