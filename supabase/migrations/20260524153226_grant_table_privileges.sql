-- authenticated ロール（ログイン済みユーザー）への権限付与
grant select, insert, update on users to authenticated;
grant select, insert, update on experiences to authenticated;
grant select, insert on reservations to authenticated;
grant select, insert on experience_logs to authenticated;
grant select, insert, update on curiosity_map_items to authenticated;
grant select, insert on point_transactions to authenticated;

-- anon ロール（���ログイン）への読み取り権限
grant select on experiences to anon;
grant select on experience_logs to anon;
