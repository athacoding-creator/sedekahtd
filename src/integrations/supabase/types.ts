export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_payment_methods: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          payment_method_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          payment_method_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_payment_methods_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_payment_methods_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_visits: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          deskripsi: string
          fb_pixel_id: string | null
          gambar_url: string | null
          harga_paket: number | null
          id: string
          is_pilihan: boolean
          jenis_campaign: string
          judul: string
          kategori: string | null
          nama_paket: string | null
          qris_id: string | null
          target: number
          terkumpul: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi: string
          fb_pixel_id?: string | null
          gambar_url?: string | null
          harga_paket?: number | null
          id?: string
          is_pilihan?: boolean
          jenis_campaign?: string
          judul: string
          kategori?: string | null
          nama_paket?: string | null
          qris_id?: string | null
          target?: number
          terkumpul?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string
          fb_pixel_id?: string | null
          gambar_url?: string | null
          harga_paket?: number | null
          id?: string
          is_pilihan?: boolean
          jenis_campaign?: string
          judul?: string
          kategori?: string | null
          nama_paket?: string | null
          qris_id?: string | null
          target?: number
          terkumpul?: number
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          bukti_transfer: string | null
          campaign_id: string | null
          created_at: string
          id: string
          metode_pembayaran: string
          nama: string
          no_whatsapp: string | null
          nominal: number
          pesan: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          bukti_transfer?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          metode_pembayaran: string
          nama: string
          no_whatsapp?: string | null
          nominal: number
          pesan?: string | null
          status?: string
          verified_at?: string | null
        }
        Update: {
          bukti_transfer?: string | null
          campaign_id?: string | null
          created_at?: string
          id?: string
          metode_pembayaran?: string
          nama?: string
          no_whatsapp?: string | null
          nominal?: number
          pesan?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      heroes: {
        Row: {
          aktif: boolean
          created_at: string
          gambar_url: string
          id: string
          judul: string
          link_url: string | null
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          gambar_url: string
          id?: string
          judul: string
          link_url?: string | null
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          gambar_url?: string
          id?: string
          judul?: string
          link_url?: string | null
          urutan?: number
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          aktif: boolean
          created_at: string
          deskripsi: string | null
          gambar_url: string | null
          id: string
          nama: string
          nama_pemilik: string | null
          nomor_rekening: string | null
          tipe: string
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          gambar_url?: string | null
          id?: string
          nama: string
          nama_pemilik?: string | null
          nomor_rekening?: string | null
          tipe?: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          gambar_url?: string | null
          id?: string
          nama?: string
          nama_pemilik?: string | null
          nomor_rekening?: string | null
          tipe?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: []
      }
      qris_list: {
        Row: {
          aktif: boolean
          created_at: string
          deskripsi: string | null
          gambar_url: string
          id: string
          nama: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          gambar_url: string
          id?: string
          nama: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          deskripsi?: string | null
          gambar_url?: string
          id?: string
          nama?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_donations: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string | null
          nama: string | null
          nominal: number | null
          pesan: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string | null
          nama?: string | null
          nominal?: number | null
          pesan?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string | null
          nama?: string | null
          nominal?: number | null
          pesan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      sync_campaign_terkumpul: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
