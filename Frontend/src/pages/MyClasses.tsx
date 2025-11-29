import { useAuth } from "@/contexts/AuthContext";
import FacultyClasses from "./FacultyClasses";
import StudentClasses from "./StudentClasses";

export default function MyClasses() {
  const { user } = useAuth();
  
  if (user?.role === "student") {
    return <StudentClasses />;
  }
  
  return <FacultyClasses />;
}

