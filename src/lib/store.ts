import { create } from 'zustand';

export type ActiveTab = 'dashboard' | 'product-groups' | 'target-allocation' | 'ad-hoc-requests' | 'excel-import' | 'periods' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'planning' | 'branch_manager';
  branchId: string | null;
  branchName: string | null;
  branchCode: string | null;
  isActive: boolean;
}

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Branch selection
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;

  // Period selection
  selectedPeriodId: string | null;
  setSelectedPeriodId: (id: string | null) => void;

  // Sales line filter
  selectedSalesLine: string | null;
  setSelectedSalesLine: (line: string | null) => void;

  // Selected product group for allocation
  selectedProductGroupId: string | null;
  setSelectedProductGroupId: (id: string | null) => void;

  // Selected target for allocation
  selectedTargetId: string | null;
  setSelectedTargetId: (id: string | null) => void;

  // Auth state
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  isLoadingAuth: boolean;
  setIsLoadingAuth: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedBranchId: null,
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),

  selectedPeriodId: null,
  setSelectedPeriodId: (id) => set({ selectedPeriodId: id }),

  selectedSalesLine: null,
  setSelectedSalesLine: (line) => set({ selectedSalesLine: line }),

  selectedProductGroupId: null,
  setSelectedProductGroupId: (id) => set({ selectedProductGroupId: id }),

  selectedTargetId: null,
  setSelectedTargetId: (id) => set({ selectedTargetId: id }),

  // Auth
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  isLoadingAuth: true,
  setIsLoadingAuth: (val) => set({ isLoadingAuth: val }),
}));

// Role-based tab visibility
export const getVisibleTabs = (role: string | null): ActiveTab[] => {
  switch (role) {
    case 'admin':
      return ['dashboard', 'product-groups', 'target-allocation', 'ad-hoc-requests', 'excel-import', 'periods', 'admin']
    case 'planning':
      return ['dashboard', 'product-groups', 'target-allocation', 'ad-hoc-requests', 'excel-import', 'periods']
    case 'branch_manager':
      return ['dashboard', 'target-allocation', 'ad-hoc-requests', 'periods']
    default:
      return ['dashboard']
  }
}

// Check if user can select branches (admin/planning can, branch_manager is locked)
export const canSelectBranch = (role: string | null): boolean => {
  return role === 'admin' || role === 'planning'
}
