import {
  schemaMigrations,
  addColumns,
  createTable,
  unsafeExecuteSql,
} from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    {
      toVersion: 24,
      steps: [
        addColumns({
          table: "payment_cycles",
          columns: [{ name: "locked_at", type: "number", isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 23,
      steps: [
        addColumns({
          table: "events",
          columns: [{ name: "exams_planned", type: "boolean" }],
        }),
        addColumns({
          table: "event_participants",
          columns: [{ name: "takes_exam", type: "boolean" }],
        }),
        addColumns({
          table: "orders",
          columns: [{ name: "event_id", type: "string", isOptional: true, isIndexed: true }],
        }),
      ],
    },
    {
      toVersion: 22,
      steps: [
        createTable({
          name: "event_types",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "created_by", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "events",
          columns: [{ name: "type_id", type: "string", isOptional: true, isIndexed: true }],
        }),
      ],
    },
    {
      toVersion: 21,
      steps: [
        addColumns({
          table: "school_members",
          columns: [
            { name: "payment_amount", type: "number", isOptional: true },
            { name: "payment_currency", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 20,
      steps: [
        createTable({
          name: "trainings",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "school_id", type: "string", isOptional: true, isIndexed: true },
            { name: "series_id", type: "string", isOptional: true, isIndexed: true },
            { name: "name", type: "string" },
            { name: "date", type: "number", isIndexed: true },
            { name: "start_time", type: "string" },
            { name: "end_time", type: "string" },
            { name: "location", type: "string", isOptional: true },
            { name: "visibility", type: "string" },
            { name: "status", type: "string" },
            { name: "created_by", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "training_series",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "school_id", type: "string", isOptional: true, isIndexed: true },
            { name: "name", type: "string" },
            { name: "location", type: "string", isOptional: true },
            { name: "visibility", type: "string" },
            { name: "invitee_ids", type: "string" },
            { name: "start_date", type: "number" },
            { name: "end_date", type: "number" },
            { name: "rules", type: "string" },
            { name: "previous_series_id", type: "string", isOptional: true, isIndexed: true },
            { name: "created_by", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "training_invitees",
          columns: [
            { name: "training_id", type: "string", isIndexed: true },
            { name: "school_member_id", type: "string", isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 19,
      steps: [
        createTable({
          name: "notifications",
          columns: [
            { name: "recipient_id", type: "string", isIndexed: true },
            { name: "school_id", type: "string", isOptional: true },
            { name: "type", type: "string" },
            { name: "entity_type", type: "string" },
            { name: "entity_id", type: "string" },
            { name: "payload", type: "string" },
            { name: "read_at", type: "number", isOptional: true, isIndexed: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 18,
      steps: [
        addColumns({
          table: "school_join_requests",
          columns: [
            { name: "status", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: "school_invites",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "role_id", type: "string", isOptional: true },
            { name: "code", type: "string" },
            { name: "expires_at", type: "number" },
            { name: "created_by", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        createTable({
          name: "training_sessions",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "date", type: "number" },
            { name: "notes", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "attendance_records",
          columns: [
            { name: "training_session_id", type: "string", isIndexed: true },
            { name: "school_member_id", type: "string", isIndexed: true },
            { name: "status", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        createTable({
          name: "payment_cycles",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "period_start", type: "number" },
            { name: "period_end", type: "number" },
            { name: "notes", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "payment_records",
          columns: [
            { name: "payment_cycle_id", type: "string", isIndexed: true },
            { name: "school_member_id", type: "string", isIndexed: true },
            { name: "amount", type: "number" },
            { name: "currency", type: "string" },
            { name: "status", type: "string" },
            { name: "method", type: "string" },
            { name: "payment_date", type: "number", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
          name: "school_settings",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "default_currency", type: "string" },
            { name: "default_payment_amount", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 7,
      steps: [
        createTable({
          name: "events",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "school_id", type: "string", isOptional: true, isIndexed: true },
            { name: "name", type: "string" },
            { name: "short_note", type: "string", isOptional: true },
            { name: "address", type: "string", isOptional: true },
            { name: "start_date", type: "number" },
            { name: "end_date", type: "number" },
            { name: "price", type: "number" },
            { name: "currency", type: "string" },
            { name: "visibility", type: "string" },
            { name: "status", type: "string" },
            { name: "created_by", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "event_participants",
          columns: [
            { name: "event_id", type: "string", isIndexed: true },
            { name: "school_member_id", type: "string", isIndexed: true },
            { name: "status", type: "string" },
            { name: "status_changed_by", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        createTable({
          name: "organization_gradings",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "order", type: "number" },
            { name: "color", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        addColumns({
          table: "school_members",
          columns: [
            { name: "current_rank_id", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        createTable({
          name: "body_pose_presets",
          columns: [
            { name: "name", type: "string" },
            { name: "body_part_type", type: "string" },
            { name: "data", type: "string" },
            { name: "is_system", type: "boolean" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "techniques",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "body_part", type: "string" },
            { name: "data", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "sequences",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "cover_image_url", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "sequence_steps",
          columns: [
            { name: "sequence_id", type: "string", isIndexed: true },
            { name: "order_index", type: "number" },
            { name: "duration_ms", type: "number" },
            { name: "data", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "step_techniques",
          columns: [
            { name: "step_id", type: "string", isIndexed: true },
            { name: "technique_id", type: "string", isIndexed: true },
            { name: "model_slot", type: "number" },
            { name: "root_position", type: "string" },
            { name: "root_rotation", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: "school_members",
          columns: [
            { name: "avatar_url", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 11,
      steps: [
        addColumns({
          table: "body_pose_presets",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
          ],
        }),
      ],
    },
    {
      toVersion: 12,
      steps: [
        addColumns({
          table: "school_members",
          columns: [
            { name: "phone_number", type: "string", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 14,
      steps: [
        createTable({
          name: "technique_note_documents",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "title", type: "string" },
            { name: "description", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "technique_note_rows",
          columns: [
            { name: "document_id", type: "string", isIndexed: true },
            { name: "order_index", type: "number" },
            { name: "person_1_text", type: "string" },
            { name: "person_2_text", type: "string" },
            { name: "direction", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 15,
      steps: [
        createTable({
          name: "organization_roles",
          columns: [
            { name: "organization_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 16,
      steps: [
        createTable({
          name: "tags",
          columns: [
            { name: "user_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "color", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "taggables",
          columns: [
            { name: "tag_id", type: "string", isIndexed: true },
            { name: "taggable_id", type: "string", isIndexed: true },
            { name: "taggable_type", type: "string" },
            { name: "created_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 17,
      steps: [
        createTable({
          name: "product_variants",
          columns: [
            { name: "product_id", type: "string", isIndexed: true },
            { name: "name", type: "string" },
            { name: "price", type: "number" },
            { name: "currency", type: "string" },
            { name: "stock_quantity", type: "number" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "orders",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "school_member_id", type: "string", isIndexed: true },
            { name: "status", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        createTable({
          name: "order_items",
          columns: [
            { name: "order_id", type: "string", isIndexed: true },
            { name: "product_variant_id", type: "string", isIndexed: true },
            { name: "quantity", type: "number" },
            { name: "unit_price", type: "number" },
            { name: "currency", type: "string" },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
        unsafeExecuteSql("DELETE FROM taggables;"),
      ],
    },
    {
      toVersion: 13,
      steps: [
        createTable({
          name: "school_join_requests",
          columns: [
            { name: "school_id", type: "string", isIndexed: true },
            { name: "user_id", type: "string", isIndexed: true },
            { name: "display_name", type: "string" },
            { name: "email", type: "string" },
            { name: "phone_number", type: "string", isOptional: true },
            { name: "created_at", type: "number" },
            { name: "updated_at", type: "number" },
            { name: "deleted_at", type: "number", isOptional: true },
          ],
        }),
      ],
    },
  ],
});
