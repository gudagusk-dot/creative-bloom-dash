import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { ContentProvider } from "@/context/ContentContext";
import { TopBar } from "@/components/TopBar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid, useCalendarView } from "@/components/CalendarGrid";
import { NewPostDialog } from "@/components/NewPostDialog";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Plus } from "lucide-react";
import { useStudents, Student } from "@/context/StudentsContext";
import { useUser } from "@/context/UserContext";

const CalendarPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { userId } = useUser();
  const { getBySlug } = useStudents();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const { view, setView } = useCalendarView();

  useEffect(() => {
    if (!slug) return;
    getBySlug(slug).then(setStudent);
  }, [slug, getBySlug]);

  if (student === undefined) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!student) return <Navigate to="/" replace />;
  if (!userId) return <Navigate to="/login" replace />;

  return (
    <ContentProvider studentId={student.id} ownerId={userId} viewMode="admin">
      <div className="min-h-screen w-full flex flex-col">
        <TopBar viewMode="admin" student={student} />
        <CalendarHeader onNewPost={() => setNewPostOpen(true)} view={view} onChangeView={setView} />
        {view === "month" && <KpiCards />}
        <CalendarGrid view={view} />
        <GlobalSearch />

        <button
          onClick={() => setNewPostOpen(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary text-primary-foreground rounded-full shadow-soft-lg flex items-center justify-center z-20 hover:scale-110 active:scale-95 transition-transform ease-soft"
        >
          <Plus className="h-6 w-6" />
        </button>

        <NewPostDialog open={newPostOpen} onClose={() => setNewPostOpen(false)} />
      </div>
    </ContentProvider>
  );
};

export default CalendarPage;
