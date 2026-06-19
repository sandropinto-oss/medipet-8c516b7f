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
      bookings: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          especialista_id: string
          id: string
          observacoes: string | null
          pet_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tutor_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          especialista_id: string
          id?: string
          observacoes?: string | null
          pet_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tutor_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          especialista_id?: string
          id?: string
          observacoes?: string | null
          pet_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_especialista_id_fkey"
            columns: ["especialista_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          crmv: string | null
          documentos: Json
          email: string | null
          especialidades: string[]
          id: string
          instituicao: string | null
          latitude: number | null
          longitude: number | null
          matricula: string | null
          nome_completo: string
          preco_diaria: number | null
          tipo_utilizador: Database["public"]["Enums"]["user_type"]
          uf: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          crmv?: string | null
          documentos?: Json
          email?: string | null
          especialidades?: string[]
          id: string
          instituicao?: string | null
          latitude?: number | null
          longitude?: number | null
          matricula?: string | null
          nome_completo?: string
          preco_diaria?: number | null
          tipo_utilizador?: Database["public"]["Enums"]["user_type"]
          uf?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          crmv?: string | null
          documentos?: Json
          email?: string | null
          especialidades?: string[]
          id?: string
          instituicao?: string | null
          latitude?: number | null
          longitude?: number | null
          matricula?: string | null
          nome_completo?: string
          preco_diaria?: number | null
          tipo_utilizador?: Database["public"]["Enums"]["user_type"]
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pets: {
        Row: {
          alergias: string[]
          created_at: string
          especie: string | null
          foto_url: string | null
          id: string
          idade: number | null
          nome: string
          patologia_cronica: string | null
          peso: number | null
          raca: string | null
          tutor_id: string
          updated_at: string
        }
        Insert: {
          alergias?: string[]
          created_at?: string
          especie?: string | null
          foto_url?: string | null
          id?: string
          idade?: number | null
          nome: string
          patologia_cronica?: string | null
          peso?: number | null
          raca?: string | null
          tutor_id: string
          updated_at?: string
        }
        Update: {
          alergias?: string[]
          created_at?: string
          especie?: string | null
          foto_url?: string | null
          id?: string
          idade?: number | null
          nome?: string
          patologia_cronica?: string | null
          peso?: number | null
          raca?: string | null
          tutor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_especialistas_publicos: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          especialidades: string[]
          id: string
          latitude: number
          longitude: number
          nome_completo: string
          preco_diaria: number
        }[]
      }
      get_perfil_publico: {
        Args: { _id: string }
        Returns: {
          avatar_url: string
          id: string
          nome_completo: string
        }[]
      }
      get_reserva_ativa_tutor: {
        Args: never
        Returns: {
          booking_id: string
          data_fim: string
          data_inicio: string
          especialista_avatar: string
          especialista_id: string
          especialista_latitude: number
          especialista_longitude: number
          especialista_nome: string
          status: string
        }[]
      }
    }
    Enums: {
      booking_status:
        | "pendente"
        | "confirmada"
        | "em_andamento"
        | "concluida"
        | "cancelada"
      user_type: "tutor" | "especialista"
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
      booking_status: [
        "pendente",
        "confirmada",
        "em_andamento",
        "concluida",
        "cancelada",
      ],
      user_type: ["tutor", "especialista"],
    },
  },
} as const
