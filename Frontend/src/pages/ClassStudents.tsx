import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Plus, Search, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  phone: string;
}

interface ClassInfo {
  class_id: string;
  class_name: string;
  students: Student[];
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
}

export default function ClassStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const fetchClassStudents = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await apiRequest<ClassInfo>(`/classes/${id}/students`, { token });
      setClassInfo(data);
    } catch (error: any) {
      console.error("Failed to load class students", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  }, [token, id]);

  const fetchAvailableStudents = useCallback(async () => {
    if (!token || !isAdmin) return;
    try {
      const data = await apiRequest<AvailableStudent[]>("/admin/users?role=student", { token });
      setAvailableStudents(data);
    } catch (error: any) {
      console.error("Failed to load available students", error);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    fetchClassStudents();
  }, [fetchClassStudents]);

  useEffect(() => {
    if (isAddDialogOpen && isAdmin) {
      fetchAvailableStudents();
    }
  }, [isAddDialogOpen, isAdmin, fetchAvailableStudents]);

  const handleAddStudents = async () => {
    try {
      if (!token || !id) {
        throw new Error("Missing session or class ID");
      }
      if (selectedStudentIds.length === 0) {
        throw new Error("Please select at least one student");
      }

      await apiRequest(`/classes/${id}/students`, {
        method: "POST",
        token,
        body: {
          studentIds: selectedStudentIds,
        },
      });

      toast({ title: "Success", description: "Students added to class successfully" });
      setIsAddDialogOpen(false);
      setSelectedStudentIds([]);
      fetchClassStudents();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const filteredStudents = availableStudents.filter(
    (student) =>
      !classInfo?.students.some((s) => s.id === student.id) &&
      (searchTerm === "" ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!classInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/classes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Class Students</h1>
            <p className="text-muted-foreground mt-1">
              {classInfo.class_name} - {classInfo.students.length} students
            </p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Students
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Students to Class</DialogTitle>
                <DialogDescription>
                  Select students to add to {classInfo.class_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={
                              filteredStudents.length > 0 &&
                              filteredStudents.every((s) =>
                                selectedStudentIds.includes(s.id)
                              )
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds(
                                  filteredStudents.map((s) => s.id)
                                );
                              } else {
                                setSelectedStudentIds([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds([
                                    ...selectedStudentIds,
                                    student.id,
                                  ]);
                                } else {
                                  setSelectedStudentIds(
                                    selectedStudentIds.filter(
                                      (id) => id !== student.id
                                    )
                                  );
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.department}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredStudents.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <p className="text-muted-foreground">
                              {searchTerm
                                ? "No students found matching your search"
                                : "No available students to add"}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedStudentIds.length} student(s) selected
                  </p>
                  <Button
                    onClick={handleAddStudents}
                    disabled={selectedStudentIds.length === 0}
                  >
                    Add Selected Students
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students ({classInfo.students.length})
          </CardTitle>
          <CardDescription>
            List of all students enrolled in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classInfo.students.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No students enrolled in this class yet.
              </p>
              {isAdmin && (
                <p className="text-sm text-muted-foreground mt-2">
                  Click "Add Students" to enroll students.
                </p>
              )}
            </div>
          ) : (
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
                {classInfo.students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.department}</Badge>
                    </TableCell>
                    <TableCell>{student.phone || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

