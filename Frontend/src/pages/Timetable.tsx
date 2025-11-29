import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Save, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface TimeSlot {
  time: string;
  type: 'lecture' | 'lab' | 'break' | 'lunch';
  subject: string;
  faculty: string | null;
  room: string;
}

interface TimetableData {
  class_id: string;
  class_name: string;
  class_code: string;
  timetable: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
  };
  assigned_faculties: Array<{
    id: string;
    name: string;
    email: string;
    department: string;
    subject: string;
    role: string;
  }>;
}

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' }
];

export default function Timetable() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isFaculty = user?.role === "faculty";
  const isStudent = user?.role === "student";
  const canEdit = isAdmin || isFaculty; // Only admin and faculty can edit
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTimetable = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    try {
      const data = await apiRequest<TimetableData>(`/timetable/${id}`, { token });
      setTimetableData(data);
    } catch (error: any) {
      console.error("Failed to load timetable", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleSlotChange = (
    day: string,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    if (!timetableData) return;

    const updatedTimetable = { ...timetableData.timetable };
    const daySlots = [...updatedTimetable[day as keyof typeof updatedTimetable]];
    daySlots[slotIndex] = {
      ...daySlots[slotIndex],
      [field]: value === '' ? null : value
    };
    updatedTimetable[day as keyof typeof updatedTimetable] = daySlots;

    setTimetableData({
      ...timetableData,
      timetable: updatedTimetable
    });
  };

  const handleSave = async () => {
    if (!token || !id || !timetableData) return;
    setSaving(true);
    try {
      await apiRequest(`/timetable/${id}`, {
        method: "PUT",
        token,
        body: {
          timetable: timetableData.timetable,
        },
      });

      toast({ title: "Success", description: "Timetable saved successfully" });
      fetchTimetable();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const getSlotColor = (type: string) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 dark:bg-blue-900';
      case 'lab':
        return 'bg-green-100 dark:bg-green-900';
      case 'lunch':
        return 'bg-orange-100 dark:bg-orange-900';
      case 'break':
        return 'bg-gray-100 dark:bg-gray-800';
      default:
        return 'bg-white dark:bg-gray-900';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading timetable...</p>
      </div>
    );
  }

  if (!timetableData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Timetable not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable</h1>
          <p className="text-muted-foreground mt-1">
            {timetableData.class_name} ({timetableData.class_code})
          </p>
          {isStudent && (
            <p className="text-sm text-muted-foreground mt-1">
              View-only mode
            </p>
          )}
        </div>
        {canEdit && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Timetable"}
          </Button>
        )}
      </div>

      <Tabs defaultValue="monday" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {DAYS.map((day) => (
            <TabsTrigger key={day.key} value={day.key}>
              {day.label.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {DAYS.map((day) => (
          <TabsContent key={day.key} value={day.key} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{day.label} Schedule</CardTitle>
                <CardDescription>
                  {canEdit ? `Manage lectures, labs, breaks, and lunch for ${day.label}` : `View schedule for ${day.label}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetableData.timetable[day.key as keyof typeof timetableData.timetable].map(
                      (slot, index) => (
                        <TableRow
                          key={index}
                          className={slot.type === 'break' || slot.type === 'lunch' ? 'opacity-60' : ''}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {slot.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                slot.type === 'lecture'
                                  ? 'default'
                                  : slot.type === 'lab'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {slot.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {slot.type === 'break' || slot.type === 'lunch' ? (
                              <span className="text-muted-foreground">{slot.subject}</span>
                            ) : canEdit ? (
                              <Input
                                value={slot.subject}
                                onChange={(e) =>
                                  handleSlotChange(day.key, index, 'subject', e.target.value)
                                }
                                placeholder="Enter subject"
                                className="w-full"
                              />
                            ) : (
                              <span className="text-sm">{slot.subject || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {slot.type === 'break' || slot.type === 'lunch' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : canEdit ? (
                              <Select
                                value={slot.faculty || 'none'}
                                onValueChange={(value) =>
                                  handleSlotChange(day.key, index, 'faculty', value === 'none' ? null : value)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select faculty" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {timetableData.assigned_faculties.map((faculty) => (
                                    <SelectItem key={faculty.id} value={faculty.id}>
                                      {faculty.name} - {faculty.subject}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-sm">
                                {slot.faculty
                                  ? timetableData.assigned_faculties.find(f => f.id === slot.faculty)?.name || '-'
                                  : '-'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {slot.type === 'break' || slot.type === 'lunch' ? (
                              <span className="text-muted-foreground">-</span>
                            ) : canEdit ? (
                              <Input
                                value={slot.room}
                                onChange={(e) =>
                                  handleSlotChange(day.key, index, 'room', e.target.value)
                                }
                                placeholder="Room number"
                                className="w-full"
                              />
                            ) : (
                              <span className="text-sm">{slot.room || '-'}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

