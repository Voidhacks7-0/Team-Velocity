import { useEffect, useMemo, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Shield,
  UserRound,
} from "lucide-react";
import { format } from "date-fns";

type ThemeOption = "light" | "dark" | "system";

type ProfileRecord = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  department: string | null;
  phone: string | null;
  preferences: {
    language?: string;
    theme?: ThemeOption;
  } | null;
  created_at: string;
  updated_at: string;
};

const optionalText = z
  .string()
  .trim()
  .max(120, "Too long")
  .optional()
  .or(z.literal(""));

const profileFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your name"),
  department: optionalText,
  phone: optionalText,
  avatar_url: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .optional()
    .or(z.literal("")),
  language: z.string().min(2, "Language is required"),
  theme: z.enum(["light", "dark", "system"]),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
];

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const defaultFormValues: ProfileFormValues = {
  full_name: "",
  department: "",
  phone: "",
  avatar_url: "",
  language: "en",
  theme: "light",
};

const mapProfileToForm = (record: ProfileRecord): ProfileFormValues => ({
  full_name: record.full_name || "",
  department: record.department || "",
  phone: record.phone || "",
  avatar_url: record.avatar_url || "",
  language: record.preferences?.language || "en",
  theme: (record.preferences?.theme as ThemeOption) || "light",
});

const ProfileSkeleton = () => (
  <div className="grid gap-6 lg:grid-cols-3">
    <Card className="lg:col-span-1">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
    <Card className="lg:col-span-2">
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  </div>
);

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [initialValues, setInitialValues] = useState<ProfileFormValues>(defaultFormValues);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: defaultFormValues,
  });
  const currentTheme = form.watch("theme");
  const { isDirty } = form.formState;

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "—";
    return format(new Date(profile.created_at), "PPP");
  }, [profile?.created_at]);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      const mapped = mapProfileToForm(profile);
      setInitialValues(mapped);
      form.reset(mapped);
    }
  }, [profile, form]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast({
        title: "Unable to load profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProfile(data as ProfileRecord);
    }
    setLoading(false);
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) {
      toast({
        title: "Not authenticated",
        description: "Please sign in again to update your profile.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const updates = {
      full_name: values.full_name,
      department: values.department || null,
      phone: values.phone || null,
      avatar_url: values.avatar_url || null,
      preferences: {
        ...(profile?.preferences || {}),
        language: values.language,
        theme: values.theme,
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
      setProfile((prev) => (prev ? { ...prev, ...updates } as ProfileRecord : prev));
    }

    setSaving(false);
  };

  const handleReset = () => {
    form.reset(initialValues);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">We couldn't find your profile data.</p>
        <Button onClick={fetchProfile}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Review and update your campus identity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url ?? ""} alt={profile.full_name} />
                <AvatarFallback className="text-xl font-semibold">
                  {profile.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <div>
                  <p className="text-xl font-semibold">{profile.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
                <Badge variant="secondary" className="w-fit capitalize">
                  {profile.role}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>{profile.phone || "Phone not added"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4 text-primary" />
              <span>{profile.department || "Department not set"}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Member since</p>
                <p className="font-medium">{memberSince}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Theme</p>
                <p className="font-medium capitalize">{currentTheme || "light"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
              <CardDescription>Keep your contact details up to date.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 555 555 5555" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://images.example.com/me.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languageOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Theme</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {themeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={handleReset} disabled={saving || !isDirty}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account summary</CardTitle>
              <CardDescription>Quick facts about your access.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <SummaryTile
                icon={<UserRound className="h-5 w-5 text-primary" />}
                label="Role"
                value={profile.role}
              />
              <SummaryTile
                icon={<Shield className="h-5 w-5 text-primary" />}
                label="Privileges"
                value={
                  profile.role === "admin"
                    ? "Full control"
                    : profile.role === "faculty"
                      ? "Moderate"
                      : "Standard"
                }
              />
              <SummaryTile
                icon={<CalendarDays className="h-5 w-5 text-primary" />}
                label="Last updated"
                value={format(new Date(profile.updated_at), "MMM d, yyyy")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

type SummaryTileProps = {
  icon: ReactNode;
  label: string;
  value?: string;
};

function SummaryTile({ icon, label, value }: SummaryTileProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold capitalize">{value || "—"}</p>
    </div>
  );
}