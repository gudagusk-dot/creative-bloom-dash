import { useState } from "react";
import { ContentProvider } from "@/context/ContentContext";
import { AppSidebar } from "@/components/AppSidebar";
import { CalendarHeader } from "@/components/CalendarHeader";
import { KpiCards } from "@/components/KpiCards";
import { CalendarGrid } from "@/components/CalendarGrid";
import { NewPostDialog } from "@/components/NewPostDialog";
import { Plus } from "lucide-react";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);

  return (
    <ContentProvider>
      <div className="flex min-h-screen w-full relative">
        <AppSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <CalendarHeader onMenuOpen={() => setSidebarOpen(true)} onNewPost={() => setNewPostOpen(true)} />
          <KpiCards />
          <CalendarGrid />
        </div>

        <button
          onClick={() => setNewPostOpen(true)}
          className="sm:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-20 hover:opacity-90 transition-opacity"
        >
          <Plus className="h-6 w-6" />
        </button>

        <NewPostDialog open={newPostOpen} onClose={() => setNewPostOpen(false)} />
      </div>
    </ContentProvider>
  );
};

export default Index;
