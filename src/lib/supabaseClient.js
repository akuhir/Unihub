import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ggntpwuljjlptwbfvllo.supabase.co'
const supabaseAnonKey = 'sb_publishable_Ejw5dCLiLhRppxc4Edz97Q_gBd_5ynN'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
