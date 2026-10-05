export interface SchoolDashboardCounts {
  pendingOrders: number;
  pendingJoinRequests: number;
  overduePayments: number;
}

/** Translation key of a tile subtitle and the count it interpolates. */
export interface TileSubtitle {
  key: string;
  count?: number;
}

export interface SchoolTileSubtitles {
  students: TileSubtitle;
  attendance: TileSubtitle;
  payments: TileSubtitle;
  orders: TileSubtitle;
}

const counted = (count: number, countKey: string, fallbackKey: string): TileSubtitle =>
  count > 0 ? { key: countKey, count } : { key: fallbackKey };

/**
 * Subtitles of the school dashboard tiles (board 2A): a tile shows what needs
 * attention (pending requests, overdue payments, pending orders) and its
 * one-line description when there is nothing to do.
 */
export function schoolTileSubtitles(counts: SchoolDashboardCounts): SchoolTileSubtitles {
  return {
    students: counted(counts.pendingJoinRequests, "dashboardStudentsSubtitle", "dashboardTileStudents"),
    attendance: { key: "dashboardTileAttendance" },
    payments: counted(counts.overduePayments, "dashboardPaymentsSubtitle", "dashboardTilePayments"),
    orders: counted(counts.pendingOrders, "dashboardTileOrdersPending", "dashboardTileOrders"),
  };
}
