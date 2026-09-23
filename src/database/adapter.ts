import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import schema from "./schema";
import migrations from "./migrations";

export const adapter = new LokiJSAdapter({
  dbName: "evolync",
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  // Destructive reset on schema mismatch (dev only)
  onVersionChange: () => {},
  onSetUpError: (error: Error) => {
    console.error("Database failed to load", error);
  },
});
