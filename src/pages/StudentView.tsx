import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ContentProvider } from "@/context/ContentContext";
import { TopBar } from "@/components/TopBar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid } from "@/components/CalendarGrid";
import { supabase } from "@/integrations/supabase/client";

const StudentView = () => {
  const { ownerId } = useParams<{ ownerId: string }>();
  const [ownerName, setOwnerName] = useState<string>("");

  useEffect(() => {
    if (!ownerId) return;
    supabase.from("simple_users").select("name").eq("id", ownerId).maybeSingle().then(({ data }) => {
      if (data?.name) setOwnerName(data.name);
    });
  }, [ownerId]);

  if (!ownerId) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Link inválido</div>;
  }

  return (
    <ContentProvider ownerIdOverride={ownerId} viewMode="student">
      <div className="min-h-screen w-full flex flex-col">
        <TopBar viewMode="student" ownerId={ownerId} ownerName={ownerName} />
        <CalendarHeader />
        <KpiCards />
        <CalendarGrid />
      </div>
    </ContentProvider>
  );
};

export default StudentView;
