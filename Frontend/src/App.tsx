import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Announcements from "./pages/Announcements";
import Calendar from "./pages/Calendar";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import Groups from "./pages/Groups";
import Forums from "./pages/Forums";
import ForumPost from "./pages/ForumPost";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import Classes from "./pages/Classes";
import MyClasses from "./pages/MyClasses";
import Timetable from "./pages/Timetable";
import ClassStudents from "./pages/ClassStudents";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><Layout><Announcements /></Layout></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Layout><Resources /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
            <Route path="/forums" element={<ProtectedRoute><Layout><Forums /></Layout></ProtectedRoute>} />
            <Route path="/forums/:id" element={<ProtectedRoute><Layout><ForumPost /></Layout></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
            <Route path="/classes" element={<ProtectedRoute><Layout><Classes /></Layout></ProtectedRoute>} />
            <Route path="/my-classes" element={<ProtectedRoute><Layout><MyClasses /></Layout></ProtectedRoute>} />
            <Route path="/timetable/:id" element={<ProtectedRoute><Layout><Timetable /></Layout></ProtectedRoute>} />
            <Route path="/classes/:id/students" element={<ProtectedRoute><Layout><ClassStudents /></Layout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
