/**
 * Builds "Title at Company" without duplicating when title already ends with
 * " at {company}" (common when the full string is stored in the title field).
 */
export function formatContactTitleCompanyLine(
  title: string | undefined | null,
  company: string | undefined | null,
): string {
  debugger;
  const t = (title ?? "").trim();
  const c = (company ?? "").trim();
  if (!t && !c) return "";
  if (!t) return c;
  if (!c) return t;
  const lastAt = t.lastIndexOf(" at ");
  if (lastAt !== -1) {
    const afterAt = t.slice(lastAt + 4).trim();
    if (afterAt.toLowerCase() === c.toLowerCase()) {
      return t;
    }
  }
  return `${t} at ${c}`;
}
