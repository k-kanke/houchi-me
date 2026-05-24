# Database Schema

## Tables

| Table | Description |
| ----- | ----------- |
| [users](users.md) | ユーザー情報（ポイント・称号） |
| [experiences](experiences.md) | 体験会 |
| [reservations](reservations.md) | ���約（status: reserved / joined / cancelled） |
| [experience_logs](experience_logs.md) | 参加後ログ |
| [curiosity_map_items](curiosity_map_items.md) | 好奇心マップ（ユーザー × カテゴリ） |
| [point_transactions](point_transactions.md) | ポイント履歴 |

## Relations

```mermaid
erDiagram

users ||--o{ experiences : "creator_id"
users ||--o{ reservations : "user_id"
users ||--o{ experience_logs : "user_id"
users ||--o{ curiosity_map_items : "user_id"
users ||--o{ point_transactions : "user_id"
experiences ||--o{ reservations : "experience_id"
experiences ||--o{ experience_logs : "experience_id"
```
