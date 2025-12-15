
import { createClient } from '@supabase/supabase-js';

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          material_type: string | null;
          certifications: string[] | null;
          sustainability_data: any | null;
          supplier_id: string;
          created_at: string;
          // ... other fields
        }
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          // ...
        }
      }
    }
  }
}
