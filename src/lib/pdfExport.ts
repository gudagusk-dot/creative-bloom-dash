import jsPDF from "jspdf";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContentPost, categoryConfig, Category } from "@/data/content";

interface ExportArgs {
  monthDate: Date;
  posts: ContentPost[];
  studentName?: string;
}

const hexToRgb = (hex: string) => {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)] as [number, number, number];
};

export const exportCalendarPDF = async ({ monthDate, posts, studentName }: ExportArgs) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 28;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`${studentName || "Plano de Conteúdo"}`, margin, margin + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120);
  doc.text(format(monthDate, "MMMM yyyy", { locale: ptBR }).toUpperCase(), margin, margin + 26);

  // KPIs
  const total = posts.length;
  const published = posts.filter(p => p.status === "Publicado").length;
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;
  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`Total: ${total}    Publicados: ${published}    Progresso: ${pct}%`, W - margin, margin + 16, { align: "right" });

  // Calendar grid
  const ms = startOfMonth(monthDate);
  const me = endOfMonth(monthDate);
  const cs = startOfWeek(ms, { locale: ptBR });
  const ce = endOfWeek(me, { locale: ptBR });
  const days = eachDayOfInterval({ start: cs, end: ce });
  const rows = Math.ceil(days.length / 7);

  const gridTop = margin + 50;
  const gridH = H - gridTop - margin - 50;
  const cellW = (W - margin * 2) / 7;
  const cellH = gridH / rows;

  // Day name headers
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(120);
  dayNames.forEach((d, i) => {
    doc.text(d.toUpperCase(), margin + i * cellW + 4, gridTop - 6);
  });

  // Cells
  doc.setDrawColor(220);
  days.forEach((day, idx) => {
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = margin + col * cellW;
    const y = gridTop + row * cellH;
    const inMonth = isSameMonth(day, monthDate);

    if (inMonth) {
      doc.setFillColor(252, 252, 250);
      doc.rect(x, y, cellW, cellH, "F");
    }
    doc.setDrawColor(220);
    doc.rect(x, y, cellW, cellH);

    // Day number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(inMonth ? 50 : 200);
    doc.text(String(day.getDate()), x + 4, y + 12);

    // Posts
    const dayPosts = posts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));
    let py = y + 20;
    dayPosts.slice(0, 4).forEach(p => {
      const cat = categoryConfig[p.category as Category];
      const [r, g, b] = hexToRgb(cat?.color || "#999999");
      doc.setFillColor(r, g, b);
      doc.rect(x + 3, py - 6, 3, 7, "F");
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60);
      const fmtTxt = `${p.format} · ${p.network.replace(" + ", "/")}`;
      doc.text(fmtTxt.slice(0, 22), x + 9, py);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(80);
      const titleLines = doc.splitTextToSize(p.title, cellW - 14);
      doc.text(titleLines.slice(0, 2).join("\n"), x + 9, py + 7);
      py += 22;
    });
    if (dayPosts.length > 4) {
      doc.setFontSize(7);
      doc.setTextColor(140);
      doc.text(`+${dayPosts.length - 4} mais`, x + 4, y + cellH - 4);
    }
  });

  // Legend
  const legendY = H - margin - 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text("CATEGORIAS", margin, legendY);
  let lx = margin;
  const ly = legendY + 12;
  (Object.entries(categoryConfig) as [Category, any][]).forEach(([cat, cfg]) => {
    const [r, g, b] = hexToRgb(cfg.color);
    doc.setFillColor(r, g, b);
    doc.circle(lx + 4, ly - 2, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(cat, lx + 11, ly);
    lx += doc.getTextWidth(cat) + 28;
  });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, W - margin, H - margin / 2, { align: "right" });

  const fileName = `plano-${(studentName || "conteudo").toLowerCase().replace(/\s+/g, "-")}-${format(monthDate, "yyyy-MM")}.pdf`;
  doc.save(fileName);
};
