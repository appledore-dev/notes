# AI Text Editor

[[Live Demo](https://ai-text-editor-mgilangjanuar.helpedby.ai/)]

A simple AI text editor that allows users to edit and improve their text using AI. The application is built with Rust for the backend and Next.js for the frontend.

### Features

- [x] Rich text editor
- [x] Refine text using Google Generative AI (rephrase, simplify, translate, etc.)
- [x] User authentication
- [x] Data persistence using PostgreSQL
- [x] Create, read, update, and delete documents
- [x] Dark mode support

![screenshot](/aite-ss.png)

### Requirements

- Rust 1.83.0 or later
- Node.js 22.11.0 or later

### Framework and Libraries

- [tokio](https://github.com/tokio-rs/tokio) - Asynchronous runtime for Rust
- [axum](https://github.com/tokio-rs/axum) - Web framework for Rust
- [sqlx](https://github.com/launchbadge/sqlx) - Async SQL toolkit for Rust
- [Next.js](https://nextjs.org) - React framework for frontend
- [bun](https://bun.sh) - JavaScript runtime for frontend

### Environment Variables

1. Create a `.env` file in the `api` directory.

    | Key | Description | Required |
    | --- | ----------- | --------- |
    | SECRET | Secret key for JWT signing | Yes |
    | DATABASE_URL | PostgreSQL connection string | Yes |
    | GOOGLE_GENERATIVE_AI_API_KEY | Google Generative AI API key | Yes |
    | EMAIL_HOST | SMTP host for sending emails | Yes |
    | EMAIL_PORT | SMTP port for sending emails | No |
    | EMAIL_USER | SMTP user for sending emails | Yes |
    | EMAIL_PASS | SMTP password for sending emails | Yes |
    | EMAIL_FROM | From address for sending emails | Yes |

2. Create a `.env` file in the `web` directory.

    | Key | Description | Required |
    | --- | ----------- | --------- |
    | NEXT_PUBLIC_API_URL | URL for the API server | Yes |

### Build and Run

1. Clone the repository

    ```bash
    git clone git@github.com:hatchways-community/senior-full-stack-engineer-ai-work-sample-a8f597bb35ef46998c617b1f2bfc4981.git
    ```

2. Build the API

    ```bash
    cd api && \
    cargo build --release
    ```

3. Create and migrate the database

    ```bash
    # cargo install sqlx-cli && \
    sqlx database create && \
    sqlx migrate run
    ```

4. Run the API

    ```bash
    cargo run --release
    ```

    By default, the API will run on `http://localhost:4002`


5. Build & run the frontend

    ```bash
    cd web && \
    bun install && \
    bun run build && \
    bun .next/standalone/server.js
    ```

    Open your browser and navigate to `http://localhost:3000`
