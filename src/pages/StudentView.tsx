import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentProvider } from "@/context/ContentContext";
import { TopBar } from "@/components/TopBar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid, useCalendarView } from "@/components/CalendarGrid";
import { StudentOverview } from "@/components/StudentOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Calendar as CalendarIcon, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StudentLite { id: string; owner_id: string; name: string; slug: string; calendar_published: boolean; }

const StudentView = () => {
  const { slug, ownerId: legacyOwnerId } = useParams<{ slug?: string; ownerId?: string }>();
  const [student, setStudent] = useState<StudentLite | null | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      // New route: /aluno/:slug
      if (slug) {
        const { data } = await supabase.from("students").select("id, owner_id, name, slug, calendar_published").eq("slug", slug).maybeSingle();
        setStudent((data as StudentLite) || null);
        return;
      }
      // Legacy route: /aluno/:ownerId — fallback to first student of that owner
      if (legacyOwnerId) {
        const { data } = await supabase
          .from("students")
          .select("id, owner_id, name, slug, calendar_published")
          .eq("owner_id", legacyOwnerId)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        setStudent((data as StudentLite) || null);
      }
    };
    load();
  }, [slug, legacyOwnerId]);

  if (student === undefined) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!student) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Calendário não encontrado.</div>;
  
  if (!student.calendar_published) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
          <EyeOff className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-display font-light text-foreground">Calendário em Manutenção</h2>
        <p className="text-muted-foreground max-w-md">
          Seu mentor está preparando as próximas novidades. Em breve este calendário estará disponível para você!
        </p>
      </div>
    );
  }

  return (
    <StudentViewInner student={student} />
  );
};

const StudentViewInner = ({ student }: { student: StudentLite }) => {
  const { view, setView } = useCalendarView();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <ContentProvider studentId={student.id} ownerId={student.owner_id} viewMode="student">
      <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern pointer-events-none opacity-40" />
        <TopBar viewMode="student" student={student as any} />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col relative">
          <div className="px-4 sm:px-6 py-2 border-b border-border/40 bg-card/40 backdrop-blur-sm sticky top-[57px] z-20">
            <div className="max-w-5xl mx-auto flex justify-center sm:justify-start">
              <TabsList className="bg-muted/50 p-1 h-auto gap-1">
                <TabsTrigger value="overview" className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Visão Geral
                </TabsTrigger>
                <TabsTrigger value="calendar" className="data-[state=active]:bg-card data-[state=active]:shadow-sm px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <CalendarIcon className="h-3.5 w-3.5" /> Calendário
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="mt-0 flex-1 pt-8 focus-visible:outline-none">
            <StudentOverview onShowCalendar={() => setActiveTab("calendar")} studentName={student.name} />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 flex-1 focus-visible:outline-none">
            <CalendarHeader view={view} onChangeView={setView} />
            {view === "month" && <KpiCards />}
            <CalendarGrid view={view} />
          </TabsContent>
        </Tabs>
      </div>
    </ContentProvider>
  );
};

export default StudentView;
