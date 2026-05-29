import { supabase } from './supabase';
import type { Company } from './types';

// ============================================
// COMPANIES
// ============================================
export async function getCompanies() {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) throw error;
  return data as Company[];
}

// ============================================
// ACTION PLANS 5W2H
// ============================================
import type { ActionPlan5W2H, KanbanStatus } from './types';

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
import type { GovernanceRisk } from './types';

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
