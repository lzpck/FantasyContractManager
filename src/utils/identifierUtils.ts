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

export function getNameVariations(name: string): string[] {
  const variations = new Set<string>();
  variations.add(name);

  // Remove dots
  const noDots = name.replace(/\./g, '');
  variations.add(noDots);

  // Add dots for 2-letter acronyms (e.g. AJ -> A.J.)
  const parts = noDots.split(' ');
  if (parts.length > 0 && parts[0].length === 2 && /^[A-Z]+$/i.test(parts[0])) {
    const withDots = `${parts[0][0]}.${parts[0][1]}. ${parts.slice(1).join(' ')}`;
    variations.add(withDots);
  }

  // Common nickname mappings
  const nicknameMap: Record<string, string> = {
    'Zonovan Knight': 'Bam Knight',
    'Kenneth Walker': 'Ken Walker III',
    'Kenneth Walker III': 'Ken Walker',
    'Gabriel Davis': 'Gabe Davis',
    'Joshua Palmer': 'Josh Palmer',
    'Chigoziem Okonkwo': 'Chig Okonkwo',
    'Nathaniel Dell': 'Tank Dell',
  };

  if (nicknameMap[name]) {
    variations.add(nicknameMap[name]);
  }

  return Array.from(variations);
}
