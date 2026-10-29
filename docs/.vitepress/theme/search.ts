/** Case- and diacritic-insensitive match of a query against any of the texts. */
const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .toLowerCase();

export const matches = (texts: (string | undefined)[], query: string) => {
  const q = fold(query.trim());
  return !q || texts.some((t) => t && fold(t).includes(q));
};
