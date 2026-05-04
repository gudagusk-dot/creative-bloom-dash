export const slugify = (input: string): string => {
  return (input || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "aluno";
};

export const sanitizeWhatsapp = (raw: string): string => {
  return (raw || "").replace(/\D+/g, "");
};
