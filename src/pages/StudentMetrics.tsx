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
  const [metrics, setMetrics] = useState<Record<string, PostMetric>>({});
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
      const map: Record<string, PostMetric> = {};
      (m || []).forEach((row: any) => { map[row.post_id] = row; });
      setMetrics(map);
    }
    setLoading(false);
  };

  const fetchFollowers = async () => {
    if (!student?.instagram_handle && !student?.tiktok_handle) {
      toast.error("Nenhuma rede social configurada para este aluno");
      return;
    }
    setRefreshingFollowers(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-follower-snapshot");
      if (error) throw error;
      
      const successCount = (data.results || []).filter((r: any) => r.status === 'success').length;
      if (successCount > 0) {
        toast.success(`${successCount} rede(s) atualizada(s)`);
        await loadAll(student.id);
      } else {
        toast.error("Nenhuma métrica pôde ser coletada");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao buscar seguidores");
    } finally {
      setRefreshingFollowers(false);
    }
  };

  const handleAskCoach = async (action: 'analyze' | 'suggest' | 'rewrite' | 'script') => {
    if (coachLoading) return;
    setCoachLoading(true);
    try {
      const contentContext = monthPosts.map(p => `- ${p.title} (${p.category})`).join('\n');
      
      const { data, error } = await supabase.functions.invoke("ai-content-coach", {
        body: { 
          action, 
          content: action === 'analyze' || action === 'suggest' ? contentContext : coachInput,
          context: contentContext
        }
      });
      if (error) throw error;
      setCoachResponse(data.text);
      if (action !== 'analyze' && action !== 'suggest') setCoachInput("");
    } catch (e: any) {
      toast.error("Erro ao consultar o Coach de IA");
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
      return t >= ms && t <= me;
    });
  }, [posts, month]);

  const kpis = useMemo(() => {
    const ms = monthPosts.map(p => metrics[p.id]).filter(Boolean) as PostMetric[];
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
    const withLinks = monthPosts.filter(p => p.published_url);
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
      .map(p => ({ ...p, m: metrics[p.id] }))
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
        {/* Follower Stats Section */}
        {(instagramStats || tiktokStats) && (
          <div className="grid md:grid-cols-2 gap-4">
            {instagramStats && (
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

            {tiktokStats && (
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
                <h3 className="font-display text-lg font-medium text-foreground">Content Coach de IA</h3>
                <p className="text-xs text-muted-foreground">Analise seu desempenho e gere novas ideias estratégicas</p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-3 mb-6">
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
                onClick={() => handleAskCoach('suggest')}
                disabled={coachLoading}
                className="p-4 rounded-xl bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-medium mb-1">Sugerir Ideias</h4>
                <p className="text-[10px] text-muted-foreground">3 novas ideias baseadas no seu histórico</p>
              </button>

              <div className="md:col-span-2 p-4 rounded-xl bg-background border border-border">
                <h4 className="text-sm font-medium mb-3">Melhorar ou Criar Roteiro</h4>
                <div className="flex gap-2">
                  <input 
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    placeholder="Cole um roteiro ou um tema..."
                    className="flex-1 text-xs bg-secondary/50 border-none rounded-lg px-3 focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    onClick={() => handleAskCoach(coachInput.length > 20 ? 'rewrite' : 'script')}
                    disabled={coachLoading || !coachInput.trim()}
                    className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {coachLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {coachResponse && (
              <div className="bg-background/80 backdrop-blur rounded-xl border border-primary/20 p-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Resposta do Coach</span>
                  <button onClick={() => setCoachResponse("")} className="text-muted-foreground hover:text-foreground text-xs">Limpar</button>
                </div>
                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {coachResponse}
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
                    const m = metrics[p.id];
                    const catColor = getCategoryColor(p.category);
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
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{m ? m.views.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{m ? m.likes.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs">{m ? m.comments.toLocaleString("pt-BR") : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-xs font-medium">{m ? `${m.engagement_rate.toFixed(1)}%` : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {p.published_url && (
                              <a href={p.published_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors" title="Abrir post">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => fetchOne(p.id)}
                              disabled={!p.published_url || refreshingId === p.id}
                              className="p-1.5 rounded-lg hover:bg-secondary text-primary disabled:opacity-30 transition-colors"
                              title={p.published_url ? "Atualizar métricas" : "Adicione o link no calendário"}
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
