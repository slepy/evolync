/**
 * In-memory WatermelonDB adapter for Node tests: same schema and migrations
 * as the app, without IndexedDB persistence. Swapped in for
 * src/database/adapter by test/register.cjs.
 */
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import schema from "@/database/schema";
import migrations from "@/database/migrations";

export const adapter = new LokiJSAdapter({
  dbName: "evolync-test",
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: false,
  extraLokiOptions: { autosave: false },
});
