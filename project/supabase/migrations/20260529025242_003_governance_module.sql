/*
  # Governance and Planning Module - Schema

  1. New Tables
    - `action_plans_5w2h` - Action plans with 5W2H methodology and RICE prioritization
    - `governance_risks` - IT risk management with PxI matrix analysis

  2. Security
    - RLS enabled on all tables
    - Admin and Auditor can manage, Cliente can only view

  3. Important Notes
    - Action Plans use Kanban status (todo, doing, done)
    - RICE Score = (Reach * Impact * Confidence) / Effort
    - Risk Level = Probability * Impact (1-5 scale each, 1-25 result)
    - Risk treatment options vary based on Type (Threat/Opportunity)
*/

-- ============================================
-- ACTION PLANS 5W2H
-- ============================================
CREATE TABLE IF NOT EXISTS action_plans_5w2h (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  department text NOT NULL DEFAULT '',
  action_type text NOT NULL DEFAULT 'projeto' CHECK (action_type IN ('projeto', 'processo')),
  what text NOT NULL DEFAULT '',
  why text NOT NULL DEFAULT '',
  who_responsible text NOT NULL DEFAULT '',
  when_date date,
  where_location text NOT NULL DEFAULT '',
  how text NOT NULL DEFAULT '',
  how_much text NOT NULL DEFAULT '',
  reach numeric(10,2) DEFAULT 0,
  impact numeric(10,2) DEFAULT 0,
  confidence numeric(10,2) DEFAULT 0,
  effort numeric(10,2) DEFAULT 1,
  rice_score numeric(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- GOVERNANCE RISKS
-- ============================================
CREATE TABLE IF NOT EXISTS governance_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  description text NOT NULL,
  risk_type text NOT NULL DEFAULT 'ameaca' CHECK (risk_type IN ('ameaca', 'oportunidade')),
  cause text NOT NULL DEFAULT '',
  consequence text NOT NULL DEFAULT '',
  responsible text NOT NULL DEFAULT '',
  probability int NOT NULL DEFAULT 1 CHECK (probability >= 1 AND probability <= 5),
  impact_level int NOT NULL DEFAULT 1 CHECK (impact_level >= 1 AND impact_level <= 5),
  risk_level int NOT NULL DEFAULT 1,
  treatment text NOT NULL DEFAULT '' CHECK (treatment IN ('prevenir', 'mitigar', 'transferir', 'aceitar', 'evitar', 'explorar', 'melhorar', 'compartilhar', 'aceitar_oportunidade', '')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_action_plans_5w2h_company_id ON action_plans_5w2h(company_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_5w2h_status ON action_plans_5w2h(status);
CREATE INDEX IF NOT EXISTS idx_governance_risks_company_id ON governance_risks(company_id);
CREATE INDEX IF NOT EXISTS idx_governance_risks_risk_level ON governance_risks(risk_level);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE action_plans_5w2h ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_risks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ACTION PLANS 5W2H POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on action_plans_5w2h"
  ON action_plans_5w2h FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can read all action_plans_5w2h"
  ON action_plans_5w2h FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Clientes can read own company action_plans_5w2h"
  ON action_plans_5w2h FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins and auditors can insert action_plans_5w2h"
  ON action_plans_5w2h FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR is_auditor());

CREATE POLICY "Admins and auditors can update action_plans_5w2h"
  ON action_plans_5w2h FOR UPDATE
  TO authenticated
  USING (is_admin() OR is_auditor())
  WITH CHECK (is_admin() OR is_auditor());

CREATE POLICY "Admins can delete action_plans_5w2h"
  ON action_plans_5w2h FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- GOVERNANCE RISKS POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on governance_risks"
  ON governance_risks FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Auditors can read all governance_risks"
  ON governance_risks FOR SELECT
  TO authenticated
  USING (is_auditor());

CREATE POLICY "Clientes can read own company governance_risks"
  ON governance_risks FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

CREATE POLICY "Admins and auditors can insert governance_risks"
  ON governance_risks FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() OR is_auditor());

CREATE POLICY "Admins and auditors can update governance_risks"
  ON governance_risks FOR UPDATE
  TO authenticated
  USING (is_admin() OR is_auditor())
  WITH CHECK (is_admin() OR is_auditor());

CREATE POLICY "Admins can delete governance_risks"
  ON governance_risks FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_action_plans_5w2h_updated_at
  BEFORE UPDATE ON action_plans_5w2h
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_governance_risks_updated_at
  BEFORE UPDATE ON governance_risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
