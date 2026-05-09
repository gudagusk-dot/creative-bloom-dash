import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ContentPost, Category } from "@/data/content";

interface PostMetric {
  likes: number; views: number; comments: number; shares: number; engagement_rate: number;
}
interface ExportArgs {
  monthDate: Date;
  posts: ContentPost[];
  studentName?: string;
  getCategoryColor: (cat: string) => string;
  metricsByPostId?: Record<string, PostMetric>;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
};

// Brand palette aligned with login screen gradient
const BRAND = {
  primary: [88, 64, 156] as [number, number, number],     // hsl(252 45% 35%)
  accent:  [196, 92, 156] as [number, number, number],    // hsl(330 50% 55%)
  mid:     [142, 78, 156] as [number, number, number],    // hsl(280 40% 45%)
  ink:     [28, 28, 36] as [number, number, number],
  muted:   [120, 120, 130] as [number, number, number],
  bg:      [248, 249, 250] as [number, number, number],
  line:    [225, 225, 232] as [number, number, number],
  ok:      [76, 175, 80] as [number, number, number],
  warn:    [255, 152, 0] as [number, number, number],
  pending: [158, 158, 170] as [number, number, number],
};

/** Render a vertical gradient via many thin rectangles. */
const drawGradientRect = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  c1: [number, number, number], c2: [number, number, number]
) => {
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(x, y + (h * i) / steps, w, h / steps + 0.5, "F");
  }
};

/** Render a chart on an off-screen canvas and return a PNG dataURL. */
const renderDonut = async (
  data: { label: string; value: number; color: [number, number, number] }[],
  size = 480
): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2, cy = size / 2;
  const rOut = size * 0.42, rIn = size * 0.27;
  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, size, size);
  data.forEach(d => {
    const angle = (d.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rOut, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = `rgb(${d.color[0]},${d.color[1]},${d.color[2]})`;
    ctx.fill();
    start += angle;
  });
  // inner cutout
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  // center label
  ctx.fillStyle = "#1c1c24";
  ctx.font = `bold ${size * 0.13}px Helvetica, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${total}`, cx, cy - size * 0.02);
  ctx.font = `${size * 0.05}px Helvetica, Arial`;
  ctx.fillStyle = "#888";
  ctx.fillText("posts", cx, cy + size * 0.08);
  return canvas.toDataURL("image/png");
};

const renderBars = async (
  data: { label: string; value: number; color: [number, number, number] }[],
  width = 720, height = 360, horizontal = true
): Promise<string> => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const max = Math.max(1, ...data.map(d => d.value));
  const padL = horizontal ? 180 : 50;
  const padR = 30, padT = 20, padB = horizontal ? 30 : 60;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  if (horizontal) {
    const barH = (chartH / data.length) * 0.7;
    const gap = (chartH / data.length) * 0.3;
    data.forEach((d, i) => {
      const y = padT + i * (barH + gap) + gap / 2;
      const w = (d.value / max) * chartW;
      ctx.fillStyle = `rgb(${d.color[0]},${d.color[1]},${d.color[2]})`;
      ctx.beginPath();
      // rounded rect
      const r = Math.min(8, barH / 2);
      ctx.moveTo(padL + r, y);
      ctx.lineTo(padL + w, y);
      ctx.quadraticCurveTo(padL + w + r, y, padL + w + r, y + r);
      ctx.lineTo(padL + w + r, y + barH - r);
      ctx.quadraticCurveTo(padL + w + r, y + barH, padL + w, y + barH);
      ctx.lineTo(padL + r, y + barH);
      ctx.fill();
      ctx.fillStyle = "#1c1c24";
      ctx.font = "500 16px Helvetica, Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(d.label, padL - 12, y + barH / 2);
      ctx.fillStyle = "#555";
      ctx.font = "bold 16px Helvetica, Arial";
      ctx.textAlign = "left";
      ctx.fillText(String(d.value), padL + w + 8, y + barH / 2);
    });
  } else {
    const barW = (chartW / data.length) * 0.6;
    const gap = (chartW / data.length) * 0.4;
    data.forEach((d, i) => {
      const h = (d.value / max) * chartH;
      const x = padL + i * (barW + gap) + gap / 2;
      const y = padT + chartH - h;
      ctx.fillStyle = `rgb(${d.color[0]},${d.color[1]},${d.color[2]})`;
      ctx.fillRect(x, y, barW, h);
      ctx.fillStyle = "#1c1c24";
      ctx.font = "500 14px Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.fillText(d.label, x + barW / 2, height - padB + 18);
      ctx.fillStyle = "#555";
      ctx.font = "bold 14px Helvetica, Arial";
      ctx.fillText(String(d.value), x + barW / 2, y - 6);
    });
  }
  return canvas.toDataURL("image/png");
};

export const exportCalendarPDF = async ({ monthDate, posts, studentName, getCategoryColor, metricsByPostId }: ExportArgs) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 40;

  const monthLabel = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR });
  const generated = format(new Date(), "dd/MM/yyyy 'às' HH:mm");

  // ========== PAGE 1: COVER ==========
  drawGradientRect(doc, 0, 0, W, H, BRAND.primary, BRAND.accent);

  // decorative circles
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
  doc.circle(W - 60, 80, 110, "F");
  doc.circle(40, H - 100, 140, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  // top label
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("PLANEJAMENTO DE CONTEÚDO", margin, 90, { charSpace: 2 });

  doc.setLineWidth(2);
  doc.setDrawColor(255, 255, 255);
  doc.line(margin, 100, margin + 40, 100);

  // title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(46);
  doc.text(studentName || "Plano de Conteúdo", margin, 200, { maxWidth: W - margin * 2 });

  // month
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), margin, 240);

  // description card
  const cardY = H / 2 + 40;
  doc.setFillColor(255, 255, 255);
  doc.setGState(new (doc as any).GState({ opacity: 0.95 }));
  doc.roundedRect(margin, cardY, W - margin * 2, 180, 14, 14, "F");
  doc.setGState(new (doc as any).GState({ opacity: 1 }));

  doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SOBRE ESTE RELATÓRIO", margin + 24, cardY + 32);

  doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const desc = `Este documento apresenta o planejamento mensal de conteúdo para Instagram e TikTok. Inclui um resumo executivo da execução, gráficos de desempenho por categoria e rede social, o calendário visual completo do mês e a lista detalhada de todos os posts planejados.`;
  const descLines = doc.splitTextToSize(desc, W - margin * 2 - 48);
  doc.text(descLines, margin + 24, cardY + 56, { lineHeightFactor: 1.5 });

  // footer of cover
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(`Gerado em ${generated}`, margin, H - margin);
  doc.text("Content Calendar", W - margin, H - margin, { align: "right" });

  // ========== PAGE 2: EXECUTIVE SUMMARY ==========
  doc.addPage();
  drawSectionHeader(doc, "RESUMO EXECUTIVO", monthLabel, W, margin);

  const total = posts.length;
  const published = posts.filter(p => p.status === "Publicado").length;
  const inProgress = posts.filter(p => p.status === "Em produção").length;
  const todo = posts.filter(p => p.status === "A fazer").length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = posts.filter(p => p.status !== "Publicado" && new Date(p.date + "T12:00:00") < today).length;
  const pct = total > 0 ? Math.round((published / total) * 100) : 0;

  // KPI cards 2x2
  const kpiTop = 130;
  const kpiW = (W - margin * 2 - 16) / 2;
  const kpiH = 90;
  const kpis = [
    { label: "TOTAL DE POSTS", value: String(total), color: BRAND.primary },
    { label: "PUBLICADOS", value: String(published), color: BRAND.ok },
    { label: "PENDENTES", value: String(todo + inProgress), color: BRAND.warn },
    { label: "TAXA DE EXECUÇÃO", value: `${pct}%`, color: BRAND.accent },
  ];
  kpis.forEach((k, i) => {
    const x = margin + (i % 2) * (kpiW + 16);
    const y = kpiTop + Math.floor(i / 2) * (kpiH + 16);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(BRAND.line[0], BRAND.line[1], BRAND.line[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, kpiW, kpiH, 12, 12, "FD");
    // accent bar
    doc.setFillColor(k.color[0], k.color[1], k.color[2]);
    doc.roundedRect(x, y, 5, kpiH, 2, 2, "F");
    doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(k.label, x + 18, y + 26, { charSpace: 1 });
    doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text(k.value, x + 18, y + 66);
  });

  // Status box
  const statusY = kpiTop + 2 * (kpiH + 16) + 8;
  doc.setFillColor(BRAND.bg[0], BRAND.bg[1], BRAND.bg[2]);
  doc.roundedRect(margin, statusY, W - margin * 2, 90, 12, 12, "F");
  doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("STATUS DO MÊS", margin + 18, statusY + 24);
  doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  let statusMsg = "";
  if (total === 0) statusMsg = "Nenhum post planejado para este mês.";
  else if (pct >= 80) statusMsg = `Excelente progresso! ${published} de ${total} posts já estão publicados (${pct}%).`;
  else if (pct >= 50) statusMsg = `Bom andamento: ${published} de ${total} publicados (${pct}%). Faltam ${todo + inProgress} posts.`;
  else statusMsg = `Há ${todo + inProgress} posts pendentes de um total de ${total}. ${overdue > 0 ? `Atenção: ${overdue} estão atrasados.` : ""}`;
  const statusLines = doc.splitTextToSize(statusMsg, W - margin * 2 - 36);
  doc.text(statusLines, margin + 18, statusY + 46, { lineHeightFactor: 1.4 });

  drawPageFooter(doc, generated, W, H, margin, 2);

  // ========== PAGE 3: CHARTS ==========
  doc.addPage();
  drawSectionHeader(doc, "ANÁLISE VISUAL", monthLabel, W, margin);

  // Donut: status
  const donutData = [
    { label: "Publicado", value: published, color: BRAND.ok },
    { label: "Em produção", value: inProgress, color: BRAND.warn },
    { label: "A fazer", value: todo, color: BRAND.pending },
  ].filter(d => d.value > 0);
  const donutImg = await renderDonut(donutData.length ? donutData : [{ label: "—", value: 1, color: BRAND.line }]);

  doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DISTRIBUIÇÃO POR STATUS", margin, 130);

  doc.addImage(donutImg, "PNG", margin, 145, 180, 180);

  // legend
  let lgy = 165;
  donutData.forEach(d => {
    doc.setFillColor(d.color[0], d.color[1], d.color[2]);
    doc.circle(margin + 200, lgy, 5, "F");
    doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`${d.label}`, margin + 212, lgy + 3);
    doc.setFont("helvetica", "bold");
    doc.text(`${d.value}`, W - margin - 40, lgy + 3, { align: "right" });
    lgy += 24;
  });

  // Bars: by category
  const categoriesPresent = Array.from(new Set(posts.map(p => p.category)));
  const catCounts = categoriesPresent
    .map(c => ({
      label: c,
      value: posts.filter(p => p.category === c).length,
      color: hexToRgb(getCategoryColor(c)),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("POSTS POR CATEGORIA", margin, 360);

  if (catCounts.length > 0) {
    const barsImg = await renderBars(catCounts, 1000, Math.max(180, catCounts.length * 50), true);
    const imgH = Math.max(120, catCounts.length * 32);
    doc.addImage(barsImg, "PNG", margin, 375, W - margin * 2, imgH);
  }

  // Bars: by network
  const netCounts = ["Instagram", "TikTok", "TikTok + Instagram"]
    .map((n, i) => ({
      label: n,
      value: posts.filter(p => p.network === n).length,
      color: [BRAND.primary, BRAND.mid, BRAND.accent][i],
    }))
    .filter(d => d.value > 0);

  if (netCounts.length > 0) {
    doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const netY = Math.min(H - 220, 600);
    doc.text("DISTRIBUIÇÃO POR REDE SOCIAL", margin, netY);
    const netImg = await renderBars(netCounts, 1000, 160, true);
    doc.addImage(netImg, "PNG", margin, netY + 15, W - margin * 2, 130);
  }

  drawPageFooter(doc, generated, W, H, margin, 3);

  // ========== PAGE 4: CALENDAR GRID ==========
  doc.addPage();
  drawSectionHeader(doc, "CALENDÁRIO MENSAL", monthLabel, W, margin);

  const ms = startOfMonth(monthDate);
  const me = endOfMonth(monthDate);
  const cs = startOfWeek(ms, { locale: ptBR });
  const ce = endOfWeek(me, { locale: ptBR });
  const days = eachDayOfInterval({ start: cs, end: ce });
  const rows = Math.ceil(days.length / 7);

  const gridTop = 130;
  const gridBottom = H - 100;
  const gridH = gridBottom - gridTop;
  const cellW = (W - margin * 2) / 7;
  const cellH = gridH / rows;

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
  dayNames.forEach((d, i) => {
    doc.text(d.toUpperCase(), margin + i * cellW + 6, gridTop - 8, { charSpace: 1 });
  });

  days.forEach((day, idx) => {
    const col = idx % 7;
    const row = Math.floor(idx / 7);
    const x = margin + col * cellW;
    const y = gridTop + row * cellH;
    const inMonth = isSameMonth(day, monthDate);
    const isToday = isSameDay(day, new Date());

    if (inMonth) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(BRAND.bg[0], BRAND.bg[1], BRAND.bg[2]);
    }
    doc.rect(x, y, cellW, cellH, "F");
    doc.setDrawColor(BRAND.line[0], BRAND.line[1], BRAND.line[2]);
    doc.setLineWidth(0.4);
    doc.rect(x, y, cellW, cellH);

    if (isToday && inMonth) {
      doc.setFillColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
      doc.circle(x + 12, y + 12, 8, "F");
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(inMonth ? BRAND.ink[0] : 200, inMonth ? BRAND.ink[1] : 200, inMonth ? BRAND.ink[2] : 200);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(String(day.getDate()), x + (isToday && inMonth ? 9 : 6), y + 15);

    const dayPosts = posts.filter(p => isSameDay(new Date(p.date + "T12:00:00"), day));
    let py = y + 28;
    dayPosts.slice(0, 3).forEach(p => {
      const colorHex = getCategoryColor(p.category);
      const [r, g, b] = hexToRgb(colorHex || "#999999");
      // pill background
      doc.setFillColor(r, g, b);
      doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
      doc.roundedRect(x + 4, py - 7, cellW - 8, 14, 3, 3, "F");
      doc.setGState(new (doc as any).GState({ opacity: 1 }));
      // bar
      doc.setFillColor(r, g, b);
      doc.rect(x + 4, py - 7, 2.5, 14, "F");
      // text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
      const txt = doc.splitTextToSize(p.title, cellW - 14)[0] || "";
      doc.text(txt, x + 9, py + 2);
      py += 17;
    });
    if (dayPosts.length > 3) {
      doc.setFontSize(6.5);
      doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
      doc.text(`+${dayPosts.length - 3} mais`, x + 6, y + cellH - 5);
    }
  });

  // legend categories
  const legendY = H - 70;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
  doc.text("CATEGORIAS", margin, legendY);
  let lx = margin;
  const ly = legendY + 14;
  categoriesPresent.forEach((cat) => {
    const [r, g, b] = hexToRgb(getCategoryColor(cat));
    if (lx + doc.getTextWidth(cat) + 30 > W - margin) return;
    doc.setFillColor(r, g, b);
    doc.circle(lx + 4, ly - 2, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.ink[0], BRAND.ink[1], BRAND.ink[2]);
    doc.text(cat, lx + 11, ly);
    lx += doc.getTextWidth(cat) + 22;
  });

  drawPageFooter(doc, generated, W, H, margin, 4);

  // ========== PAGE 5: POSTS TABLE ==========
  doc.addPage();
  drawSectionHeader(doc, "LISTA DE POSTS", monthLabel, W, margin);

  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date));

  autoTable(doc, {
    startY: 130,
    head: [["Data", "Título", "Categoria", "Formato", "Rede", "Status"]],
    body: sorted.map(p => [
      format(new Date(p.date + "T12:00:00"), "dd/MM"),
      p.title,
      p.category,
      p.format,
      p.network,
      p.status,
    ]),
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 6, textColor: BRAND.ink, lineColor: BRAND.line },
    headStyles: { fillColor: BRAND.primary, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 75 },
      3: { cellWidth: 55 },
      4: { cellWidth: 75 },
      5: { cellWidth: 60 },
    },
    margin: { left: margin, right: margin, bottom: 60 },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const v = data.cell.raw as string;
        if (v === "Publicado") data.cell.styles.textColor = BRAND.ok;
        else if (v === "Em produção") data.cell.styles.textColor = BRAND.warn;
        else data.cell.styles.textColor = BRAND.muted;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.section === "body" && data.column.index === 2) {
        const catName = data.cell.raw as string;
        const color = getCategoryColor(catName);
        if (color) {
          data.cell.styles.textColor = hexToRgb(color);
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    didDrawPage: () => drawPageFooter(doc, generated, W, H, margin, doc.getNumberOfPages()),
  });

  const fileName = `relatorio-${(studentName || "conteudo").toLowerCase().replace(/\s+/g, "-")}-${format(monthDate, "yyyy-MM")}.pdf`;
  doc.save(fileName);
};

const drawSectionHeader = (doc: jsPDF, title: string, subtitle: string, W: number, margin: number) => {
  // top accent bar
  doc.setFillColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.rect(0, 0, W, 6, "F");
  doc.setFillColor(BRAND.accent[0], BRAND.accent[1], BRAND.accent[2]);
  doc.rect(0, 6, W, 2, "F");

  doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle.toUpperCase(), margin, 50, { charSpace: 2 });

  doc.setTextColor(BRAND.primary[0], BRAND.primary[1], BRAND.primary[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(title, margin, 80);

  doc.setDrawColor(BRAND.accent[0], BRAND.accent[1], BRAND.accent[2]);
  doc.setLineWidth(2.5);
  doc.line(margin, 92, margin + 50, 92);
};

const drawPageFooter = (doc: jsPDF, generated: string, W: number, H: number, margin: number, page: number) => {
  doc.setDrawColor(BRAND.line[0], BRAND.line[1], BRAND.line[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, H - 40, W - margin, H - 40);
  doc.setTextColor(BRAND.muted[0], BRAND.muted[1], BRAND.muted[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Gerado em ${generated}`, margin, H - 24);
  doc.text(`Página ${page}`, W - margin, H - 24, { align: "right" });
};
