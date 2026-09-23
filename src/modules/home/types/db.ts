import { Database } from '@/database/supabase';

type PublicSchema = Database['public'];

export type DbTables = PublicSchema['Tables'];

// Export specific table types for this module here
// export type Post = DbTables['posts']['Row'];
