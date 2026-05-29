import { supabase } from './supabase';
import type {
  Company,
  Pillar,
  Framework,
  Question,
  Assessment,
  AssessmentResponse,
  Evidence,
  ActionPlanAssessment,
  Risk,
  Service,
  AuditLog,
  ActionPlan5W2H,
  KanbanStatus,
  GovernanceRisk,
  ResponseType,
} from './types';

// ============================================
// COMPANIES
// ============================================
export async function getCompanies() {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) throw error;
  return data as Company[];
}

export async function getCompany(id: string) {
  const { data, error } = await supabase.from('companies').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Company | null;
}

export async function createCompany(company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('companies').insert(company).select().single();
  if (error) throw error;
  return data as Company;
}

export async function updateCompany(id: string, updates: Partial<Company>) {
  const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(id: string) {
  const { error } = await supabase.from('companies').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// PILLARS
// ============================================
export async function getPillars() {
  const { data, error } = await supabase.from('pillars').select('*').order('sort_order');
  if (error) throw error;
  return data as Pillar[];
}

export async function createPillar(pillar: Omit<Pillar, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('pillars').insert(pillar).select().single();
  if (error) throw error;
  return data as Pillar;
}

export async function updatePillar(id: string, updates: Partial<Pillar>) {
  const { data, error } = await supabase.from('pillars').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Pillar;
}

export async function deletePillar(id: string) {
  const { error } = await supabase.from('pillars').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// FRAMEWORKS
// ============================================
export async function getFrameworks() {
  const { data, error } = await supabase.from('frameworks').select('*').order('name');
  if (error) throw error;
  return data as Framework[];
}

export async function createFramework(framework: Omit<Framework, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('frameworks').insert(framework).select().single();
  if (error) throw error;
  return data as Framework;
}

export async function updateFramework(id: string, updates: Partial<Framework>) {
  const { data, error } = await supabase.from('frameworks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Framework;
}

export async function deleteFramework(id: string) {
  const { error } = await supabase.from('frameworks').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// QUESTIONS
// ============================================
export async function getQuestions(filters?: { pillar_id?: string; framework_id?: string }) {
  let query = supabase
    .from('questions')
    .select('*, pillar:pillars(*), framework:frameworks(*)')
    .order('sort_order');

  if (filters?.pillar_id) {
    query = query.eq('pillar_id', filters.pillar_id);
  }
  if (filters?.framework_id) {
    query = query.eq('framework_id', filters.framework_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Question & { pillar: Pillar; framework: Framework })[];
}

export async function getQuestion(id: string) {
  const { data, error } = await supabase
    .from('questions')
    .select('*, pillar:pillars(*), framework:frameworks(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as (Question & { pillar: Pillar; framework: Framework }) | null;
}

export async function createQuestion(question: Omit<Question, 'id' | 'created_at' | 'updated_at' | 'pillar' | 'framework'>) {
  const { data, error } = await supabase.from('questions').insert(question).select().single();
  if (error) throw error;
  return data as Question;
}

export async function updateQuestion(id: string, updates: Partial<Question>) {
  const { data, error } = await supabase.from('questions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// ASSESSMENTS
// ============================================
export async function getAssessments(companyId?: string) {
  let query = supabase
    .from('assessments')
    .select('*, company:companies(*), auditor:profiles(*)')
    .order('created_at', { ascending: false });

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as (Assessment & { company: Company; auditor: { id: string; full_name: string } })[];
}

export async function getAssessment(id: string) {
  const { data, error } = await supabase
    .from('assessments')
    .select('*, company:companies(*), auditor:profiles(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as (Assessment & { company: Company; auditor: { id: string; full_name: string } | null }) | null;
}

export async function createAssessment(assessment: Omit<Assessment, 'id' | 'created_at' | 'updated_at' | 'company' | 'auditor'>) {
  const { data, error } = await supabase.from('assessments').insert(assessment).select().single();
  if (error) throw error;
  return data as Assessment;
}

export async function updateAssessment(id: string, updates: Partial<Assessment>) {
  const { data, error } = await supabase.from('assessments').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Assessment;
}

export async function deleteAssessment(id: string) {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// ASSESSMENT RESPONSES
// ============================================
export async function getAssessmentResponses(assessmentId: string) {
  const { data, error } = await supabase
    .from('assessment_responses')
    .select('*, question:questions(*, pillar:pillars(*), framework:frameworks(*)), evidence:evidences(*), action_plan:action_plans(*)')
    .eq('assessment_id', assessmentId)
    .order('created_at');
  if (error) throw error;
  return data as (AssessmentResponse & {
    question: Question & { pillar: Pillar; framework: Framework };
    evidence: Evidence | null;
    action_plan: ActionPlanAssessment | null;
  })[];
}

export async function upsertAssessmentResponse(
  response: Omit<AssessmentResponse, 'id' | 'created_at' | 'updated_at' | 'question' | 'evidence' | 'action_plan'>
) {
  const { data, error } = await supabase
    .from('assessment_responses')
    .upsert(response, { onConflict: 'assessment_id,question_id' })
    .select()
    .single();
  if (error) throw error;
  return data as AssessmentResponse;
}

// ============================================
// EVIDENCES
// ============================================
export async function createEvidence(evidence: Omit<Evidence, 'id' | 'created_at'>) {
  const { data, error } = await supabase.from('evidences').insert(evidence).select().single();
  if (error) throw error;
  return data as Evidence;
}

export async function updateEvidence(id: string, updates: Partial<Evidence>) {
  const { data, error } = await supabase.from('evidences').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Evidence;
}

export async function deleteEvidence(id: string) {
  const { error } = await supabase.from('evidences').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// ACTION PLANS (for assessments)
// ============================================
export async function createActionPlan(plan: Omit<ActionPlanAssessment, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('action_plans').insert(plan).select().single();
  if (error) throw error;
  return data as ActionPlanAssessment;
}

export async function updateActionPlan(id: string, updates: Partial<ActionPlanAssessment>) {
  const { data, error } = await supabase.from('action_plans').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as ActionPlanAssessment;
}

export async function deleteActionPlan(id: string) {
  const { error } = await supabase.from('action_plans').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// RISKS
// ============================================
export async function getRisks(companyId?: string) {
  let query = supabase.from('risks').select('*').order('created_at', { ascending: false });

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Risk[];
}

export async function getRisk(id: string) {
  const { data, error } = await supabase.from('risks').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Risk | null;
}

export async function createRisk(risk: Omit<Risk, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('risks').insert(risk).select().single();
  if (error) throw error;
  return data as Risk;
}

export async function updateRisk(id: string, updates: Partial<Risk>) {
  const { data, error } = await supabase.from('risks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Risk;
}

export async function deleteRisk(id: string) {
  const { error } = await supabase.from('risks').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// SERVICES
// ============================================
export async function getServices(companyId?: string) {
  let query = supabase.from('services').select('*').order('name');

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Service[];
}

export async function getService(id: string) {
  const { data, error } = await supabase.from('services').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Service | null;
}

export async function createService(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase.from('services').insert(service).select().single();
  if (error) throw error;
  return data as Service;
}

export async function updateService(id: string, updates: Partial<Service>) {
  const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Service;
}

export async function deleteService(id: string) {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// AUDIT LOGS
// ============================================
export async function getAuditLogs(limit = 100) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as AuditLog[];
}

// ============================================
// ACTION PLANS 5W2H (Governance Module)
// ============================================
export async function getActionPlans5W2H(companyId: string) {
  const { data, error } = await supabase
    .from('action_plans_5w2h')
    .select('*')
    .eq('company_id', companyId)
    .order('rice_score', { ascending: false });
  if (error) throw error;
  return data as ActionPlan5W2H[];
}

export async function createActionPlan5W2H(plan: Omit<ActionPlan5W2H, 'id' | 'created_at' | 'updated_at' | 'rice_score'>) {
  const rice_score = plan.effort > 0 ? (plan.reach * plan.impact * plan.confidence) / plan.effort : 0;
  const { data, error } = await supabase
    .from('action_plans_5w2h')
    .insert({ ...plan, rice_score })
    .select()
    .single();
  if (error) throw error;
  return data as ActionPlan5W2H;
}

export async function updateActionPlan5W2H(id: string, updates: Partial<ActionPlan5W2H>) {
  if (updates.reach !== undefined || updates.impact !== undefined || updates.confidence !== undefined || updates.effort !== undefined) {
    const { data: current } = await supabase.from('action_plans_5w2h').select('*').eq('id', id).maybeSingle();
    if (current) {
      const reach = updates.reach ?? (current as ActionPlan5W2H).reach;
      const impact = updates.impact ?? (current as ActionPlan5W2H).impact;
      const confidence = updates.confidence ?? (current as ActionPlan5W2H).confidence;
      const effort = updates.effort ?? (current as ActionPlan5W2H).effort;
      (updates as Record<string, unknown>).rice_score = effort > 0 ? (reach * impact * confidence) / effort : 0;
    }
  }
  const { data, error } = await supabase.from('action_plans_5w2h').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as ActionPlan5W2H;
}

export async function updateActionPlan5W2HStatus(id: string, status: KanbanStatus) {
  const { data, error } = await supabase.from('action_plans_5w2h').update({ status }).eq('id', id).select().single();
  if (error) throw error;
  return data as ActionPlan5W2H;
}

export async function deleteActionPlan5W2H(id: string) {
  const { error } = await supabase.from('action_plans_5w2h').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// GOVERNANCE RISKS
// ============================================
export async function getGovernanceRisks(companyId: string) {
  const { data, error } = await supabase
    .from('governance_risks')
    .select('*')
    .eq('company_id', companyId)
    .order('risk_level', { ascending: false });
  if (error) throw error;
  return data as GovernanceRisk[];
}

export async function createGovernanceRisk(risk: Omit<GovernanceRisk, 'id' | 'created_at' | 'updated_at' | 'risk_level'>) {
  const risk_level = risk.probability * risk.impact_level;
  const { data, error } = await supabase
    .from('governance_risks')
    .insert({ ...risk, risk_level })
    .select()
    .single();
  if (error) throw error;
  return data as GovernanceRisk;
}

export async function updateGovernanceRisk(id: string, updates: Partial<GovernanceRisk>) {
  if (updates.probability !== undefined || updates.impact_level !== undefined) {
    const { data: current } = await supabase.from('governance_risks').select('*').eq('id', id).maybeSingle();
    if (current) {
      const probability = updates.probability ?? (current as GovernanceRisk).probability;
      const impact_level = updates.impact_level ?? (current as GovernanceRisk).impact_level;
      (updates as Record<string, unknown>).risk_level = probability * impact_level;
    }
  }
  const { data, error } = await supabase.from('governance_risks').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as GovernanceRisk;
}

export async function deleteGovernanceRisk(id: string) {
  const { error } = await supabase.from('governance_risks').delete().eq('id', id);
  if (error) throw error;
}

// Risk statistics
export async function getRiskStatistics(companyId: string) {
  const risks = await getGovernanceRisks(companyId);
  return {
    total: risks.length,
    critical: risks.filter(r => r.risk_level >= 20).length,
    high: risks.filter(r => r.risk_level >= 12 && r.risk_level < 20).length,
    medium: risks.filter(r => r.risk_level >= 6 && r.risk_level < 12).length,
    low: risks.filter(r => r.risk_level < 6).length,
    threats: risks.filter(r => r.risk_type === 'ameaca').length,
    opportunities: risks.filter(r => r.risk_type === 'oportunidade').length,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================
export async function initializeAssessmentResponses(assessmentId: string) {
  const questions = await getQuestions();
  const responses = questions.map(q => ({
    assessment_id: assessmentId,
    question_id: q.id,
    response: 'na' as ResponseType,
    notes: '',
  }));

  const { error } = await supabase.from('assessment_responses').insert(responses);
  if (error) throw error;
}
