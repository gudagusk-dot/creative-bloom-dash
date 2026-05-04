import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/context/UserContext";
import { StudentsProvider } from "@/context/StudentsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import StudentsDashboard from "./pages/StudentsDashboard.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import Login from "./pages/Login.tsx";
import StudentView from "./pages/StudentView.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { userId, loading } = useUser();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!userId) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const LoginRoute = () => {
  const { userId, loading } = useUser();
  if (loading) return null;
  if (userId) return <Navigate to="/" replace />;
  return <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <UserProvider>
        <StudentsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/aluno/:slug" element={<StudentView />} />
                <Route path="/" element={<ProtectedRoute><StudentsDashboard /></ProtectedRoute>} />
                <Route path="/calendario/:slug" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </StudentsProvider>
      </UserProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
