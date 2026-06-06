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
      cash_entries: {
        Row: {
          amount: number
          client_name: string
          concept: string | null
          created_at: string
          date: string
          id: number
          order_id: number | null
          user_id: string
        }
        Insert: {
          amount?: number
          client_name?: string
          concept?: string | null
          created_at?: string
          date?: string
          id?: number
          order_id?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          client_name?: string
          concept?: string | null
          created_at?: string
          date?: string
          id?: number
          order_id?: number | null
          user_id?: string
        }
        Relationships: []
      }
      course_students: {
        Row: {
          apellido: string
          created_at: string
          created_by: string | null
          curso: string
          estado_pago: string
          fecha_registro: string
          id: string
          monto_abonado: number
          nombre: string
          telefono: string
          updated_at: string
        }
        Insert: {
          apellido?: string
          created_at?: string
          created_by?: string | null
          curso?: string
          estado_pago?: string
          fecha_registro?: string
          id?: string
          monto_abonado?: number
          nombre: string
          telefono?: string
          updated_at?: string
        }
        Update: {
          apellido?: string
          created_at?: string
          created_by?: string | null
          curso?: string
          estado_pago?: string
          fecha_registro?: string
          id?: string
          monto_abonado?: number
          nombre?: string
          telefono?: string
          updated_at?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          alt_phone: string | null
          brand: string
          budget: number
          client_name: string
          created_at: string
          date_estimated: string | null
          date_in: string
          deposit: number
          has_humidity: boolean
          id: number
          images: string[] | null
          internal_notes: string | null
          model: string
          order_number: number
          phone: string | null
          problem: string
          security_pattern: number[] | null
          security_text: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
          user_id: string
          warranty: number
        }
        Insert: {
          alt_phone?: string | null
          brand: string
          budget?: number
          client_name: string
          created_at?: string
          date_estimated?: string | null
          date_in?: string
          deposit?: number
          has_humidity?: boolean
          id?: number
          images?: string[] | null
          internal_notes?: string | null
          model: string
          order_number: number
          phone?: string | null
          problem?: string
          security_pattern?: number[] | null
          security_text?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          user_id: string
          warranty?: number
        }
        Update: {
          alt_phone?: string | null
          brand?: string
          budget?: number
          client_name?: string
          created_at?: string
          date_estimated?: string | null
          date_in?: string
          deposit?: number
          has_humidity?: boolean
          id?: number
          images?: string[] | null
          internal_notes?: string | null
          model?: string
          order_number?: number
          phone?: string | null
          problem?: string
          security_pattern?: number[] | null
          security_text?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          user_id?: string
          warranty?: number
        }
        Relationships: []
      }
      general_products: {
        Row: {
          category: string
          cost_price: number
          created_at: string
          id: string
          product_name: string
          sale_price: number
          stock: number
          updated_at: string
          user_id: string
          warranty_days: number
        }
        Insert: {
          category?: string
          cost_price?: number
          created_at?: string
          id?: string
          product_name?: string
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id: string
          warranty_days?: number
        }
        Update: {
          category?: string
          cost_price?: number
          created_at?: string
          id?: string
          product_name?: string
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id?: string
          warranty_days?: number
        }
        Relationships: []
      }
      modules_inventory: {
        Row: {
          brand: string
          color: string
          cost_price: number
          created_at: string
          id: string
          model: string
          quality: string
          sale_price: number
          stock: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string
          color?: string
          cost_price?: number
          created_at?: string
          id?: string
          model?: string
          quality?: string
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          color?: string
          cost_price?: number
          created_at?: string
          id?: string
          model?: string
          quality?: string
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_hours: string | null
          business_name: string
          city: string | null
          created_at: string
          email: string | null
          fecha_inicio_plan: string | null
          fecha_vencimiento_plan: string | null
          id: string
          license_status: Database["public"]["Enums"]["license_status"]
          logo_url: string | null
          plan_activo: string | null
          trial_ends_at: string
          updated_at: string
          user_id: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          business_hours?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          email?: string | null
          fecha_inicio_plan?: string | null
          fecha_vencimiento_plan?: string | null
          id?: string
          license_status?: Database["public"]["Enums"]["license_status"]
          logo_url?: string | null
          plan_activo?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          business_hours?: string | null
          business_name?: string
          city?: string | null
          created_at?: string
          email?: string | null
          fecha_inicio_plan?: string | null
          fecha_vencimiento_plan?: string | null
          id?: string
          license_status?: Database["public"]["Enums"]["license_status"]
          logo_url?: string | null
          plan_activo?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      sales_history: {
        Row: {
          created_at: string
          customer_name: string
          id: string
          items_sold: Json
          total_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string
          id?: string
          items_sold?: Json
          total_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string
          id?: string
          items_sold?: Json
          total_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_plan: {
        Args: { _months: number; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_order_number: { Args: { _user_id: string }; Returns: number }
      renew_license: {
        Args: { _months: number; _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      equipment_status:
        | "Pendiente"
        | "En Reparación"
        | "Esperando Repuesto"
        | "Listo"
        | "Entregado"
      license_status: "trial" | "active" | "inactive"
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
      equipment_status: [
        "Pendiente",
        "En Reparación",
        "Esperando Repuesto",
        "Listo",
        "Entregado",
      ],
      license_status: ["trial", "active", "inactive"],
    },
  },
} as const
