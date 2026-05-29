export type UserRole = 'admin' | 'auditor' | 'cliente';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  sector: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Question {
  id: string;
  pillar_id: string;
  framework_id: string;
  code: string;
  question_text: string;
  guidance: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pillar?: Pillar;
  framework?: Framework;
}

export type AssessmentStatus = 'draft' | 'in_progress' | 'completed';
export type ResponseType = 'ok' | 'parcial' | 'nao_ok' | 'na';

export interface Assessment {
  id: string;
  company_id: string;
  auditor_id: string;
  status: AssessmentStatus;
  overall_score: number;
  maturity_level: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  company?: Company;
  auditor?: Profile;
}

export interface AssessmentResponse {
  id: string;
  assessment_id: string;
  question_id: string;
  response: ResponseType;
  notes: string;
  created_at: string;
  updated_at: string;
  question?: Question;
  evidence?: Evidence;
  action_plan?: ActionPlanAssessment;
}

export interface Evidence {
  id: string;
  assessment_response_id: string;
  description: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface ActionPlanAssessment {
  id: string;
  assessment_response_id: string;
  what: string;
  why: string;
  who: string;
  when_date: string | null;
  where_text: string;
  how: string;
  how_much: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export type RiskLikelihood = 'low' | 'medium' | 'high';
export type RiskImpact = 'low' | 'medium' | 'high';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskStatus = 'open' | 'mitigating' | 'mitigated' | 'accepted';

export interface Risk {
  id: string;
  company_id: string;
  assessment_id: string | null;
  title: string;
  description: string;
  category: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  risk_level: RiskLevel;
  mitigation_plan: string;
  owner: string;
  status: RiskStatus;
  created_at: string;
  updated_at: string;
}

export type ServiceStatus = 'active' | 'inactive' | 'review';

export interface Service {
  id: string;
  company_id: string;
  assessment_id: string | null;
  name: string;
  description: string;
  category: string;
  service_owner: string;
  sla_target: string;
  current_performance: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

// ============================================
// ACTION PLANS 5W2H (GoVERNANCE MODULE)
// ============================================
export type ActionType5W2H = 'projeto' | 'processo';
export type KanbanStatus = 'todo' | 'doing' | 'done';

export interface ActionPlan5W2H {
  id: string;
  company_id: string;
  department: string;
  action_type: ActionType5W2H;
  what: string;
  why: string;
  who_responsible: string;
  when_date: string | null;
  where_location: string;
  how: string;
  how_much: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  rice_score: number;
  status: KanbanStatus;
  created_at: string;
  updated_at: string;
}

export function calculateRICEScore(reach: number, impact: number, confidence: number, effort: number): number {
  if (effort <= 0) return 0;
  return (reach * impact * confidence) / effort;
}

// ============================================
// GOVERNANCE RISKS
// ============================================
export type GovernanceRiskType = 'ameaca' | 'oportunidade';
export type ThreatTreatment = 'prevenir' | 'mitigar' | 'transferir' | 'aceitar' | 'evitar';
export type OpportunityTreatment = 'explorar' | 'melhorar' | 'compartilhar' | 'aceitar_oportunidade';

export interface GovernanceRisk {
  id: string;
  company_id: string;
  description: string;
  risk_type: GovernanceRiskType;
  cause: string;
  consequence: string;
  responsible: string;
  probability: number; // 1-5
  impact_level: number; // 1-5
  risk_level: number; // probability * impact_level (1-25)
  treatment: ThreatTreatment | OpportunityTreatment | '';
  created_at: string;
  updated_at: string;
}

export function calculateRiskLevel(probability: number, impact: number): number {
  return probability * impact;
}

export function getRiskLevelColor(level: number): string {
  if (level >= 20) return '#ef4444'; // critical - red
  if (level >= 12) return '#f97316'; // high - orange
  if (level >= 6) return '#eab308'; // medium - yellow
  return '#22c55e'; // low - green
}

export function getRiskLevelLabel(level: number): string {
  if (level >= 20) return 'Critico';
  if (level >= 12) return 'Alto';
  if (level >= 6) return 'Medio';
  return 'Baixo';
}

export const THREAT_TREATMENTS: { value: ThreatTreatment; label: string }[] = [
  { value: 'prevenir', label: 'Prevenir' },
  { value: 'mitigar', label: 'Mitigar' },
  { value: 'transferir', label: 'Transferir' },
  { value: 'aceitar', label: 'Aceitar' },
  { value: 'evitar', label: 'Evitar' },
];

export const OPPORTUNITY_TREATMENTS: { value: OpportunityTreatment; label: string }[] = [
  { value: 'explorar', label: 'Explorar' },
  { value: 'melhorar', label: 'Melhorar' },
  { value: 'compartilhar', label: 'Compartilhar' },
  { value: 'aceitar_oportunidade', label: 'Aceitar' },
];

export const MATURITY_LEVELS = [
  { min: 0, max: 49, label: 'Artesanal / Reativo', color: '#ef4444' },
  { min: 50, max: 79, label: 'Eficiente / Proativo', color: '#f59e0b' },
  { min: 80, max: 90, label: 'Eficaz / Otimizado', color: '#3b82f6' },
  { min: 91, max: 100, label: 'Estrategico', color: '#10b981' },
] as const;

export function getMaturityLevel(score: number) {
  return MATURITY_LEVELS.find(l => score >= l.min && score <= l.max) || MATURITY_LEVELS[0];
}

export const RESPONSE_WEIGHTS: Record<ResponseType, number> = {
  ok: 2,
  parcial: 1,
  nao_ok: 0,
  na: 0,
};

export function calculateScore(responses: AssessmentResponse[]): number {
  const scorable = responses.filter(r => r.response !== 'na');
  if (scorable.length === 0) return 0;
  const earned = scorable.reduce((sum, r) => sum + RESPONSE_WEIGHTS[r.response], 0);
  const maxPossible = scorable.length * 2;
  return Math.round((earned / maxPossible) * 100);
}
