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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Users,
  Package,
  Calendar,
  ArrowRight,
  Plus,
} from "lucide-react";
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
  my_assignment: {
    subject: string;
    role: string;
  };
  student_count: number;
  timetable: any;
}

interface Resource {
  id: string;
  name: string;
  description: string;
  category: { id: string; name: string } | null;
  location: string;
  status: string;
  total_quantity: number;
  available_quantity: number;
  department: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
}

export default function FacultyClasses() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<MyClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<MyClass | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [isResourceDialogOpen, setIsResourceDialogOpen] = useState(false);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<MyClass[]>("/faculty/classes", { token });
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0]);
      }
    } catch (error: any) {
      console.error("Failed to load classes", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token, selectedClass]);

  const fetchClassResources = useCallback(async () => {
    if (!token || !selectedClass) return;
    try {
      const data = await apiRequest<Resource[]>(
        `/faculty/classes/${selectedClass.id}/resources`,
        { token }
      );
      setResources(data);
    } catch (error: any) {
      console.error("Failed to load resources", error);
    }
  }, [token, selectedClass]);

  const fetchClassStudents = useCallback(async () => {
    if (!token || !selectedClass) return;
    try {
      const data = await apiRequest<{ students: Student[] }>(
        `/faculty/classes/${selectedClass.id}/students`,
        { token }
      );
      setStudents(data.students);
    } catch (error: any) {
      console.error("Failed to load students", error);
    }
  }, [token, selectedClass]);

  const fetchAllResources = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<Resource[]>("/common/resources", { token });
      setAllResources(data);
    } catch (error: any) {
      console.error("Failed to load all resources", error);
    }
  }, [token]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassResources();
      fetchClassStudents();
    }
  }, [selectedClass, fetchClassResources, fetchClassStudents]);

  useEffect(() => {
    if (isResourceDialogOpen) {
      fetchAllResources();
    }
  }, [isResourceDialogOpen, fetchAllResources]);

  const handleAssignResource = async (resourceId: string) => {
    try {
      if (!token || !selectedClass) {
        throw new Error("Missing session or class selection");
      }

      await apiRequest(`/faculty/classes/${selectedClass.id}/resources`, {
        method: "POST",
        token,
        body: { resourceId },
      });

      toast({ title: "Success", description: "Resource assigned to class" });
      setIsResourceDialogOpen(false);
      fetchClassResources();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (classes.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No classes assigned to you yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Classes</h1>
        <p className="text-muted-foreground mt-1">
          Manage resources and view students for your assigned classes
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classes.map((cls) => (
                  <Button
                    key={cls.id}
                    variant={selectedClass?.id === cls.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedClass(cls)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {cls.my_assignment.subject}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {selectedClass && (
            <Tabs defaultValue="resources" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedClass.name}</h2>
                  <p className="text-muted-foreground">
                    {selectedClass.code} • {selectedClass.department} • Semester{" "}
                    {selectedClass.semester}
                  </p>
                </div>
              </div>

              <TabsList>
                <TabsTrigger value="resources">
                  <Package className="mr-2 h-4 w-4" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="students">
                  <Users className="mr-2 h-4 w-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="timetable">
                  <Calendar className="mr-2 h-4 w-4" />
                  Timetable
                </TabsTrigger>
              </TabsList>

              <TabsContent value="resources" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Class Resources</h3>
                  <Dialog
                    open={isResourceDialogOpen}
                    onOpenChange={setIsResourceDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Resource
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Assign Resource to Class</DialogTitle>
                        <DialogDescription>
                          Select a resource to assign to {selectedClass.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {allResources
                          .filter(
                            (r) =>
                              !r.department ||
                              r.department === selectedClass.department ||
                              r.department === "General"
                          )
                          .map((resource) => (
                            <Card
                              key={resource.id}
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => handleAssignResource(resource.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{resource.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {resource.description}
                                    </div>
                                    <Badge variant="outline" className="mt-2">
                                      {resource.category?.name || "Uncategorized"}
                                    </Badge>
                                  </div>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {resources.map((resource) => (
                    <Card key={resource.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge
                              variant={
                                resource.status === "available"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {resource.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Available:</span>
                            <span>
                              {resource.available_quantity} / {resource.total_quantity}
                            </span>
                          </div>
                          {resource.location && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span>{resource.location}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {resources.length === 0 && (
                    <Card className="col-span-full">
                      <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                          No resources assigned to this class yet.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-4">
                <h3 className="text-lg font-semibold">Class Students</h3>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.name}
                            </TableCell>
                            <TableCell>{student.email}</TableCell>
                            <TableCell>{student.department}</TableCell>
                            <TableCell>{student.phone || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                        {students.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              <p className="text-muted-foreground">
                                No students enrolled in this class yet.
                              </p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="timetable" className="space-y-4">
                <h3 className="text-lg font-semibold">Class Timetable</h3>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground">
                      Timetable management coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

