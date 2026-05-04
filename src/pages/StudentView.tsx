import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentProvider } from "@/context/ContentContext";
import { TopBar } from "@/components/TopBar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid } from "@/components/CalendarGrid";
import { supabase } from "@/integrations/supabase/client";

interface StudentLite { id: string; owner_id: string; name: string; slug: string; }

const StudentView = () => {
  const { slug, ownerId: legacyOwnerId } = useParams<{ slug?: string; ownerId?: string }>();
  const [student, setStudent] = useState<StudentLite | null | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      // New route: /aluno/:slug
      if (slug) {
        const { data } = await supabase.from("students").select("id, owner_id, name, slug").eq("slug", slug).maybeSingle();
        setStudent((data as StudentLite) || null);
        return;
      }
      // Legacy route: /aluno/:ownerId — fallback to first student of that owner
      if (legacyOwnerId) {
        const { data } = await supabase
          .from("students")
          .select("id, owner_id, name, slug")
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

  return (
    <ContentProvider studentId={student.id} ownerId={student.owner_id} viewMode="student">
      <div className="min-h-screen w-full flex flex-col">
        <TopBar viewMode="student" student={student as any} />
        <CalendarHeader />
        <KpiCards />
        <CalendarGrid />
      </div>
    </ContentProvider>
  );
};

export default StudentView;
