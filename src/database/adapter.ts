import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import schema from "./schema";
import migrations from "./migrations";

export const adapter = new LokiJSAdapter({
  dbName: "evolync",
  schema,
  migrations,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error: Error) => {
    console.error("Database failed to load", error);
  },
});
