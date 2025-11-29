import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, Users, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface MyClass {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  academic_year: string;
  assigned_faculties: Array<{
    faculty: {
      id: string;
      name: string;
      email: string;
      department: string;
    };
    subject: string;
    role: string;
  }>;
  student_count: number;
  status: string;
}

export default function StudentClasses() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiRequest<MyClass[]>("/classes", { token });
      setClasses(data);
    } catch (error: any) {
      console.error("Failed to load classes", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground mt-1">
          View your enrolled classes and timetables
        </p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              You are not enrolled in any classes yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{classItem.name}</CardTitle>
                    <CardDescription>{classItem.code}</CardDescription>
                  </div>
                  <Badge variant="outline">{classItem.department}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      Sem {classItem.semester}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {classItem.student_count} students
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium mb-1">Assigned Faculties:</p>
                    {classItem.assigned_faculties.length > 0 ? (
                      <ul className="space-y-1">
                        {classItem.assigned_faculties.map((af, idx) => (
                          <li key={idx} className="text-muted-foreground">
                            • {af.faculty.name} - {af.subject}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground">No faculty assigned</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/timetable/${classItem.id}`)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      View Timetable
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

