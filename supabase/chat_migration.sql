-- =============================================
-- MyJob — Chat Migration
-- Run this in the Supabase SQL Editor
-- =============================================

-- =============================================
-- CONVERSATIONS
-- =============================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references shifts(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade not null,
  worker_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(shift_id, client_id, worker_id)
);

alter table conversations enable row level security;

create policy "Participants can view their conversations"
  on conversations for select
  to authenticated
  using (auth.uid() = client_id or auth.uid() = worker_id);

create policy "Participants can create conversations"
  on conversations for insert
  to authenticated
  with check (auth.uid() = client_id or auth.uid() = worker_id);

-- =============================================
-- MESSAGES
-- =============================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

create policy "Participants can view messages"
  on messages for select
  to authenticated
  using (
    conversation_id in (
      select id from conversations
      where client_id = auth.uid() or worker_id = auth.uid()
    )
  );

create policy "Participants can send messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and conversation_id in (
      select id from conversations
      where client_id = auth.uid() or worker_id = auth.uid()
    )
  );

create policy "Participants can mark messages as read"
  on messages for update
  to authenticated
  using (
    conversation_id in (
      select id from conversations
      where client_id = auth.uid() or worker_id = auth.uid()
    )
  );

-- =============================================
-- INDEXES
-- =============================================
create index if not exists idx_conversations_client_id on conversations(client_id);
create index if not exists idx_conversations_worker_id on conversations(worker_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at);

-- =============================================
-- REALTIME
-- Enable realtime for the messages table so
-- clients can subscribe to new messages
-- =============================================
alter publication supabase_realtime add table messages;
