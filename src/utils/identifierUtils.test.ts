import { generateUserIdentifier } from './identifierUtils';

describe('generateUserIdentifier', () => {
  it('should convert simple names correctly', () => {
    expect(generateUserIdentifier('Woody Marks')).toBe('woody_m');
    expect(generateUserIdentifier('Parker Washington')).toBe('parker_w');
    expect(generateUserIdentifier('Keenan Allen')).toBe('keenan_a');
  });

  it('should handle names with accents', () => {
    expect(generateUserIdentifier('José Silva')).toBe('jose_s');
    expect(generateUserIdentifier('João Félix')).toBe('joao_f');
  });

  it('should handle compound names and special characters', () => {
    expect(generateUserIdentifier('Amon-Ra St. Brown')).toBe('amon-ra_s');
    expect(generateUserIdentifier('C.J. Stroud')).toBe('c.j._s');
  });

  it('should handle names with suffixes', () => {
    expect(generateUserIdentifier('Odell Beckham Jr.')).toBe('odell_b');
  });

  it('should handle extra whitespace', () => {
    expect(generateUserIdentifier('  Tyreek   Hill  ')).toBe('tyreek_h');
  });

  it('should handle single names', () => {
    expect(generateUserIdentifier('Neymar')).toBe('neymar');
  });

  it('should handle empty strings', () => {
    expect(generateUserIdentifier('')).toBe('');
  });
});
