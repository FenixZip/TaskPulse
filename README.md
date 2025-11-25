npm run dev
python manage.py shell




creator@example.com
Test1234!

executor10@example.com


erDiagram
    USER {
        int id PK
        string email
        string password
        string first_name
        string last_name
        string role  "CREATOR/EXECUTOR"
        string timezone
        bool is_email_verified
        datetime date_joined
    }

    EMAIL_VERIFICATION_TOKEN {
        int id PK
        uuid token
        datetime created_at
        datetime used_at
        datetime expires_at
    }

    INVITATION {
        int id PK
        uuid token
        string email
        datetime created_at
        datetime accepted_at
    }

    TASK {
        int id PK
        string title
        text description
        string priority   "LOW/MEDIUM/HIGH"
        string status     "NEW/IN_PROGRESS/DONE"
        datetime due_at
        datetime created_at
        datetime updated_at
        datetime reminder_sent_at
    }

    TASK_ATTACHMENT {
        int id PK
        string file
        string kind  "INPUT/RESULT/OTHER"
        datetime created_at
    }

    TASK_CHANGE_LOG {
        int id PK
        string field
        string old_value
        string new_value
        string reason
        datetime changed_at
    }

    TASK_ACTION_LOG {
        int id PK
        string action_type
        string description
        datetime created_at
    }

    TASK_MESSAGE {
        int id PK
        text text
        string file
        datetime created_at
    }

    TELEGRAM_PROFILE {
        int id PK
        bigint chat_id
        string username
        string first_name
        string last_name
        datetime created_at
        datetime updated_at
    }

    TELEGRAM_UPDATE {
        int id PK
        bigint update_id  "unique"
        datetime created_at
    }

    TELEGRAM_LINK_TOKEN {
        int id PK
        uuid token
        bool is_used
        datetime created_at
    }

    USER ||--o{ EMAIL_VERIFICATION_TOKEN : "has many"
    USER ||--o{ INVITATION : "invited_by"
    USER ||--o{ TASK : "created_tasks"
    USER ||--o{ TASK : "assigned_tasks"
    USER ||--o{ TASK_MESSAGE : "sent_messages"
    USER ||--|| TELEGRAM_PROFILE : "has one"
    USER ||--o{ TELEGRAM_LINK_TOKEN : "link tokens"

    TASK ||--o{ TASK_ATTACHMENT : "attachments"
    TASK ||--o{ TASK_CHANGE_LOG : "changes"
    TASK ||--o{ TASK_ACTION_LOG : "actions"
    TASK ||--o{ TASK_MESSAGE : "messages"

    INVITATION }o--|| USER : "creator"
