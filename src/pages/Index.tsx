import { ContentProvider } from "@/context/ContentContext";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid } from "@/components/CalendarGrid";

const Index = () => {
  return (
    <ContentProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <CalendarHeader />
          <KpiCards />
          <CalendarGrid />
        </div>
      </div>
    </ContentProvider>
  );
};

export default Index;
