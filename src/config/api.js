/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

// API Base URL from environment variables
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
  },

  // Dashboard
  DASHBOARD: {
    MANAGER_STATS: '/api/dashboard/manager/stats',
  },

  // Claims
  CLAIMS: {
    BASE: '/api/claims',
    MY_CLAIMS: '/api/claims/my',
    SUBMIT: '/api/claims',
    BY_ID: (id) => `/api/claims/${id}`,
  },

  // Healthcare Provider Claims
  HEALTHCARE_CLAIMS: {
    BASE: '/api/healthcare-provider-claims',
    MY_CLAIMS: '/api/healthcare-provider-claims/my-claims',
    SUBMIT: '/api/healthcare-provider-claims/create',
    MEDICAL_REVIEW: '/api/healthcare-provider-claims/medical-review',
    COORDINATION_REVIEW: '/api/healthcare-provider-claims/coordination-review',
    FINAL_DECISIONS: '/api/healthcare-provider-claims/final-decisions',
    APPROVE_MEDICAL: (id) => `/api/healthcare-provider-claims/${id}/approve-medical`,
    REJECT_MEDICAL: (id) => `/api/healthcare-provider-claims/${id}/reject-medical`,
    APPROVE_FINAL: (id) => `/api/healthcare-provider-claims/${id}/approve-final`,
    REJECT_FINAL: (id) => `/api/healthcare-provider-claims/${id}/reject-final`,
    RETURN_TO_MEDICAL: (id) => `/api/healthcare-provider-claims/${id}/return-to-medical`,
    REPORTS_PDF: '/api/healthcare-provider-claims/reports/pdf',
  },

  // Clients
  CLIENTS: {
    BASE: '/api/clients',
    LIST: '/api/clients/list',
    PENDING: '/api/clients/pending',
    BY_ID: (id) => `/api/clients/${id}`,
    APPROVE: (id) => `/api/clients/${id}/approve`,
    REJECT: (id) => `/api/clients/${id}/reject`,
    SEARCH_BY_EMPLOYEE_ID: (employeeId) => `/api/clients/search/employeeId/${employeeId}`,
    SEARCH_BY_NATIONAL_ID: (nationalId) => `/api/clients/search/nationalId/${nationalId}`,
    SEARCH_BY_NAME: (name) => `/api/clients/search/name/${name}`,
    UPDATE: '/api/clients',
    HEALTHCARE_PROVIDERS: '/api/clients/healthcare-providers',
    BULK_ASSIGN_POLICY: '/api/clients/bulk-assign-policy',
  },

  // Emergencies
  EMERGENCIES: {
    ALL: '/api/emergencies/all',
    CREATE: '/api/emergencies/create',
    BY_ID: (id) => `/api/emergencies/${id}`,
    APPROVE: (id) => `/api/emergencies/${id}/approve`,
    REJECT: (id) => `/api/emergencies/${id}/reject`,
    DOCTOR_MY_REQUESTS: '/api/emergencies/doctor/my-requests',
  },

  // Family Members
  FAMILY_MEMBERS: {
    BASE: '/api/family-members',
    MY: '/api/family-members/my',
    PENDING: '/api/family-members/pending',
    BY_CLIENT: (clientId) => `/api/family-members/client/${clientId}`,
    BY_ID: (id) => `/api/family-members/${id}`,
    APPROVE: (id) => `/api/family-members/${id}/approve`,
    REJECT: (id) => `/api/family-members/${id}/reject`,
    FILE: (filename) => `/api/family-members/file/${filename}`,
  },

  // Policies
  POLICIES: {
    BASE: '/api/policies',
    ALL: '/api/policies/all',
    BY_ID: (id) => `/api/policies/${id}`,
    CREATE: '/api/policies/create',
    UPDATE: (id) => `/api/policies/update/${id}`,
    DELETE: (id) => `/api/policies/delete/${id}`,
    BULK_DELETE: '/api/policies/bulk-delete',
    COVERAGES: (policyId) => `/api/policies/${policyId}/coverages/all`,
    ADD_COVERAGE: (policyId) => `/api/policies/${policyId}/coverages/add`,
  },

  // Coverages
  COVERAGES: {
    UPDATE: (id) => `/api/coverages/update/${id}`,
    DELETE: (id) => `/api/coverages/delete/${id}`,
  },

  // Search Profiles (Healthcare Providers)
  SEARCH_PROFILES: {
    BASE: '/api/search-profiles',
    CREATE: '/api/search-profiles/create',
    APPROVED: '/api/search-profiles/approved',
    PENDING: '/api/search-profiles/pending',
    MY: '/api/search-profiles/my-profiles',
    BY_ID: (id) => `/api/search-profiles/${id}`,
    EDIT: (id) => `/api/search-profiles/${id}/edit`,
    FILE: (filename) => `/api/search-profiles/file/${filename}`,
    APPROVE: (id) => `/api/search-profiles/${id}/approve`,
    REJECT: (id) => `/api/search-profiles/${id}/reject`,
    BY_NAME: '/api/search-profiles/by-name',
  },

  // Prescriptions
  PRESCRIPTIONS: {
    BASE: '/api/prescriptions',
    GET: '/api/prescriptions/get',
    MY: '/api/prescriptions/my',
    BY_CLIENT: (clientId) => `/api/prescriptions/client/${clientId}`,
  },

  // Labs
  LABS: {
    BASE: '/api/labs',
    GET_BY_MEMBER: '/api/labs/getByMember',
    BY_CLIENT: (clientId) => `/api/labs/client/${clientId}`,
    UPLOAD: (id) => `/api/labs/${id}/upload`,
  },

  // Lab Requests (alias for backwards compatibility)
  LAB_REQUESTS: {
    BASE: '/api/lab-requests',
    MY: '/api/labs/doctor/my',
    BY_CLIENT: (clientId) => `/api/lab-requests/client/${clientId}`,
  },

  // Radiology
  RADIOLOGY: {
    BASE: '/api/radiology',
    GET_BY_MEMBER: '/api/radiology/getByMember',
    BY_CLIENT: (clientId) => `/api/radiology/client/${clientId}`,
    UPLOAD_RESULT: (id) => `/api/radiology/${id}/uploadResult`,
  },

  // Radiology Requests (alias for backwards compatibility)
  RADIOLOGY_REQUESTS: {
    BASE: '/api/radiology',
    MY: '/api/radiology/doctor/my',
    BY_CLIENT: (clientId) => `/api/radiology/client/${clientId}`,
  },

  // Emergency
  EMERGENCY: {
    BASE: '/api/emergencies',
    PENDING: '/api/emergencies/pending',
    BY_ID: (id) => `/api/emergencies/${id}`,
  },

  // Medical Records
  MEDICAL_RECORDS: {
    BASE: '/api/medical-records',
    BY_MEMBER: '/api/medical-records/Bymember',
    BY_ID: (id) => `/api/medical-records/${id}`,
    ME_UPDATE: '/api/medical-records/me/update',
    STATS: '/api/medical-records/stats',
  },

  // Notifications
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    ALL: '/api/notifications',
    UNREAD_COUNT: '/api/notifications/unread-count',
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    MARK_ALL_READ: '/api/notifications/read-all',
    RECIPIENTS: '/api/notifications/recipients',
    BY_FULLNAME: '/api/notifications/by-fullname',
  },

  // Chat
  CHAT: {
    WEBSOCKET: '/ws-chat',
    USERS: '/api/chat/users',
    MESSAGES: '/api/chat/messages',
    HISTORY: (recipientId) => `/api/chat/history/${recipientId}`,
  },

  // Reports
  REPORTS: {
    CLAIMS: '/api/reports/claims',
    FINANCIAL: '/api/reports/financial',
    PROVIDER_EXPENSES: (providerId) => `/api/reports/financial/provider/${providerId}/expenses`,
  },

  // Doctor specific
  DOCTOR: {
    SPECIALIZATIONS: '/api/doctor-specializations',
    SPECIALIZATIONS_MANAGER_ALL: '/api/doctor-specializations/manager/all',
  },

  // Price List
  PRICELIST: {
    BASE: '/api/pricelist',
    BY_TYPE: (type) => `/api/pricelist/${type}`,
    BY_ID: (id) => `/api/pricelist/${id}`,
  },
};

// Claim Status Constants
export const CLAIM_STATUS = {
  // Legacy statuses (for backward compatibility)
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  APPROVED_BY_MEDICAL: 'APPROVED_BY_MEDICAL',

  // New workflow statuses
  PENDING_MEDICAL: 'PENDING_MEDICAL',
  AWAITING_COORDINATION_REVIEW: 'AWAITING_COORDINATION_REVIEW',
  PENDING_COORDINATION: 'PENDING_COORDINATION',
  APPROVED_MEDICAL: 'APPROVED_MEDICAL',
  REJECTED_MEDICAL: 'REJECTED_MEDICAL',
  APPROVED_FINAL: 'APPROVED_FINAL',
  REJECTED_FINAL: 'REJECTED_FINAL',
  RETURNED_FOR_REVIEW: 'RETURNED_FOR_REVIEW',
  RETURNED_TO_PROVIDER: 'RETURNED_TO_PROVIDER',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
};

// Claim Status Display Configuration
export const CLAIM_STATUS_CONFIG = {
  // Legacy status configs
  [CLAIM_STATUS.PENDING]: {
    color: 'warning',
    label: 'Pending',
    bgColor: '#FFF3E0',
    textColor: '#E65100',
  },
  [CLAIM_STATUS.APPROVED]: {
    color: 'success',
    label: 'Approved',
    bgColor: '#E8F5E9',
    textColor: '#1B5E20',
  },
  [CLAIM_STATUS.REJECTED]: {
    color: 'error',
    label: 'Rejected',
    bgColor: '#FFEBEE',
    textColor: '#B71C1C',
  },
  [CLAIM_STATUS.APPROVED_BY_MEDICAL]: {
    color: 'info',
    label: 'Approved by Medical',
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
  },

  // New workflow status configs
  [CLAIM_STATUS.PENDING_MEDICAL]: {
    color: 'warning',
    label: 'Pending Medical Review',
    bgColor: '#FFF3E0',
    textColor: '#E65100',
  },
  [CLAIM_STATUS.PENDING_COORDINATION]: {
    color: 'info',
    label: 'Pending Coordination Review',
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
  },
  [CLAIM_STATUS.APPROVED_MEDICAL]: {
    color: 'info',
    label: 'Approved by Medical',
    bgColor: '#E8F5E9',
    textColor: '#2E7D32',
  },
  [CLAIM_STATUS.REJECTED_MEDICAL]: {
    color: 'error',
    label: 'Rejected by Medical',
    bgColor: '#FFEBEE',
    textColor: '#C62828',
  },
  [CLAIM_STATUS.APPROVED_FINAL]: {
    color: 'success',
    label: 'Approved',
    bgColor: '#E8F5E9',
    textColor: '#1B5E20',
  },
  [CLAIM_STATUS.REJECTED_FINAL]: {
    color: 'error',
    label: 'Rejected',
    bgColor: '#FFEBEE',
    textColor: '#B71C1C',
  },
  [CLAIM_STATUS.RETURNED_FOR_REVIEW]: {
    color: 'warning',
    label: 'Returned for Review',
    bgColor: '#FFF8E1',
    textColor: '#F57F17',
  },
  [CLAIM_STATUS.AWAITING_COORDINATION_REVIEW]: {
    color: 'info',
    label: 'Awaiting Coordination Review',
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
  },
  [CLAIM_STATUS.RETURNED_TO_PROVIDER]: {
    color: 'warning',
    label: 'Returned to Provider',
    bgColor: '#FFF8E1',
    textColor: '#F57F17',
  },
  [CLAIM_STATUS.PAYMENT_PENDING]: {
    color: 'info',
    label: 'Payment Pending',
    bgColor: '#E3F2FD',
    textColor: '#1565C0',
  },
  [CLAIM_STATUS.PAID]: {
    color: 'success',
    label: 'Paid',
    bgColor: '#C8E6C9',
    textColor: '#1B5E20',
  },
};

// Provider Roles
export const PROVIDER_ROLES = {
  DOCTOR: 'DOCTOR',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
  RADIOLOGIST: 'RADIOLOGIST',
  INSURANCE_CLIENT: 'INSURANCE_CLIENT',
};

// User Roles
export const USER_ROLES = {
  INSURANCE_MANAGER: 'INSURANCE_MANAGER',
  MEDICAL_ADMIN: 'MEDICAL_ADMIN',
  COORDINATION_ADMIN: 'COORDINATION_ADMIN',
  INSURANCE_CLIENT: 'INSURANCE_CLIENT',
  DOCTOR: 'DOCTOR',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
  RADIOLOGIST: 'RADIOLOGIST',
};

// Currency Configuration
export const CURRENCY = {
  CODE: 'ILS',
  SYMBOL: '₪',
  NAME: 'Israeli New Shekel',
  NAME_AR: 'شيكل',
};

// Format currency amount
export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return `${num.toFixed(2)} ${CURRENCY.SYMBOL}`;
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  CLAIM_STATUS,
  CLAIM_STATUS_CONFIG,
  PROVIDER_ROLES,
  USER_ROLES,
  CURRENCY,
  formatCurrency,
};
