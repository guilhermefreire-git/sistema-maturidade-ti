/*
  # IT Maturity Assessment Platform - Initial Schema

  1. New Tables
    - `companies` - Companies being assessed
    - `profiles` - User profiles with role-based access
    - `pillars` - Assessment pillars (IT governance domains)
    - `frameworks` - Assessment frameworks (COBIT, ITIL, ISO 27000)
    - `questions` - Assessment questions
    - `assessments` - Assessment records
    - `assessment_responses` - Individual question responses
    - `evidences` - Evidence attached to responses
    - `action_plans` - Action plans for assessment gaps
    - `risks` - Risk management
    - `services` - IT service catalog
    - `audit_logs` - System audit trail

  2. Security
    - RLS enabled on all tables
    - Role-based access: admin, auditor, cliente
    - Helper functions for role checking

  3. Important Notes
    - Users table managed by Supabase Auth
    - Profiles extend auth.users with role and company
    - All tables have created_at and updated_at timestamps
    - Triggers automatically update updated_at
*/

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_auditor() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'auditor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_cliente() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'cliente'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_company_id() RETURNS uuid AS $$
BEGIN
  RETURN (SELECT company_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'cliente' CHECK (role IN ('admin', 'auditor', 'cliente')),
  company_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- COMPANIES
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnpj text UNIQUE NOT NULL,
  sector text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- PILLARS
-- ============================================
CREATE TABLE IF NOT EXISTS pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- FRAMEWORKS
-- ============================================
CREATE TABLE IF NOT EXISTS frameworks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid REFERENCES pillars(id) ON DELETE CASCADE,
  framework_id uuid REFERENCES frameworks(id) ON DELETE CASCADE,
  code text NOT NULL,
  question_text text NOT NULL,
  guidance text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ASSESSMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  auditor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  overall_score numeric(5,2) DEFAULT 0,
  maturity_level text NOT NULL DEFAULT '',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- ASSESSMENT RESPONSES
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT 'na' CHECK (response IN ('ok', 'parcial', 'nao_ok', 'na')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(assessment_id, question_id)
);

-- ============================================
-- EVIDENCES
-- ============================================
CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_response_id uuid REFERENCES assessment_responses(id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  file_url text NOT NULL DEFAULT '',
  file_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ACTION PLANS (for assessments)
-- ============================================
CREATE TABLE IF NOT EXISTS action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_response_id uuid REFERENCES assessment_responses(id) ON DELETE CASCADE,
  what text NOT NULL DEFAULT '',
  why text NOT NULL DEFAULT '',
  who text NOT NULL DEFAULT '',
  when_date date,
  where_text text NOT NULL DEFAULT '',
  how text NOT NULL DEFAULT '',
  how_much text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- RISKS
-- ============================================
CREATE TABLE IF NOT EXISTS risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  likelihood text NOT NULL DEFAULT 'medium' CHECK (likelihood IN ('low', 'medium', 'high')),
  impact text NOT NULL DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
  risk_level text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mitigation_plan text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'mitigated', 'accepted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  service_owner text NOT NULL DEFAULT '',
  sla_target text NOT NULL DEFAULT '',
  current_performance text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'review')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_questions_pillar_id ON questions(pillar_id);
CREATE INDEX IF NOT EXISTS idx_questions_framework_id ON questions(framework_id);
CREATE INDEX IF NOT EXISTS idx_assessments_company_id ON assessments(company_id);
CREATE INDEX IF NOT EXISTS idx_assessments_auditor_id ON assessments(auditor_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment_id ON assessment_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risks_company_id ON risks(company_id);
CREATE INDEX IF NOT EXISTS idx_services_company_id ON services(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can do everything on profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- COMPANIES POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on companies"
  ON companies FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can read all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company"
  ON companies FOR SELECT
  TO authenticated
  USING (id = get_user_company_id());

-- ============================================
-- PILLARS POLICIES
-- ============================================
CREATE POLICY "Everyone can read pillars"
  ON pillars FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage pillars"
  ON pillars FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- FRAMEWORKS POLICIES
-- ============================================
CREATE POLICY "Everyone can read frameworks"
  ON frameworks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage frameworks"
  ON frameworks FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- QUESTIONS POLICIES
-- ============================================
CREATE POLICY "Everyone can read active questions"
  ON questions FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ASSESSMENTS POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can read and manage assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company assessments"
  ON assessments FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- ASSESSMENT RESPONSES POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on assessment_responses"
  ON assessment_responses FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can manage assessment_responses"
  ON assessment_responses FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company assessment_responses"
  ON assessment_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments
      WHERE assessments.id = assessment_responses.assessment_id
      AND assessments.company_id = get_user_company_id()
    )
  );

-- ============================================
-- EVIDENCES POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on evidences"
  ON evidences FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can manage evidences"
  ON evidences FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company evidences"
  ON evidences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessment_responses
      JOIN assessments ON assessments.id = assessment_responses.assessment_id
      WHERE assessment_responses.id = evidences.assessment_response_id
      AND assessments.company_id = get_user_company_id()
    )
  );

-- ============================================
-- ACTION PLANS POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on action_plans"
  ON action_plans FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can manage action_plans"
  ON action_plans FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company action_plans"
  ON action_plans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessment_responses
      JOIN assessments ON assessments.id = assessment_responses.assessment_id
      WHERE assessment_responses.id = action_plans.assessment_response_id
      AND assessments.company_id = get_user_company_id()
    )
  );

-- ============================================
-- RISKS POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on risks"
  ON risks FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can manage risks"
  ON risks FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company risks"
  ON risks FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- SERVICES POLICIES
-- ============================================
CREATE POLICY "Admins can do everything on services"
  ON services FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Auditors can manage services"
  ON services FOR ALL
  TO authenticated
  USING (is_auditor() OR is_admin())
  WITH CHECK (is_auditor() OR is_admin());

CREATE POLICY "Clientes can read own company services"
  ON services FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================
CREATE POLICY "Admins can read audit_logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
  BEFORE UPDATE ON assessment_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON action_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON risks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUDIT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  action_text text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    old_data := null;
    new_data := to_jsonb(NEW);
    action_text := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    action_text := 'UPDATE';
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    new_data := null;
    action_text := 'DELETE';
  END IF;

  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address)
  VALUES (
    auth.uid(),
    action_text,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    COALESCE(old_data, '{}'::jsonb),
    COALESCE(new_data, '{}'::jsonb),
    ''
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT TRIGGERS (for key tables)
-- ============================================
CREATE TRIGGER audit_companies
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_assessments
  AFTER INSERT OR UPDATE OR DELETE ON assessments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_risks
  AFTER INSERT OR UPDATE OR DELETE ON risks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_services
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
