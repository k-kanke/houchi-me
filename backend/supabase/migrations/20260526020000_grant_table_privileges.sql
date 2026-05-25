-- authenticated ロール（ユーザー JWT）が必要なテーブルへのアクセス権
grant select, insert, update, delete on public.clone_activities        to authenticated;
grant select, insert, update, delete on public.notes                   to authenticated;
grant select, insert, update, delete on public.clone_encounters        to authenticated;
grant select                          on public.daily_questions         to authenticated;
grant select, insert, update, delete on public.daily_question_answers  to authenticated;
grant select                          on public.encounter_logs          to authenticated;

-- service_role（サーバーサイド API）が必要なテーブルへのアクセス権
grant select, insert, update, delete on public.encounter_logs          to service_role;
