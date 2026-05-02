export type Category = "Educativo" | "Situações Reais" | "Autoridade" | "Destrave seu Inglês" | "Bastidores" | "Interação";
export type Format = "Reels" | "Carrossel" | "Story" | "Foto" | "Vídeo" | "Conversão" | "Produção" | "Lembrete";
export type SocialNetwork = "Instagram" | "TikTok" | "TikTok + Instagram";
export type PostStatus = "A fazer" | "Em produção" | "Publicado";

export interface ContentPost {
  id: string;
  date: string; // YYYY-MM-DD
  format: Format;
  title: string;
  category: Category;
  network: SocialNetwork;
  status: PostStatus;
  notes: string;
  script: string; // roteiro - rich text HTML
  media_urls: string[];
}

export const categoryConfig: Record<Category, { color: string; tailwind: string }> = {
  "Educativo": { color: "#00BCD4", tailwind: "bg-cat-educativo" },
  "Situações Reais": { color: "#FFC107", tailwind: "bg-cat-situacoes" },
  "Autoridade": { color: "#4CAF50", tailwind: "bg-cat-autoridade" },
  "Destrave seu Inglês": { color: "#E91E8C", tailwind: "bg-cat-destrave" },
  "Bastidores": { color: "#7B1FA2", tailwind: "bg-cat-bastidores" },
  "Interação": { color: "#FF5722", tailwind: "bg-cat-interacao" },
};

export const initialPosts: ContentPost[] = [
  // Abril 2026
  { id: "1", date: "2026-04-15", format: "Produção", title: "Produção de Conteúdos da Semana", category: "Bastidores", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "2", date: "2026-04-16", format: "Reels", title: "3 formas de falar OBRIGADO em inglês sem usar THANK YOU", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "3", date: "2026-04-17", format: "Conversão", title: "Você e seu amigo fazendo aula juntos! YES BABE (2 por 1, só no FDS)", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "4", date: "2026-04-18", format: "Conversão", title: "Como falar amigo em inglês! (Dia do amigo)", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "5", date: "2026-04-20", format: "Reels", title: 'Pare de falar "THIS" errado', category: "Destrave seu Inglês", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "6", date: "2026-04-21", format: "Carrossel", title: "Como parar de traduzir na sua cabeça", category: "Destrave seu Inglês", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "7", date: "2026-04-22", format: "Reels", title: "Você tentando falar inglês numa entrevista (simular)", category: "Situações Reais", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "8", date: "2026-04-23", format: "Story", title: "DIA DA LÍNGUA INGLESA – Sotaques do inglês pelo mundo (c/ música)", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "9", date: "2026-04-24", format: "Carrossel", title: "3 séries que eu indico sendo professora de Inglês: NÍVEL A1/A2", category: "Autoridade", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "10", date: "2026-04-25", format: "Foto", title: "O som que toca quando as aulas de todos os alunos estão prontas", category: "Bastidores", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "11", date: "2026-04-27", format: "Carrossel", title: "Porque eu personalizo as aulas dos meus alunos", category: "Autoridade", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "12", date: "2026-04-28", format: "Carrossel", title: "Você viajou e vai pedir a comida no restaurante (Simular)", category: "Situações Reais", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "13", date: "2026-04-29", format: "Story", title: "KNOW OR KICK – 8 Itens de cozinha", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "14", date: "2026-04-30", format: "Carrossel", title: "3 séries que eu indico sendo professora de Inglês: NÍVEL B1/B2", category: "Autoridade", network: "Instagram", status: "A fazer", notes: "", script: "" },
  // Maio 2026
  { id: "15", date: "2026-05-01", format: "Story", title: "KNOW OR KICK – Pronúncias parecidas (opções em PT)", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "16", date: "2026-05-04", format: "Carrossel", title: "3 séries que eu indico sendo professora de Inglês: NÍVEL C1/C2", category: "Autoridade", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "17", date: "2026-05-06", format: "Vídeo", title: "Reagindo a vídeos em Inglês", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "18", date: "2026-05-08", format: "Story", title: "Transformando meu escritório – Querem ver?", category: "Bastidores", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "19", date: "2026-05-09", format: "Vídeo", title: "Responder um BOM comentário em vídeo", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "20", date: "2026-05-10", format: "Reels", title: '3 formas de falar "eu te amo" pra sua mãe, em inglês!', category: "Educativo", network: "TikTok + Instagram", status: "A fazer", notes: "", script: "" },
  { id: "21", date: "2026-05-11", format: "Vídeo", title: "Frases avançadas que você ainda não sabe (part 1)", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "22", date: "2026-05-13", format: "Foto", title: "Como eu me sinto todo dia sendo professora de Inglês", category: "Bastidores", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "23", date: "2026-05-15", format: "Reels", title: 'Não diga "I don\'t know", diga "arano" (3 exemplos)', category: "Destrave seu Inglês", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "24", date: "2026-05-18", format: "Vídeo", title: "Frases perfeitas pra discutir em inglês (Brigar com alguém)", category: "Situações Reais", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "25", date: "2026-05-19", format: "Vídeo", title: "Do A1 ao C2: Até onde você entende?", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "26", date: "2026-05-21", format: "Vídeo", title: "Você precisa pedir ajuda em inglês (simular)", category: "Situações Reais", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "27", date: "2026-05-23", format: "Vídeo", title: "Responder um BOM comentário em vídeo", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "28", date: "2026-05-25", format: "Vídeo", title: "3 músicas que você canta sem saber o significado", category: "Educativo", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "29", date: "2026-05-26", format: "Vídeo", title: "Casal de alunos meus aprendendo inglês juntos (vídeo curto)", category: "Autoridade", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "30", date: "2026-05-27", format: "Story", title: "KNOW OR KICK – 8 itens de escritório", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "31", date: "2026-05-29", format: "Vídeo", title: "Responder um BOM comentário em vídeo", category: "Interação", network: "Instagram", status: "A fazer", notes: "", script: "" },
  { id: "32", date: "2026-05-30", format: "Vídeo", title: "DÁ SEUS PULOS – Afinal, como fala isso em inglês? (GIVE YOUR JUMPS)", category: "Destrave seu Inglês", network: "Instagram", status: "A fazer", notes: "", script: "" },
];
