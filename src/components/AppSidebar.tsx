import { CalendarDays, LayoutDashboard, FileText, BarChart3 } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { categoryConfig, Category } from "@/data/content";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: CalendarDays, label: "Calendário" },
  { icon: FileText, label: "Conteúdos" },
  { icon: BarChart3, label: "Métricas" },
];

const categories = Object.keys(categoryConfig) as Category[];

export const AppSidebar = () => {
  const { networkFilter, setNetworkFilter, selectedCategories, toggleCategory } = useContent();

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Content Planner</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1">
        {navItems.map((item, i) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              i === 1
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Network filter */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rede Social</p>
        <div className="flex gap-1.5">
          {(["all", "Instagram", "TikTok"] as const).map(n => (
            <button
              key={n}
              onClick={() => setNetworkFilter(n)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                networkFilter === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-muted"
              }`}
            >
              {n === "all" ? "Ambos" : n}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="px-4 py-3 border-t border-border flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Categorias</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                  active ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-foreground/20"
                }`}
                style={active ? { backgroundColor: categoryConfig[cat].color } : {}}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ backgroundColor: categoryConfig[cat].color }}
                />
                {cat}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
