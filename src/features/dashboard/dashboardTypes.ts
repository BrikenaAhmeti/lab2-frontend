export interface DashboardStats {
  appointments: {
    scheduled: number;
    checkedIn: number;
    completed: number;
    cancelled: number;
    noShow: number;
    total: number;
  };
  checkedInPatients: number;
  pendingLabOrders: number;
  lowStockItems: number;
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  revenueTrend: Array<{
    date: string;
    total: number;
  }>;
  updatedAt?: string | null;
}

export interface DashboardActivity {
  id: string;
  actionType: string;
  description: string;
  actorName: string;
  entityLabel?: string | null;
  entityLink?: string | null;
  createdAt: string;
}

export interface DashboardActivityList {
  items: DashboardActivity[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardActivityParams {
  page?: number;
  limit?: number;
}
