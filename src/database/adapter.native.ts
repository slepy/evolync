import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import schema from "./schema";
import migrations from "./migrations";

export const adapter = new SQLiteAdapter({
  dbName: "evolync",
  schema,
  migrations,
  jsi: false, // Disabled for Expo Go compatibility - enable for production builds
  onSetUpError: (error: Error) => {
    console.error("Database failed to load", error);
  },
});
