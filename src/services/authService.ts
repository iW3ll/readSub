import { supabase, isSupabaseConfigured } from './supabase';
import { UserProfile } from '../types';

export interface AuthResponse {
  user: any | null;
  session?: any | null;
  profile: UserProfile | null;
  error?: string | null;
}

/**
 * Realiza o cadastro de um novo usuário com e-mail, senha e nome opcional.
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      profile: null,
      error: 'Supabase ainda não configurado. Por favor, adicione sua URL e ANON_KEY em src/services/supabase.ts.',
    };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || cleanEmail.split('@')[0];

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          name: displayName,
        },
      },
    });

    if (error) {
      return { user: null, session: null, profile: null, error: error.message };
    }

    if (!data.user) {
      return { user: null, session: null, profile: null, error: 'Não foi possível criar o usuário.' };
    }

    // Se temos uma sessão ativa, podemos atualizar o perfil diretamente caso necessário
    if (data.session && data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email,
          name: displayName,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        // Silencioso - trigger do PostgreSQL cuida da criação
      }
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      name: displayName,
      createdAt: data.user.created_at || new Date().toISOString(),
    };

    return { user: data.user, session: data.session, profile, error: null };
  } catch (err: any) {
    return {
      user: null,
      session: null,
      profile: null,
      error: err.message || 'Erro inesperado ao cadastrar.',
    };
  }
}

/**
 * Realiza o login com e-mail e senha.
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      profile: null,
      error: 'Supabase ainda não configurado. Por favor, adicione sua URL e ANON_KEY em src/services/supabase.ts.',
    };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      let friendlyError = error.message;
      if (error.message.toLowerCase().includes('email not confirmed')) {
        friendlyError = 'E-mail ainda não confirmado! Verifique sua caixa de entrada ou desative "Confirm email" no painel do Supabase.';
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        friendlyError = 'E-mail ou senha incorretos.';
      }
      return { user: null, session: null, profile: null, error: friendlyError };
    }

    if (!data.user) {
      return { user: null, session: null, profile: null, error: 'Credenciais inválidas.' };
    }

    const profile = await getUserProfile(data.user.id);

    return {
      user: data.user,
      session: data.session,
      profile: profile || {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
        createdAt: data.user.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    return { user: null, session: null, profile: null, error: err.message || 'Erro inesperado ao entrar.' };
  }
}

/**
 * Encerra a sessão do usuário.
 */
export async function signOut(): Promise<{ error?: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // Tenta deslogar localmente caso haja erro de rede
      await supabase.auth.signOut({ scope: 'local' });
    }
    return { error: error ? error.message : null };
  } catch (err: any) {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {}
    return { error: err?.message || 'Erro ao sair.' };
  }
}

/**
 * Retorna os dados do usuário autenticado no momento.
 */
export async function getCurrentUser(): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Obtém os dados de perfil da tabela `profiles`.
 */
export async function getUserProfile(userId?: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let targetId = userId;
    if (!targetId) {
      const user = await getCurrentUser();
      if (!user) return null;
      targetId = user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single();

    if (error || !data) {
      const user = await getCurrentUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email?.split('@')[0],
          createdAt: user.created_at,
        };
      }
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      avatarUrl: data.avatar_url,
    };
  } catch (error) {
    return null;
  }
}
