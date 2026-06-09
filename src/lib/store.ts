import { create } from 'zustand';

export type ActiveTab = 'dashboard' | 'product-groups' | 'target-allocation' | 'ad-hoc-requests' | 'excel-import' | 'periods' | 'admin';

interface AppState {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Branch selection (simulating branch-based access control)
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
}));
