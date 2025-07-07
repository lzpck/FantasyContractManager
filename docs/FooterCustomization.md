# Personalização do Rodapé

Este documento explica como personalizar o rodapé da aplicação com suas informações pessoais.

## Arquivo do Componente

O rodapé está localizado em: `src/components/layout/Footer.tsx`

## Personalizações Necessárias

### 1. Nome do Desenvolvedor

Substitua "Seu Nome" pelo seu nome real:

```tsx
<span className="font-semibold text-blue-400">
  Seu Nome Aqui
</span>
```

### 2. Links Sociais/Profissionais

Atualize os links das redes sociais (GitHub, LinkedIn, Instagram e Twitter/X):

```tsx
<a
  href="https://github.com/seuusuario"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
  title="GitHub"
>
  <Github className="h-4 w-4" />
</a>
<a
  href="https://linkedin.com/in/seuusuario"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
  title="LinkedIn"
>
  <Linkedin className="h-4 w-4" />
</a>
<a
  href="https://www.instagram.com/seuusuario/"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-pink-400 transition-colors duration-200"
  title="Instagram"
>
  <Instagram className="h-4 w-4" />
</a>
<a
  href="https://x.com/seuusuario"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
  title="Twitter/X"
>
  <Twitter className="h-4 w-4" />
</a>
```

### 3. Adicionar Mais Links (Opcional)

Você pode adicionar mais links sociais ou profissionais:

```tsx
// Exemplo: Portfolio
<a
  href="https://seuportfolio.com"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
  title="Portfolio"
>
  <Globe className="h-4 w-4" />
</a>

// Exemplo: YouTube
<a
  href="https://youtube.com/@seucanal"
  target="_blank"
  rel="noopener noreferrer"
  className="text-slate-400 hover:text-red-400 transition-colors duration-200"
  title="YouTube"
>
  <Youtube className="h-4 w-4" />
</a>
```

### 4. Remover Links (Opcional)

Se não quiser exibir links sociais, você pode remover toda a seção:

```tsx
{/* Remover esta seção inteira */}
<div className="flex items-center space-x-3">
  {/* ... links sociais ... */}
</div>
```

## Características do Rodapé

- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Design Moderno**: Segue o padrão visual da aplicação
- **Exibido em Todas as Páginas**: Tanto em páginas autenticadas quanto não autenticadas
- **Redes Sociais**: Inclui links para GitHub, LinkedIn, Instagram e Twitter/X
- **Tecnologias Destacadas**: Mostra as principais tecnologias utilizadas no projeto
- **Ano Dinâmico**: O ano do copyright é atualizado automaticamente
- **Hover Effects**: Cores específicas para cada rede social (Instagram: rosa, outros: azul)

## Estrutura Visual

O rodapé possui:

1. **Linha Principal**: Nome do desenvolvedor e informações do projeto
2. **Links Sociais**: GitHub, LinkedIn, Instagram e Twitter/X
3. **Linha de Tecnologias**: Lista das principais tecnologias utilizadas
4. **Copyright**: Ano atual e nome do projeto

## Estilização

O rodapé utiliza:

- **Cores**: Tons de slate para manter consistência com o tema escuro
- **Ícones**: Lucide React para ícones modernos e consistentes
- **Animações**: Transições suaves nos hovers
- **Flexbox**: Layout responsivo e flexível