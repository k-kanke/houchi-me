create policy "owner insert" on users
  for insert with check (auth.uid() = id);
