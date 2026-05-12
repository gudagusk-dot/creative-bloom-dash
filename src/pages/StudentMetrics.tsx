import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStudents, Student } from "@/context/StudentsContext";
import { ContentProvider, useContent } from "@/context/ContentContext";
import { useUser } from "@/context/UserContext";
import { ContentPost } from "@/data/content";
import { 
  ArrowLeft, RefreshCw, ExternalLink, Heart, Eye, MessageCircle, Share2, 
  TrendingUp, CalendarDays, BarChart3, Users, ChevronRight, LayoutDashboard, 
  Instagram, Share, LineChart as LucideLineChart, Sparkles, FileDown, 
  Send, BrainCircuit, Bot
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { TikTokIcon } from "@/components/TikTokIcon";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PostMetric {
  post_id: string;
  platform: string;
  likes: number;
  views: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  fetched_at: string;
}

const StudentMetrics = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { getBySlug } = useStudents();
  const { categories, getCategoryColor } = useContent();
  const [student, setStudent] = useState<Student | null>(null);
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [metrics, setMetrics] = useState<Record<string, PostMetric[]>>({});
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingFollowers, setRefreshingFollowers] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResponse, setCoachResponse] = useState("");
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; });
  const [platformFilter, setPlatformFilter] = useState<"all" | "instagram" | "tiktok">("all");

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const s = await getBySlug(slug);
      if (!s) { navigate("/"); return; }
      setStudent(s);
      await loadAll(s.id);
    })();
  }, [slug]);

  const loadAll = async (studentId: string) => {
    setLoading(true);
    // Parallel fetch for speed
    const [postsRes, snapshotsRes] = await Promise.all([
      supabase.from("content_posts").select("*").eq("student_id", studentId).eq("status", "Publicado"),
      supabase.from("follower_snapshots").select("*").eq("student_id", studentId).order("captured_date", { ascending: true })
    ]);

    const ps = (postsRes.data || []) as any[];
    setPosts(ps as ContentPost[]);
    setSnapshots(snapshotsRes.data || []);

    if (ps.length) {
      const { data: m } = await supabase
        .from("post_metrics")
        .select("*")
        .in("post_id", ps.map(p => p.id));
      const map: Record<string, PostMetric[]> = {};
      (m || []).forEach((row: any) => { 
        if (!map[row.post_id]) map[row.post_id] = [];
        map[row.post_id].push(row as PostMetric); 
      });
      setMetrics(map);
    }
    setLoading(false);
  };

  const fetchFollowers = async () => {
    if (!student?.instagram_handle && !student?.tiktok_handle) {
      toast.error("Cadastre o @ do Instagram ou TikTok do aluno primeiro");
      return;
    }
    setRefreshingFollowers(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-follower-snapshot", {
        body: { student_id: student.id },
      });
      if (error) throw error;

      const results = (data?.results || []) as Array<{ platform: string; status: string; followers?: number; message?: string }>;
      const successes = results.filter(r => r.status === 'success');
      const failures = results.filter(r => r.status !== 'success');

      if (successes.length > 0) {
        const summary = successes.map(r => `${r.platform}: ${(r.followers || 0).toLocaleString("pt-BR")}`).join(" · ");
        toast.success(`Atualizado — ${summary}`);
        await loadAll(student.id);
      }
      failures.forEach(r => {
        toast.warning(`${r.platform}: ${r.status === 'no_data' ? 'verifique o @ informado' : (r.message || 'falhou')}`);
      });
      if (successes.length === 0 && failures.length === 0) {
        toast.info("Nenhuma rede social configurada");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar seguidores");
    } finally {
      setRefreshingFollowers(false);
    }
  };

  const handleAskCoach = async (action: 'analyze' | 'suggest_improvements' | 'performance_analysis') => {
    if (coachLoading) return;
    setCoachLoading(true);
    try {
      const postsContext = monthPosts.map(p => {
        const pMetrics = metrics[p.id] || [];
        return {
          title: p.title,
          category: p.category,
          format: p.format,
          network: p.network,
          status: p.status,
          script: p.script,
          metrics: pMetrics.map(m => ({
            platform: m.platform,
            likes: m.likes,
            views: m.views,
            comments: m.comments,
            shares: m.shares,
            engagement_rate: m.engagement_rate
          }))
        };
      });
      
      const { data, error } = await supabase.functions.invoke("ai-content-coach", {
        body: { 
          action, 
          posts_context: postsContext,
          platform_filter: platformFilter
        }
      });
      if (error) throw error;
      setCoachResponse(data.text);
    } catch (e: any) {
      toast.error("Erro ao consultar o Brenda IA");
    } finally {
      setCoachLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`metricas-${student?.slug || 'aluno'}-${format(month, "MM-yyyy")}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  const instagramStats = useMemo(() => {
    if (snapshots.length === 0) return null;
    const igSnapshots = snapshots.filter(s => (s.platform || "").toLowerCase() === "instagram");
    if (igSnapshots.length === 0) return null;
    
    const latest = igSnapshots[igSnapshots.length - 1];
    const prev = igSnapshots.length > 1 ? igSnapshots[igSnapshots.length - 2] : latest;
    
    const monthStart = startOfMonth(month);
    const firstOfMonthSnap = igSnapshots.find(s => {
      const d = parseISO(s.captured_date);
      return d >= monthStart;
    }) || igSnapshots[0];

    return {
      current: latest.followers,
      dailyChange: latest.followers - prev.followers,
      monthlyChange: latest.followers - firstOfMonthSnap.followers,
      posts: latest.posts_count,
      follows: latest.follows,
      chartData: igSnapshots.slice(-30).map(s => ({
        date: format(parseISO(s.captured_date), "dd/MM"),
        seguidores: s.followers
      }))
    };
  }, [snapshots, month]);

  const tiktokStats = useMemo(() => {
    if (snapshots.length === 0) return null;
    const ttSnapshots = snapshots.filter(s => (s.platform || "").toLowerCase() === "tiktok");
    if (ttSnapshots.length === 0) return null;
    
    const latest = ttSnapshots[ttSnapshots.length - 1];
    const prev = ttSnapshots.length > 1 ? ttSnapshots[ttSnapshots.length - 2] : latest;
    
    const monthStart = startOfMonth(month);
    const firstOfMonthSnap = ttSnapshots.find(s => {
      const d = parseISO(s.captured_date);
      return d >= monthStart;
    }) || ttSnapshots[0];

    return {
      current: latest.followers,
      dailyChange: latest.followers - prev.followers,
      monthlyChange: latest.followers - firstOfMonthSnap.followers,
      posts: latest.posts_count,
      follows: latest.follows,
      chartData: ttSnapshots.slice(-30).map(s => ({
        date: format(parseISO(s.captured_date), "dd/MM"),
        seguidores: s.followers
      }))
    };
  }, [snapshots, month]);

  const monthPosts = useMemo(() => {
    const ms = startOfMonth(month).getTime();
    const me = endOfMonth(month).getTime();
    return posts.filter(p => {
      const t = new Date(p.date + "T12:00:00").getTime();
      if (t < ms || t > me) return false;
      if (platformFilter === "all") return true;
      const net = (p.network || "").toLowerCase();
      return net === platformFilter;
    });
  }, [posts, month, platformFilter]);

  const kpis = useMemo(() => {
    const ms = monthPosts.flatMap(p => metrics[p.id] || []).filter(m => {
      if (platformFilter === "all") return true;
      return m.platform.toLowerCase() === platformFilter;
    });
    const sum = (k: keyof PostMetric) => ms.reduce((a, b) => a + (Number(b[k]) || 0), 0);
    const avgEng = ms.length ? ms.reduce((a, b) => a + b.engagement_rate, 0) / ms.length : 0;
    return {
      published: monthPosts.length,
      tracked: ms.length,
      likes: sum("likes"),
      views: sum("views"),
      comments: sum("comments"),
      shares: sum("shares"),
      engagement: avgEng,
    };
  }, [monthPosts, metrics]);

  const fetchOne = async (postId: string) => {
    setRefreshingId(postId);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-post-metrics", {
        body: { post_id: postId },
      });
      if (error) throw error;
      const r = data?.results?.[0];
      if (r?.ok) {
        toast.success("Métricas atualizadas");
        if (student) await loadAll(student.id);
      } else {
        toast.error(r?.error || "Falha ao buscar");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setRefreshingId(null);
    }
  };

  const fetchAll = async () => {
    const withLinks = monthPosts.filter(p => p.instagram_published_url || p.tiktok_published_url || p.published_url);
    if (!withLinks.length) {
      toast.info("Nenhum post com link publicado neste mês");
      return;
    }
    setRefreshingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-post-metrics", {
        body: { post_ids: withLinks.map(p => p.id) },
      });
      if (error) throw error;
      const ok = (data?.results || []).filter((r: any) => r.ok).length;
      toast.success(`${ok} de ${withLinks.length} atualizados`);
      if (student) await loadAll(student.id);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setRefreshingAll(false);
    }
  };

  const categoryData = useMemo(() => {
    return categories.map(c => ({
      name: c.name,
      value: monthPosts.filter(p => p.category === c.name).length,
      color: c.color,
    })).filter(d => d.value > 0);
  }, [monthPosts, categories]);

  const topPosts = useMemo(() => {
    return monthPosts
      .map(p => {
        const pMetrics = (metrics[p.id] || []).filter(m => platformFilter === "all" || m.platform.toLowerCase() === platformFilter);
        if (pMetrics.length === 0) return { ...p, m: null };
        
        // Aggregate if multiple platforms and platformFilter is "all"
        const agg = pMetrics.reduce((acc, curr) => ({
          views: acc.views + curr.views,
          likes: acc.likes + curr.likes,
          comments: acc.comments + curr.comments,
        }), { views: 0, likes: 0, comments: 0 });
        
        return { ...p, m: agg };
      })
      .filter(p => p.m)
      .sort((a, b) => (b.m!.views + b.m!.likes) - (a.m!.views + a.m!.likes))
      .slice(0, 5)
      .map(p => ({
        name: p.title.length > 28 ? p.title.slice(0, 28) + "…" : p.title,
        Visualizações: p.m!.views,
        Curtidas: p.m!.likes,
        Comentários: p.m!.comments,
      }));
  }, [monthPosts, metrics]);

  if (loading || !student) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando métricas…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/60 sticky top-0 z-10 backdrop-blur-xl bg-card/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-3 w-3" /> MÉTRICAS DE PERFORMANCE
              </div>
              <h1 className="font-display text-xl font-medium text-foreground tracking-tight">{student.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={format(month, "yyyy-MM")}
              onChange={e => { const [y, m] = e.target.value.split("-").map(Number); setMonth(new Date(y, m - 1, 1)); }}
              className="text-sm px-3 py-2 rounded-xl border border-border bg-background text-foreground"
            />
            <button
              onClick={exportToPDF}
              disabled={exporting}
              className="text-xs px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileDown className="h-3.5 w-3.5" />
              {exporting ? "Gerando..." : "Exportar PDF"}
            </button>
            <Link to={`/calendario/${slug}`} className="text-xs px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-1.5 transition-colors">
              <CalendarDays className="h-3.5 w-3.5" /> Calendário
            </Link>
            <button
              onClick={fetchAll}
              disabled={refreshingAll}
              className="text-xs px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground flex items-center gap-1.5 disabled:opacity-50 shadow-soft hover:opacity-90 transition-opacity"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshingAll ? "animate-spin" : ""}`} />
              Atualizar tudo
            </button>
          </div>
        </div>
      </div>

      <div ref={dashboardRef} className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Missing-handle warning */}
        {!student.instagram_handle && !student.tiktok_handle && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200 flex items-start gap-3">
            <Users className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Cadastre o @ do Instagram e/ou TikTok deste aluno.</p>
              <p className="text-xs mt-0.5 opacity-80">Sem o @ não conseguimos coletar seguidores nem comparar a evolução diária/mensal. Edite o aluno na lista para preencher.</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex-shrink-0"
            >
              Editar aluno
            </button>
          </div>
        )}

        {/* Platform selector — always visible */}
        <div className="flex items-center gap-2 p-1 bg-secondary/60 rounded-xl w-fit">
          {([
            ["all", "Todas", null],
            ["instagram", "Instagram", Instagram],
            ["tiktok", "TikTok", TikTokIcon],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setPlatformFilter(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                platformFilter === key
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Follower Stats Section */}
        {(instagramStats || tiktokStats) ? (
          <div className={`grid gap-4 ${platformFilter === "all" ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
            {instagramStats && (platformFilter === "all" || platformFilter === "instagram") && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-medium">Instagram</h3>
                      <p className="text-[10px] text-muted-foreground">@{student.instagram_handle}</p>
                    </div>
                  </div>
                  <button 
                    onClick={fetchFollowers}
                    disabled={refreshingFollowers}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingFollowers ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Seguidores</p>
                    <p className="text-lg font-bold">{instagramStats.current.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Cresc. Mês</p>
                    <p className={`text-lg font-bold ${instagramStats.monthlyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {instagramStats.monthlyChange > 0 ? "+" : ""}{instagramStats.monthlyChange.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Posts</p>
                    <p className="text-lg font-bold">{instagramStats.posts}</p>
                  </div>
                </div>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={instagramStats.chartData}>
                      <defs>
                        <linearGradient id="colorIg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#bc1888" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#bc1888" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="seguidores" stroke="#bc1888" fillOpacity={1} fill="url(#colorIg)" />
                      <Tooltip />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {tiktokStats && (platformFilter === "all" || platformFilter === "tiktok") && (
              <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white">
                      <TikTokIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-medium">TikTok</h3>
                      <p className="text-[10px] text-muted-foreground">@{student.tiktok_handle}</p>
                    </div>
                  </div>
                  <button 
                    onClick={fetchFollowers}
                    disabled={refreshingFollowers}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshingFollowers ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Seguidores</p>
                    <p className="text-lg font-bold">{tiktokStats.current.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Cresc. Mês</p>
                    <p className={`text-lg font-bold ${tiktokStats.monthlyChange >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {tiktokStats.monthlyChange > 0 ? "+" : ""}{tiktokStats.monthlyChange.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/30">
                    <p className="text-[10px] text-muted-foreground uppercase">Vídeos</p>
                    <p className="text-lg font-bold">{tiktokStats.posts}</p>
                  </div>
                </div>
                <div className="h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tiktokStats.chartData}>
                      <defs>
                        <linearGradient id="colorTt" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="seguidores" stroke="#000000" fillOpacity={1} fill="url(#colorTt)" />
                      <Tooltip />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (student.instagram_handle || student.tiktok_handle) && (
          <div className="bg-card rounded-2xl border border-dashed border-border p-6 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground/60 mb-2" />
            <p className="text-sm text-foreground font-medium">Coleta de seguidores agendada</p>
            <p className="text-xs text-muted-foreground mt-1">
              A primeira leitura roda automaticamente nas próximas 24h. Para ver agora, clique abaixo.
            </p>
            <button
              onClick={fetchFollowers}
              disabled={refreshingFollowers}
              className="mt-3 inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshingFollowers ? "animate-spin" : ""}`} />
              Coletar agora
            </button>
          </div>
        )}

        {/* AI Content Coach Section */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-6 shadow-soft relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BrainCircuit className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-medium text-foreground">Brenda IA</h3>
                <p className="text-xs text-muted-foreground">Analise seu desempenho e receba sugestões estratégicas</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-6">
              <button 
                onClick={() => handleAskCoach('analyze')}
                disabled={coachLoading}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-medium mb-1">Analisar Padrões</h4>
                <p className="text-[10px] text-muted-foreground">O que funcionou melhor neste mês?</p>
              </button>

              <button 
                onClick={() => handleAskCoach('suggest_improvements')}
                disabled={coachLoading}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-medium mb-1">Melhorar Perfil</h4>
                <p className="text-[10px] text-muted-foreground">Sugestões de melhorias baseadas nos dados</p>
              </button>

              <button 
                onClick={() => handleAskCoach('performance_analysis')}
                disabled={coachLoading}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-medium mb-1">Análise de Performance</h4>
                <p className="text-[10px] text-muted-foreground">O que performou bem e por quê?</p>
              </button>
            </div>

            {coachLoading && (
              <div className="bg-background/80 backdrop-blur rounded-xl border border-primary/20 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div className="absolute -inset-1 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Brenda IA está trabalhando...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Analisando seu calendário e gerando insights estratégicos</p>
                  </div>
                </div>
              </div>
            )}

            {coachResponse && !coachLoading && (
              <div className="bg-background/80 backdrop-blur rounded-xl border border-primary/20 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Resposta da Brenda</span>
                  <button onClick={() => setCoachResponse("")} className="text-muted-foreground hover:text-foreground text-xs">Limpar</button>
                </div>
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-display prose-headings:font-medium prose-h2:text-lg prose-h2:mt-0 prose-h2:mb-3 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-primary prose-p:text-sm prose-p:leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ul:pl-4 prose-li:text-sm prose-li:my-1 prose-strong:text-foreground prose-strong:font-semibold prose-hr:my-4 prose-hr:border-border">
                  <ReactMarkdown>{coachResponse}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard icon={<Eye className="h-4 w-4" />} label="Visualizações" value={kpis.views.toLocaleString("pt-BR")} />
          <KpiCard icon={<Heart className="h-4 w-4" />} label="Curtidas" value={kpis.likes.toLocaleString("pt-BR")} />
          <KpiCard icon={<MessageCircle className="h-4 w-4" />} label="Comentários" value={kpis.comments.toLocaleString("pt-BR")} />
          <KpiCard icon={<TrendingUp className="h-4 w-4" />} label="Engajamento" value={`${kpis.engagement.toFixed(1)}%`} />
        </div>

        <div className="text-xs text-muted-foreground">
          {kpis.published} posts publicados · {kpis.tracked} com métricas coletadas
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
            <h3 className="font-display text-sm font-medium text-foreground mb-4">Posts por Categoria</h3>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {categoryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Nenhum post publicado neste mês" />
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-soft">
            <h3 className="font-display text-sm font-medium text-foreground mb-4">Top 5 Posts</h3>
            {topPosts.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topPosts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Visualizações" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Curtidas" fill="hsl(330 50% 55%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="Sem métricas coletadas ainda" />
            )}
          </div>
        </div>

        {/* Posts table */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="font-display text-sm font-medium text-foreground">Posts Publicados</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cole o link do post no calendário e clique em atualizar para coletar métricas</p>
          </div>
          {monthPosts.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Nenhum post publicado neste mês</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Data</th>
                    <th className="text-left px-4 py-3 font-medium">Título</th>
                    <th className="text-left px-4 py-3 font-medium">Categoria</th>
                    <th className="text-right px-3 py-3 font-medium">Views</th>
                    <th className="text-right px-3 py-3 font-medium">Likes</th>
                    <th className="text-right px-3 py-3 font-medium">Coment.</th>
                    <th className="text-right px-3 py-3 font-medium">Eng.</th>
                    <th className="text-right px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {monthPosts.map(p => {
                    const pMetrics = (metrics[p.id] || []).filter(m => platformFilter === "all" || m.platform.toLowerCase() === platformFilter);
                    const hasMetrics = pMetrics.length > 0;
                    
                    const agg = pMetrics.reduce((acc, curr) => ({
                      views: acc.views + curr.views,
                      likes: acc.likes + curr.likes,
                      comments: acc.comments + curr.comments,
                      engagement_rate: acc.engagement_rate + (curr.engagement_rate || 0)
                    }), { views: 0, likes: 0, comments: 0, engagement_rate: 0 });
                    
                    if (hasMetrics && platformFilter === "all") {
                      agg.engagement_rate = agg.engagement_rate / pMetrics.length;
                    }

                    const catColor = getCategoryColor(p.category);
                    const mainLink = p.instagram_published_url || p.tiktok_published_url || p.published_url;

                    return (
                      <tr key={p.id} className="border-t border-border/40 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(p.date + "T12:00:00"), "dd/MM")}</td>
                        <td className="px-4 py-3 max-w-[280px] truncate">{p.title}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span className="w-2 h-2 rounded-full" style={{ background: catColor }} />
                            {p.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{hasMetrics ? agg.views.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{hasMetrics ? agg.likes.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{hasMetrics ? agg.comments.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs font-medium">{hasMetrics ? `${agg.engagement_rate.toFixed(1)}%` : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.instagram_published_url && (
                              <a href={p.instagram_published_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Abrir Instagram">
                                <Instagram className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {p.tiktok_published_url && (
                              <a href={p.tiktok_published_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Abrir TikTok">
                                <TikTokIcon className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {!p.instagram_published_url && !p.tiktok_published_url && p.published_url && (
                              <a href={p.published_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Abrir post">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => fetchOne(p.id)}
                              disabled={!mainLink || refreshingId === p.id}
                              className="p-1.5 rounded-lg hover:bg-secondary text-primary disabled:opacity-30 transition-colors"
                              title={mainLink ? "Atualizar métricas" : "Adicione o link no calendário"}
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === p.id ? "animate-spin" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-soft">
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
      <span className="text-primary">{icon}</span> {label}
    </div>
    <div className="font-display text-2xl font-medium text-foreground tabular-nums">{value}</div>
  </div>
);

const EmptyChart = ({ text }: { text: string }) => (
  <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">{text}</div>
);

const StudentMetricsWrapper = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getBySlug } = useStudents();
  const { userId } = useUser();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    getBySlug(slug).then((s) => {
      if (!s) { navigate("/"); return; }
      setStudent(s);
    });
  }, [slug]);

  if (student === undefined) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!student || !userId) return null;

  return (
    <ContentProvider studentId={student.id} ownerId={userId} viewMode="admin">
      <StudentMetrics />
    </ContentProvider>
  );
};

export default StudentMetricsWrapper;
