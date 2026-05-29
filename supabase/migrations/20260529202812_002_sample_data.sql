/*
  # Sample Data for Pillars and Frameworks

  1. New Data
    - Insert default pillars for IT governance assessment
    - Insert default frameworks (COBIT, ITIL, ISO 27000)

  2. Important Notes
    - These are essential for the questions and assessments to work
*/

-- ============================================
-- FRAMEWORKS
-- ============================================
INSERT INTO frameworks (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'COBIT 2019', 'Framework de governança e gestão de TI'),
  ('00000000-0000-0000-0000-000000000002', 'ITIL 4', 'Framework de gerenciamento de serviços de TI'),
  ('00000000-0000-0000-0000-000000000003', 'ISO 27001', 'Framework de gestão de segurança da informação')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PILLARS
-- ============================================
INSERT INTO pillars (id, name, description, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Governança de TI', 'Estabelecer estruturas e processos de governança', 1),
  ('00000000-0000-0000-0000-000000000102', 'Gestão de Riscos', 'Identificar, avaliar e gerenciar riscos de TI', 2),
  ('00000000-0000-0000-0000-000000000103', 'Gestão de Serviços', 'Entregar serviços de TI com qualidade', 3),
  ('00000000-0000-0000-0000-000000000104', 'Segurança da Informação', 'Proteger ativos de informação', 4),
  ('00000000-0000-0000-0000-000000000105', 'Continuidade de Negócios', 'Garantir operação contínua de TI', 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE QUESTIONS
-- ============================================
INSERT INTO questions (id, pillar_id, framework_id, code, question_text, guidance, sort_order, is_active) VALUES
  -- Governança
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'GOV-001', 'Existe um comitê de TI com participação da alta gestão?', 'Verificar atas de reuniões e composição do comitê', 1, true),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'GOV-002', 'Existem políticas de TI documentadas e aprovadas?', 'Solicitar documentação das políticas vigentes', 2, true),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'GOV-003', 'O orçamento de TI está alinhado com a estratégia organizacional?', 'Verificar planejamento orçamentário e plano estratégico', 3, true),

  -- Riscos
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'RISK-001', 'Existe um processo de gestão de riscos de TI documentado?', 'Verificar documentação e procedimentos', 1, true),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'RISK-002', 'Riscos de TI são identificados e avaliados regularmente?', 'Solicitar registro de riscos e última avaliação', 2, true),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'RISK-003', 'Existem planos de mitigação para riscos críticos?', 'Verificar planos de ação para riscos priorizados', 3, true),

  -- Serviços
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'SVC-001', 'Existem SLAs definidos para os serviços de TI?', 'Solicitar catálogo de serviços e SLAs acordados', 1, true),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'SVC-002', 'O desempenho dos serviços é monitorado e reportado?', 'Verificar dashboards e relatórios de desempenho', 2, true),
  ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000002', 'SVC-003', 'Existe um processo de gestão de incidentes?', 'Solicitar procedimentos de incidentes e registros', 3, true),

  -- Segurança
  ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003', 'SEC-001', 'Existe uma política de segurança da informação?', 'Verificar documentação da política aprovada', 1, true),
  ('10000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003', 'SEC-002', 'Controles de acesso são implementados e revisados?', 'Solicitar evidências de controles e revisões', 2, true),
  ('10000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000003', 'SEC-003', 'Backups são realizados e testados regularmente?', 'Verificar política de backup e registros de testes', 3, true),

  -- Continuidade
  ('10000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'BC-001', 'Existe um plano de continuidade de negócios?', 'Solicitar documentação do plano', 1, true),
  ('10000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'BC-002', 'O plano de continuidade é testado periodicamente?', 'Verificar registros de testes e exercícios', 2, true),
  ('10000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001', 'BC-003', 'Procedimentos de recuperação de desastres estão documentados?', 'Solicitar documentação de DR', 3, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE COMPANY
-- ============================================
INSERT INTO companies (id, name, cnpj, sector, contact_name, contact_email, contact_phone) VALUES
  ('10000000-0000-0000-0000-000000000050', 'Empresa Exemplo LTDA', '12.345.678/0001-90', 'Tecnologia', 'João Silva', 'joao@empresa.com', '(11) 99999-8888')
ON CONFLICT (cnpj) DO NOTHING;
