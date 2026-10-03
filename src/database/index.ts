import { Database } from "@nozbe/watermelondb";

import { adapter } from "./adapter";
import AttendanceRecord from "./models/AttendanceRecord";
import Event from "./models/Event";
import EventParticipant from "./models/EventParticipant";
import GradingRank from "./models/GradingRank";
import Order from "./models/Order";
import OrderItem from "./models/OrderItem";
import Organization from "./models/Organization";
import OrganizationRole from "./models/OrganizationRole";
import PaymentCycle from "./models/PaymentCycle";
import PaymentRecord from "./models/PaymentRecord";
import Product from "./models/Product";
import ProductVariant from "./models/ProductVariant";
import School from "./models/School";
import SchoolInvite from "./models/SchoolInvite";
import SchoolJoinRequest from "./models/SchoolJoinRequest";
import SchoolMember from "./models/SchoolMember";
import SchoolSettings from "./models/SchoolSettings";
import TrainingSession from "./models/TrainingSession";
import BodyPosePreset from "./models/BodyPosePreset";
import Technique from "./models/Technique";
import Sequence from "./models/Sequence";
import SequenceStep from "./models/SequenceStep";
import TechniqueNoteDocument from "./models/TechniqueNoteDocument";
import TechniqueNoteRow from "./models/TechniqueNoteRow";
import Tag from "./models/Tag";
import Taggable from "./models/Taggable";
import Notification from "./models/Notification";
import Training from "./models/Training";
import TrainingSeries from "./models/TrainingSeries";
import TrainingInvitee from "./models/TrainingInvitee";

export const database = new Database({
  adapter,
  modelClasses: [
    AttendanceRecord,
    Event,
    EventParticipant,
    GradingRank,
    Order,
    OrderItem,
    Organization,
    OrganizationRole,
    PaymentCycle,
    PaymentRecord,
    Product,
    ProductVariant,
    School,
    SchoolInvite,
    SchoolJoinRequest,
    SchoolMember,
    SchoolSettings,
    TrainingSession,
    BodyPosePreset,
    Technique,
    Sequence,
    SequenceStep,
    TechniqueNoteDocument,
    TechniqueNoteRow,
    Tag,
    Taggable,
    Notification,
    Training,
    TrainingSeries,
    TrainingInvitee,
  ],
});

/**
 * Resets the local database by deleting all records from all tables.
 * This only affects the local WatermelonDB - server data is not touched.
 * After reset, call sync() to pull fresh data from the server.
 */
export const resetLocalDatabase = async (): Promise<void> => {
  console.log("[resetLocalDatabase] Starting local database reset...");

  // Use unsafeResetDatabase for a clean slate
  // This clears all data AND the sync metadata (lastPulledAt)
  // Must be called inside a Writer block
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });

  console.log("[resetLocalDatabase] Local database reset complete");
};

/**
 * Resets the local database except for the organizations table.
 * Preserves organization data while clearing all other tables.
 * This maintains the user's organization context while refreshing all other data.
 *
 * Uses unsafeResetDatabase() for a clean slate (clears all data, cache, and sync
 * metadata), then re-inserts the preserved organization records.
 *
 * After reset, call sync() to pull fresh data from the server.
 */
export const resetLocalDatabaseExceptOrganizations = async (): Promise<void> => {
  console.log("[resetLocalDatabase] Starting local database reset (preserving organizations)...");

  // Step 1: Read organization records into memory before reset
  const orgCollection = database.get<Organization>('organizations');
  const orgs = await orgCollection.query().fetch();
  const savedOrgs = orgs
    .filter(org => !org.deletedAt)
    .map(org => ({
      id: org.id,
      owner_id: org.ownerId,
      name: org.name,
      created_at: org.createdAt?.getTime() || Date.now(),
      updated_at: org.updatedAt?.getTime() || Date.now(),
    }));

  console.log(`[resetLocalDatabase] Saved ${savedOrgs.length} organization(s) before reset`);

  // Step 2: Full reset - clears all data, internal cache, and sync metadata
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });

  console.log("[resetLocalDatabase] Database fully reset");

  // Step 3: Re-insert preserved organizations
  if (savedOrgs.length > 0) {
    await database.write(async () => {
      const collection = database.get<Organization>('organizations');
      await database.batch(
        savedOrgs.map(org =>
          collection.prepareCreateFromDirtyRaw({
            id: org.id,
            owner_id: org.owner_id,
            name: org.name,
            created_at: org.created_at,
            updated_at: org.updated_at,
          })
        )
      );
    });
    console.log(`[resetLocalDatabase] Re-inserted ${savedOrgs.length} organization(s)`);
  }

  console.log("[resetLocalDatabase] Local database reset complete (organizations preserved)");
};
