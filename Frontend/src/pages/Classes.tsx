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
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Plus, BookOpen, Calendar, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface ClassItem {
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

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
}

export default function Classes() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    code: "",
    department: "CSE",
    semester: 1,
    academicYear: "2024-2025",
  });
  const [assignments, setAssignments] = useState<Array<{
    facultyId: string;
    facultyName: string;
    subject: string;
    role: string;
  }>>([]);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiRequest<ClassItem[]>("/classes", { token });
      setClasses(data);
    } catch (error: any) {
      console.error("Failed to load classes", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token]);

  const fetchFaculties = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoadingFaculties(true);
    try {
      // Fetch all faculty users from backend API - users with role='faculty'
      console.log("Fetching faculties from /admin/users?role=faculty");
      const data = await apiRequest<Faculty[]>("/admin/users?role=faculty", { token });
      console.log("Received faculties data:", data);
      
      // Filter to ensure only faculty role users are included
      const facultyList = Array.isArray(data) 
        ? data.filter((user: any) => user.role === 'faculty')
        : [];
      
      if (facultyList.length > 0) {
        setFaculties(facultyList);
        console.log(`Loaded ${facultyList.length} faculty members`);
      } else {
        setFaculties([]);
        console.warn("No faculty members found in database");
        toast({
          title: "No Faculty Found",
          description: "No faculty members found. Run 'npm run create-faculty' in backend to create mock data.",
        });
      }
    } catch (error: any) {
      console.error("Failed to load faculties:", error);
      setFaculties([]);
      toast({
        variant: "destructive",
        title: "Error Loading Faculties",
        description: error.message || "Failed to fetch faculty list from backend API",
      });
    } finally {
      setLoadingFaculties(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (isAdmin) {
      fetchFaculties();
    }
  }, [isAdmin, fetchFaculties]);

  // Fetch faculties when assign dialog opens
  useEffect(() => {
    if (isAssignOpen && isAdmin && faculties.length === 0) {
      fetchFaculties();
    }
  }, [isAssignOpen, isAdmin]);

  const handleCreateClass = async () => {
    try {
      if (!token) {
        throw new Error("Missing session. Please sign in again.");
      }
      if (!newClass.name || !newClass.code) {
        throw new Error("Name and code are required");
      }

      await apiRequest("/classes", {
        method: "POST",
        token,
        body: newClass,
      });

      toast({ title: "Success", description: "Class created successfully" });
      setIsCreateOpen(false);
      setNewClass({
        name: "",
        code: "",
        department: "CSE",
        semester: 1,
        academicYear: "2024-2025",
      });
      fetchClasses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleAddAssignment = () => {
    setAssignments([...assignments, { facultyId: "", facultyName: "", subject: "", role: "primary" }]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleUpdateAssignment = (index: number, field: string, value: string) => {
    const updated = [...assignments];
    if (field === "facultyId") {
      const faculty = faculties.find(f => f.id === value);
      updated[index] = {
        ...updated[index],
        facultyId: value,
        facultyName: faculty ? faculty.name : "",
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setAssignments(updated);
  };

  const handleAssignFaculties = async () => {
    try {
      if (!token || !selectedClass) {
        throw new Error("Missing session or class selection");
      }
      if (assignments.length === 0) {
        throw new Error("Please add at least one faculty assignment");
      }

      // Validate all assignments
      for (const assignment of assignments) {
        if (!assignment.facultyId || !assignment.subject) {
          throw new Error("All assignments must have faculty and subject");
        }
      }

      // Assign faculties one by one
      for (const assignment of assignments) {
        await apiRequest(`/classes/${selectedClass}/assign-faculty`, {
          method: "POST",
          token,
          body: {
            facultyId: assignment.facultyId,
            subject: assignment.subject,
            role: assignment.role,
          },
        });
      }

      toast({ 
        title: "Success", 
        description: `${assignments.length} faculty member(s) assigned successfully` 
      });
      setIsAssignOpen(false);
      setAssignments([]);
      setSelectedClass(null);
      fetchClasses();
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
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin
              ? "Manage classes and assign faculties"
              : "View your assigned classes"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Create a new class/section for a department
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Class Name</Label>
                  <Input
                    value={newClass.name}
                    onChange={(e) =>
                      setNewClass({ ...newClass, name: e.target.value })
                    }
                    placeholder="e.g., CSE-A, IT-B"
                  />
                </div>
                <div>
                  <Label>Class Code</Label>
                  <Input
                    value={newClass.code}
                    onChange={(e) =>
                      setNewClass({ ...newClass, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., CSE3A"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Department</Label>
                    <Select
                      value={newClass.department}
                      onValueChange={(value) =>
                        setNewClass({ ...newClass, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSE">CSE</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="AD">AD</SelectItem>
                        <SelectItem value="Civil">Civil</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Input
                      type="number"
                      min={1}
                      max={8}
                      value={newClass.semester}
                      onChange={(e) =>
                        setNewClass({
                          ...newClass,
                          semester: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input
                    value={newClass.academicYear}
                    onChange={(e) =>
                      setNewClass({ ...newClass, academicYear: e.target.value })
                    }
                    placeholder="2024-2025"
                  />
                </div>
                <Button onClick={handleCreateClass} className="w-full">
                  Create Class
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSelectedClass(classItem.id);
                      setIsAssignOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Faculty
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {classes.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {isAdmin
                  ? "No classes created yet. Create one to get started!"
                  : "No classes assigned to you yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <Dialog open={isAssignOpen} onOpenChange={(open) => {
          setIsAssignOpen(open);
          if (!open) {
            setAssignments([]);
            setSelectedClass(null);
          } else {
            // Fetch faculties when dialog opens
            fetchFaculties();
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Faculties to Class</DialogTitle>
              <DialogDescription>
                Assign multiple faculty members to teach different subjects in this class
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No faculty assignments added yet.</p>
                    <p className="text-sm">Click "Add Faculty" to start assigning.</p>
                  </div>
                ) : (
                  assignments.map((assignment, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium">Assignment {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Faculty</Label>
                          {loadingFaculties ? (
                            <div className="flex items-center justify-center p-4 border rounded-md">
                              <p className="text-sm text-muted-foreground">Loading faculties from backend...</p>
                            </div>
                          ) : faculties.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-4 border rounded-md bg-muted/50">
                              <Users className="h-8 w-8 mb-2 text-muted-foreground opacity-50" />
                              <p className="text-sm text-muted-foreground text-center">
                                No faculties available
                              </p>
                              <p className="text-xs text-muted-foreground text-center mt-1">
                                Run: npm run create-faculty
                              </p>
                            </div>
                          ) : (
                            <Select
                              value={assignment.facultyId}
                              onValueChange={(value) =>
                                handleUpdateAssignment(index, "facultyId", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select faculty from backend" />
                              </SelectTrigger>
                              <SelectContent>
                                {faculties.map((faculty) => {
                                  // Check if this faculty is already selected in another assignment
                                  const isAlreadySelected = assignments.some(
                                    (a, i) => i !== index && a.facultyId === faculty.id
                                  );
                                  return (
                                    <SelectItem
                                      key={faculty.id}
                                      value={faculty.id}
                                      disabled={isAlreadySelected}
                                    >
                                      {faculty.name} ({faculty.department})
                                      {isAlreadySelected && " - Already selected"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div>
                          <Label>Subject</Label>
                          <Input
                            value={assignment.subject}
                            onChange={(e) =>
                              handleUpdateAssignment(index, "subject", e.target.value)
                            }
                            placeholder="e.g., Data Structures"
                          />
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Select
                            value={assignment.role}
                            onValueChange={(value) =>
                              handleUpdateAssignment(index, "role", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">Primary</SelectItem>
                              <SelectItem value="secondary">Secondary</SelectItem>
                              <SelectItem value="assistant">Assistant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
              <Button
                variant="outline"
                onClick={handleAddAssignment}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Faculty
              </Button>
              <Button
                onClick={handleAssignFaculties}
                className="w-full"
                disabled={assignments.length === 0}
              >
                Assign {assignments.length > 0 ? `${assignments.length} ` : ""}Faculty
                {assignments.length !== 1 ? " Members" : " Member"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

