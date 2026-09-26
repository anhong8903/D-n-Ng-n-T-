import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nkwicbjauuvefrrnfgwu.supabase.co'
const supabaseKey = 'sb_publishable_pVQf_un0-ZIm6c-4Xay0rw_qOcaXeov'

export const supabase = createClient(supabaseUrl, supabaseKey)
