import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useStudents, Student } from "@/context/StudentsContext";
import { CalendarDays, LogOut, Plus, Users } from "lucide-react";
import { StudentCard } from "@/components/StudentCard";
import { NewStudentDialog } from "@/components/NewStudentDialog";
import { ShareDialog } from "@/components/ShareDialog";
import { ThemeToggle } from "@/components/ThemeToggle";

const StudentsDashboard = () => {
  const { userName, logout } = useUser();
  const { students, loading, deleteStudent } = useStudents();
  const [newOpen, setNewOpen] = useState(false);
  const [shareStudent, setShareStudent] = useState<Student | null>(null);

  const handleDelete = async (s: Student) => {
    if (!confirm(`Excluir o calendário de ${s.name}? Todos os conteúdos serão removidos.`)) return;
    await deleteStudent(s.id);
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <span className="text-sm sm:text-lg font-semibold text-foreground truncate">Plano de Conteúdo</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userName && (
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden sm:inline text-xs font-medium text-foreground">{userName}</span>
                <button onClick={logout} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" title="Sair">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Meus alunos</h1>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{students.length}</span>
          </div>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" /> Novo calendário
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : students.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-base font-semibold text-foreground mb-1">Nenhum aluno cadastrado ainda</h2>
            <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro calendário para começar.</p>
            <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Plus className="h-4 w-4" /> Criar calendário
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {students.map(s => (
              <StudentCard key={s.id} student={s} onShare={setShareStudent} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      <NewStudentDialog open={newOpen} onClose={() => setNewOpen(false)} />
      {shareStudent && (
        <ShareDialog open={!!shareStudent} onClose={() => setShareStudent(null)} student={shareStudent} />
      )}
    </div>
  );
};

export default StudentsDashboard;
