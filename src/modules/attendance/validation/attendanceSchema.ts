import { z } from "zod";

/**
 * Validation schema for creating a training session
 */
export const createTrainingSessionSchema = z.object({
  date: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      "attendanceValidationInvalidDate"
    ),
  notes: z.string().max(500, "attendanceValidationNotesTooLong").optional(),
});

export type CreateTrainingSessionFormValues = z.infer<
  typeof createTrainingSessionSchema
>;

/**
 * Validation schema for attendance status
 */
export const attendanceStatusSchema = z.enum(["present", "absent", "excused"], {
  errorMap: () => ({ message: "attendanceValidationInvalidStatus" }),
});

export type AttendanceStatusFormValue = z.infer<typeof attendanceStatusSchema>;
