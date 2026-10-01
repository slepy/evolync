import { attendanceSchema } from "@/modules/attendance/database/schema";
import { authSchema } from "@/modules/auth/database/schema";
import { eventsSchema } from "@/modules/events/database/schema";
import { gradingSchema } from "@/modules/grading/database/schema";
import { productSchema } from "@/modules/inventory/database/schema";
import { organizationSchema } from "@/modules/organization/database/schema";
import { ordersSchema } from "@/modules/orders/database/schema";
import { paymentsSchema } from "@/modules/payments/database/schema";
import { schoolSchema } from "@/modules/school/database/schema";
import { threedSchema } from "@/modules/threed/database/schema";
import { notesSchema } from "@/modules/techniques/notes/database/schema";
import { tagsSchema } from "@/modules/tags/database/schema";
import { notificationsSchema } from "@/modules/notifications/database/schema";
import { appSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 19,
  tables: [
    ...attendanceSchema,
    ...authSchema,
    ...eventsSchema,
    ...gradingSchema,
    ...organizationSchema,
    ...ordersSchema,
    ...paymentsSchema,
    ...schoolSchema,
    ...productSchema,
    ...threedSchema,
    ...notesSchema,
    ...tagsSchema,
    ...notificationsSchema,
  ],
});
