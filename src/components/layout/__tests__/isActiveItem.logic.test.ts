function isActiveItem(pathname: string, href: string): boolean {
  if (pathname === href) {
    return true;
  }

  if (href === '/leagues') {
    return (
      pathname === '/leagues' ||
      (pathname.startsWith('/leagues/') && pathname.split('/').length === 3)
    );
  }

  if (/^\/leagues\/[^/]+$/.test(href)) {
    return false;
  }

  return pathname.startsWith(href + '/');
}

describe('isActiveItem logic (pure)', () => {
  test('Liga ativo apenas em /leagues/:id', () => {
    expect(isActiveItem('/leagues/123', '/leagues/123')).toBe(true);
    expect(isActiveItem('/leagues/123/teams/456', '/leagues/123')).toBe(false);
  });

  test('Meu Time ativo em rota do time e subrotas', () => {
    expect(isActiveItem('/leagues/123/teams/456', '/leagues/123/teams/456')).toBe(true);
    expect(isActiveItem('/leagues/123/teams/456/contracts', '/leagues/123/teams/456')).toBe(true);
    expect(isActiveItem('/leagues/123', '/leagues/123/teams/456')).toBe(false);
  });

  test('Liga (/leagues) ativo em lista e liga raiz', () => {
    expect(isActiveItem('/leagues', '/leagues')).toBe(true);
    expect(isActiveItem('/leagues/123', '/leagues')).toBe(true);
    expect(isActiveItem('/leagues/123/teams', '/leagues')).toBe(false);
  });
});
