# TaskPulse API Endpoints Diagram


```mermaid
flowchart TB
  subgraph Auth [/Auth – /api/auth/]
    A1[POST /register/]:::post
    A2[POST /login/]:::post
    A3[POST /logout/]:::post
    A4[GET /profile/]:::get
    A5[PATCH /profile/]:::patch
    A6[POST /change-password/]:::post
    A7[POST /verify-email/]:::post
    A8[POST /resend-verification/]:::post
    A9[POST /password-reset/]:::post
    A10[POST /password-reset-confirm/]:::post
    A11[GET /invitations/]:::get
    A12[POST /invitations/]:::post
    A13[POST /accept-invite/]:::post
    A14[GET /executors/]:::get
  end

  subgraph Tasks [/Tasks – /api/tasks/]
    T1[GET /]:::get
    T2[POST /]:::post
    T3[GET /{id}/]:::get
    T4[PUT/PATCH /{id}/]:::patch
    T5[DELETE /{id}/]:::delete
    T6[POST /{id}/attachments/]:::post
    T7[POST /{id}/confirm-on-time/]:::post
    T8[POST /{id}/extend-1d/]:::post
  end

  subgraph Conversation [/Conversation – /api/tasks/conversation-messages/]
    C1[GET /?user_id=…]:::get
    C2[POST /]:::post
  end

  subgraph Cabinet [/Cabinet – /api/cabinet/*]
    CB1[GET /creator-tasks/]:::get
    CB2[GET /executor-tasks/]:::get
    CB3[GET /executor-tasks/{id}/]:::get
    CB4[GET /stats-by-assignee/]:::get
  end

  subgraph Reports [/Reports – /api/reports/]
    R1[GET /monthly/?month=&user=&format=]:::get
  end

  subgraph Integrations [/Integrations – /api/integrations/telegram/]
    I1[GET /profile/]:::get
    I2[POST /profile/]:::post
    I3[PATCH /profile/]:::patch
  end

  subgraph TelegramWebhook [/Telegram – /api/telegram/]
    W1[POST /webhook/]:::post
  end

  classDef get fill:#e0f7fa,stroke:#006064,stroke-width:1px;
  classDef post fill:#e8f5e9,stroke:#1b5e20,stroke-width:1px;
  classDef patch fill:#fff8e1,stroke:#ff6f00,stroke-width:1px;
  classDef delete fill:#ffebee,stroke:#b71c1c,stroke-width:1px;
```
