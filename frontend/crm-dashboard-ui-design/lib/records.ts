import type {
  Activity,
  ActivityStatus,
  ActivityType,
  AuditLog,
  Customer,
  CustomerStatus,
  FollowUp,
  FollowUpStatus,
  Lead,
  LeadSource,
  LeadStatus,
  Opportunity,
  OpportunityStage,
  Priority,
  RelatedType,
  Role,
  User,
} from '@/types'

export interface ApiRecord {
  id: string
  code: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  status: string
  source?: string | null
  priority: string
  amount: number
  expectedValue: number
  probability: number
  stage: string
  expectedCloseDate?: string | null
  followUpDate?: string | null
  activityDate?: string | null
  type: string
  notes?: string | null
  customerId?: string | null
  leadId?: string | null
  opportunityId?: string | null
  ownerId?: string | null
  version?: number
  createdAt: string
  convertedCustomerId?: string | null
}

export interface DashboardData {
  totalCustomers: number
  totalLeads: number
  openLeads: number
  totalOpportunities: number
  openOpportunities: number
  wonOpportunities: number
  lostOpportunities: number
  pipelineValue: number
  weightedPipeline: number
  conversionRate: number
  leadStatus: { label: string; value: number }[]
  pipeline: { label: string; value: number }[]
  monthlySales: { label: string; value: number }[]
}

const emptyDashboard: DashboardData = {
  totalCustomers: 0,
  totalLeads: 0,
  openLeads: 0,
  totalOpportunities: 0,
  openOpportunities: 0,
  wonOpportunities: 0,
  lostOpportunities: 0,
  pipelineValue: 0,
  weightedPipeline: 0,
  conversionRate: 0,
  leadStatus: [],
  pipeline: [],
  monthlySales: [],
}

export { emptyDashboard }

function related(record: ApiRecord): { relatedType: RelatedType; relatedId: string } {
  if (record.customerId) return { relatedType: 'Customer', relatedId: record.customerId }
  if (record.leadId) return { relatedType: 'Lead', relatedId: record.leadId }
  if (record.opportunityId) return { relatedType: 'Opportunity', relatedId: record.opportunityId }
  return { relatedType: 'Customer', relatedId: '' }
}

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : ''
}

export function toCustomer(record: ApiRecord): Customer {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    company: record.companyName ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    address: record.address ?? '',
    city: record.city ?? '',
    state: record.state ?? '',
    status: (record.status || 'Active') as CustomerStatus,
    ownerId: record.ownerId ?? '',
    notes: record.notes ?? '',
    createdAt: record.createdAt,
    version: record.version,
  }
}

export function toLead(record: ApiRecord): Lead {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    company: record.companyName ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    source: (record.source || 'Website') as LeadSource,
    status: record.status as LeadStatus,
    priority: (record.priority || 'Medium') as Priority,
    expectedValue: Number(record.expectedValue ?? 0),
    ownerId: record.ownerId ?? '',
    notes: record.notes ?? '',
    createdAt: record.createdAt,
    version: record.version,
  }
}

export function toOpportunity(record: ApiRecord): Opportunity {
  return {
    id: record.id,
    name: record.name,
    customerId: record.customerId ?? '',
    leadId: record.leadId ?? undefined,
    stage: (record.stage || 'Qualification') as OpportunityStage,
    amount: Number(record.amount ?? 0),
    probability: record.probability ?? 0,
    expectedCloseDate: dateOnly(record.expectedCloseDate),
    ownerId: record.ownerId ?? '',
    notes: record.notes ?? '',
    createdAt: record.createdAt,
    version: record.version,
  }
}

export function toFollowUp(record: ApiRecord): FollowUp {
  const link = related(record)
  return {
    id: record.id,
    subject: record.name,
    relatedType: link.relatedType,
    relatedId: link.relatedId,
    date: record.followUpDate ?? record.createdAt,
    type: (record.type || 'Call') as ActivityType,
    status: record.status as FollowUpStatus,
    ownerId: record.ownerId ?? '',
    notes: record.notes ?? '',
    version: record.version,
  }
}

export function toActivity(record: ApiRecord): Activity {
  const link = related(record)
  return {
    id: record.id,
    type: (record.type || 'Call') as ActivityType,
    subject: record.name,
    relatedType: link.relatedType,
    relatedId: link.relatedId,
    date: record.activityDate ?? record.createdAt,
    status: (record.status || 'Pending') as ActivityStatus,
    ownerId: record.ownerId ?? '',
    description: record.notes ?? '',
    version: record.version,
  }
}

function links(type?: RelatedType, id?: string) {
  return {
    customerId: type === 'Customer' ? id : null,
    leadId: type === 'Lead' ? id : null,
    opportunityId: type === 'Opportunity' ? id : null,
  }
}

export function customerInput(item: Customer) {
  return {
    name: item.name,
    email: item.email,
    phone: item.phone,
    companyName: item.company,
    address: item.address,
    city: item.city,
    state: item.state,
    status: item.status,
    priority: 'Medium',
    amount: 0,
    expectedValue: 0,
    probability: 0,
    stage: 'Qualification',
    type: 'Call',
    notes: item.notes,
    ownerId: item.ownerId,
    version: item.version,
  }
}

export function leadInput(item: Lead) {
  return {
    name: item.name,
    email: item.email || null,
    phone: item.phone || null,
    companyName: item.company,
    source: item.source,
    status: item.status,
    priority: item.priority,
    expectedValue: item.expectedValue,
    amount: 0,
    probability: 0,
    stage: 'Qualification',
    type: 'Call',
    notes: item.notes,
    ownerId: item.ownerId,
    version: item.version,
  }
}

export function opportunityInput(item: Opportunity) {
  const status = item.stage === 'Won' ? 'Won' : item.stage === 'Lost' ? 'Lost' : 'Open'
  return {
    name: item.name,
    customerId: item.customerId,
    leadId: item.leadId || null,
    stage: item.stage,
    status,
    amount: item.amount,
    probability: item.probability,
    expectedCloseDate: item.expectedCloseDate,
    expectedValue: 0,
    priority: 'Medium',
    type: 'Call',
    notes: item.notes,
    ownerId: item.ownerId,
    version: item.version,
  }
}

export function followUpInput(item: FollowUp) {
  return {
    name: item.subject,
    ...links(item.relatedType, item.relatedId),
    followUpDate: item.date,
    type: item.type,
    status: item.status,
    notes: item.notes,
    priority: 'Medium',
    amount: 0,
    expectedValue: 0,
    probability: 0,
    stage: 'Qualification',
    ownerId: item.ownerId,
    version: item.version,
  }
}

export function activityInput(item: Activity) {
  return {
    name: item.subject,
    ...links(item.relatedType, item.relatedId),
    activityDate: item.date,
    type: item.type,
    status: item.status,
    notes: item.description,
    priority: 'Medium',
    amount: 0,
    expectedValue: 0,
    probability: 0,
    stage: 'Qualification',
    ownerId: item.ownerId,
    version: item.version,
  }
}

export function toUser(raw: {
  id: string
  name: string
  email?: string | null
  role?: string | null
  teamId?: string | null
  isActive?: boolean
  lockoutEnd?: string | null
}): User {
  const locked = raw.lockoutEnd ? new Date(raw.lockoutEnd).getTime() > Date.now() : false
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email ?? '',
    phone: '',
    role: (raw.role || 'SalesExecutive') as Role,
    active: raw.isActive ?? true,
    lockedOut: locked,
    createdAt: '',
    lastLogin: '',
    teamId: raw.teamId,
  }
}

export function toAudit(raw: {
  id: number | string
  userId?: string | null
  action: string
  entityName: string
  recordId?: string | null
  oldValue?: string | null
  newValue?: string | null
  createdAt: string
  ipAddress?: string | null
}): AuditLog {
  return {
    id: String(raw.id),
    userId: raw.userId ?? '',
    action: raw.action,
    entity: raw.entityName,
    recordId: raw.recordId ?? '',
    oldValue: raw.oldValue ?? '',
    newValue: raw.newValue ?? '',
    ipAddress: raw.ipAddress ?? '',
    timestamp: raw.createdAt,
  }
}
