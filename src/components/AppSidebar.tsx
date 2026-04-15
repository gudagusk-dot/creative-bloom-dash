import { CalendarDays, LayoutDashboard, FileText, Menu, X, LogOut } from "lucide-react";
import { useContent } from "@/context/ContentContext";
import { useUser } from "@/context/UserContext";
import { categoryConfig, Category } from "@/data/content";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: CalendarDays, label: "Calendário" },
  { icon: FileText, label: "Conteúdos" },
];

const categories = Object.keys(categoryConfig) as Category[];

export const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
    <Menu className="h-5 w-5" />
  </button>
);

export const AppSidebar = ({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) => {
  const { networkFilter, setNetworkFilter, selectedCategories, toggleCategory } = useContent();
  const { userName, logout } = useUser();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:relative z-40 lg:z-auto
        w-64 min-h-screen border-r border-border bg-card flex flex-col shrink-0
        transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Plano de Conteúdo</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
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

        {/* User info + logout */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {userName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{userName}</span>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
