export interface AnalyticsData {
  openTickets: number;
  resolvedToday: number;
  slaMet: number; // percentage 0-100
  avgResolutionHours: number;
  byStatus: { status: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}
