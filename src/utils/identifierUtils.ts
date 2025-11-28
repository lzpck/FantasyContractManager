export function generateUserIdentifier(fullName: string): string {
  if (!fullName) return '';

  // 1. Normalize to remove accents and convert to lowercase
  const normalized = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // 2. Split by whitespace
  const parts = normalized.split(/\s+/);

  if (parts.length === 0) return '';

  // 3. Extract first name
  const firstName = parts[0];

  // 4. Extract last name initial
  // If there is no last name, we can't extract the initial.
  // We'll just return the first name in that case, or handle it as requested.
  // The requirement says "Extrair o primeiro nome e a primeira letra do sobrenome".
  // Assuming if no surname, we might just return the name or name_?
  // Let's assume there's always a surname for valid players.
  // If not, we'll just use the first name.
  if (parts.length < 2) {
    return firstName;
  }

  const lastNameInitial = parts[1][0];

  // 5. Combine
  return `${firstName}_${lastNameInitial}`;
}
