'use client';

import { Code, Github, Linkedin, Instagram, Twitter } from 'lucide-react';

/**
 * Componente de rodapé para ser exibido em todas as páginas
 * Destaca o desenvolvedor e informações do projeto
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Informações do desenvolvedor */}
          <div className="flex items-center space-x-2 text-slate-300">
            <Code className="h-5 w-5 text-blue-400" />
            <span className="text-sm">
              Desenvolvido por{' '}
              <span className="font-semibold text-blue-400">Leandro Zepechouka</span>
            </span>
          </div>

          {/* Informações do projeto */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-4">
              <span>Fantasy Contract Manager</span>
              <span className="hidden md:inline">•</span>
              <span>© {currentYear}</span>
            </div>

            {/* Links sociais/profissionais */}
            <div className="flex items-center space-x-3">
              <a
                href="https://github.com/lzpck"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/leandrozepechouka/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/lzpck/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-pink-400 transition-colors duration-200"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://x.com/lzndrzk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 transition-colors duration-200"
                title="Twitter/X"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Linha adicional com tecnologias (opcional) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-center space-x-4 text-xs text-slate-500">
            <span>Next.js</span>
            <span>•</span>
            <span>React</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Prisma</span>
            <span>•</span>
            <span>TailwindCSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
