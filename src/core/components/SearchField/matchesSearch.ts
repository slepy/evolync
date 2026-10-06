/** Case- and accent-insensitive match of a query against any of the texts. */
export const matchesSearch = (query: string, ...texts: Array<string | null | undefined>): boolean => {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l")
      .replace(/Ł/g, "L")
      .toLowerCase()
      .trim();
  const q = normalize(query);
  if (!q) return true;
  return texts.some((text) => !!text && normalize(text).includes(q));
};
