import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { schoolTileSubtitles } from "@/modules/dashboard/hooks/schoolTileSubtitles";

describe("schoolTileSubtitles", () => {
  it("shows the tile descriptions when nothing needs attention", () => {
    assert.deepEqual(
      schoolTileSubtitles({ pendingOrders: 0, pendingJoinRequests: 0, overduePayments: 0 }),
      {
        students: { key: "dashboardTileStudents" },
        attendance: { key: "dashboardTileAttendance" },
        payments: { key: "dashboardTilePayments" },
        orders: { key: "dashboardTileOrders" },
      },
    );
  });

  it("shows the counts when there are pending requests, overdue payments or orders", () => {
    assert.deepEqual(
      schoolTileSubtitles({ pendingOrders: 3, pendingJoinRequests: 2, overduePayments: 1 }),
      {
        students: { key: "dashboardStudentsSubtitle", count: 2 },
        attendance: { key: "dashboardTileAttendance" },
        payments: { key: "dashboardPaymentsSubtitle", count: 1 },
        orders: { key: "dashboardTileOrdersPending", count: 3 },
      },
    );
  });
});
