-- Migration para remover o perfil ADMIN e migrar usuários para COMMISSIONER
-- Data: 2025-01-01
-- Descrição: Remove completamente o perfil ADMIN do sistema, migrando todos os usuários
--            administradores para COMMISSIONER

-- Primeiro, migrar todos os usuários ADMIN para COMMISSIONER
UPDATE "users" SET "role" = 'COMMISSIONER' WHERE "role" = 'ADMIN';

-- Verificar se a migração foi bem-sucedida
-- Após esta migration, não deve haver mais usuários com role = 'ADMIN'