import { attendanceSchema } from "@/modules/attendance/database/schema";
import { authSchema } from "@/modules/auth/database/schema";
import { eventsSchema } from "@/modules/events/database/schema";
import { gradingSchema } from "@/modules/grading/database/schema";
import { homeSchema } from "@/modules/home/database/schema";
import { productSchema } from "@/modules/inventory/database/schema";
import { organizationSchema } from "@/modules/organization/database/schema";
import { schoolSchema } from "@/modules/school/database/schema";
import { settingsSchema } from "@/modules/settings/database/schema";
import { threedSchema } from "@/modules/threed/database/schema";
import { notesSchema } from "@/modules/techniques/notes/database/schema";
import { tagsSchema } from "@/modules/tags/database/schema";
import { appSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 17,
  tables: [
    ...attendanceSchema,
    ...authSchema,
    ...eventsSchema,
    ...gradingSchema,
    ...homeSchema,
    ...settingsSchema,
    ...organizationSchema,
    ...schoolSchema,
    ...productSchema,
    ...threedSchema,
    ...notesSchema,
    ...tagsSchema,
  ],
});
