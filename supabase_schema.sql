-- ==============================================================================
-- READSUB — SCHEMA COMPLETO PARA O SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Como usar:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. Vá em "SQL Editor" no menu lateral esquerdo
-- 3. Cole todo este código e clique em "Run" (Executar)
-- ==============================================================================

-- 1. Tabela de Perfis de Usuários (vinculada à auth.users do Supabase)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Row Level Security (RLS) para profiles
alter table public.profiles enable row level security;

create policy "Usuários podem ver seu próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. Trigger automática: cria um perfil em public.profiles quando uma nova conta é criada
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Remove a trigger anterior se já existir
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Tabela de Flashcards / Vocabulário Salvo
-- ------------------------------------------------------------------------------
create table if not exists public.flashcards (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  word text not null,
  clean_word text not null,
  translation text not null,
  phonetic text,
  part_of_speech text,
  definition text,
  example_sentence text,
  context_sentence text not null,
  subtitle_title text not null,
  timestamp_ms bigint,
  mastered boolean default false not null,
  review_count integer default 0 not null,
  date_added bigint not null,
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para consultas rápidas
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_clean_word on public.flashcards(clean_word);
create index if not exists idx_flashcards_mastered on public.flashcards(mastered);

-- Habilitar RLS em flashcards
alter table public.flashcards enable row level security;

create policy "Usuários podem visualizar apenas seus próprios flashcards"
  on public.flashcards for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios flashcards"
  on public.flashcards for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios flashcards"
  on public.flashcards for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios flashcards"
  on public.flashcards for delete
  using (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Tabela de Sessões e Progresso de Estudo
-- ------------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cards_reviewed integer default 0 not null,
  cards_mastered integer default 0 not null,
  duration_seconds integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices para histórico de estudo
create index if not exists idx_study_sessions_user_id on public.study_sessions(user_id);
create index if not exists idx_study_sessions_created_at on public.study_sessions(created_at);

-- Habilitar RLS em study_sessions
alter table public.study_sessions enable row level security;

create policy "Usuários podem ver suas próprias sessões"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Usuários podem registrar suas próprias sessões"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);
