/**
 * Testes para as funções de formatação
 */

import { formatDate, parseBrazilianDate } from './formatUtils';

describe('Funções de formatação de data', () => {
  test('formatDate deve formatar corretamente uma data para o padrão brasileiro', () => {
    // Data de teste: 27 de julho de 2025, 01:46:38
    const testDate = new Date(2025, 6, 27, 1, 46, 38);

    // Teste com horário
    const formattedWithTime = formatDate(testDate);
    expect(formattedWithTime).toBe('27/07/2025 01:46:38');

    // Teste sem horário
    const formattedWithoutTime = formatDate(testDate, false);
    expect(formattedWithoutTime).toBe('27/07/2025');
  });

  test('formatDate deve aceitar string ISO como entrada', () => {
    // String ISO para 27 de julho de 2025, 01:46:38
    const isoString = '2025-07-27T01:46:38.000Z';

    const formatted = formatDate(isoString);
    // Nota: O resultado pode variar dependendo do fuso horário
    // Este teste pode precisar de ajustes dependendo do ambiente
    expect(formatted).toContain('/07/2025');
  });

  test('parseBrazilianDate deve converter corretamente uma string no formato brasileiro para Date', () => {
    // String no formato brasileiro
    const brazilianDateString = '27/07/2025 01:46:38';

    const parsedDate = parseBrazilianDate(brazilianDateString);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getDate()).toBe(27);
    expect(parsedDate?.getMonth()).toBe(6); // Julho é 6 (zero-indexed)
    expect(parsedDate?.getFullYear()).toBe(2025);
    expect(parsedDate?.getHours()).toBe(1);
    expect(parsedDate?.getMinutes()).toBe(46);
    expect(parsedDate?.getSeconds()).toBe(38);
  });

  test('parseBrazilianDate deve funcionar com datas sem horário', () => {
    const dateOnlyString = '27/07/2025';

    const parsedDate = parseBrazilianDate(dateOnlyString);
    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getDate()).toBe(27);
    expect(parsedDate?.getMonth()).toBe(6);
    expect(parsedDate?.getFullYear()).toBe(2025);
    expect(parsedDate?.getHours()).toBe(0); // Hora padrão 0
    expect(parsedDate?.getMinutes()).toBe(0); // Minutos padrão 0
    expect(parsedDate?.getSeconds()).toBe(0); // Segundos padrão 0
  });

  test('formatDate deve retornar string vazia para entradas inválidas', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('data-invalida')).toBe('');
    expect(formatDate(null as any)).toBe('');
    expect(formatDate(undefined as any)).toBe('');
  });

  test('parseBrazilianDate deve retornar null para entradas inválidas', () => {
    expect(parseBrazilianDate('')).toBeNull();
    expect(parseBrazilianDate('data-invalida')).toBeNull();
    expect(parseBrazilianDate('32/13/2025')).toBeNull(); // Data impossível
    expect(parseBrazilianDate(null as any)).toBeNull();
  });
});
