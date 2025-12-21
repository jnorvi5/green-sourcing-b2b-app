# Deployment Instructions

## Vercel Deployment

1.  **Install Vercel CLI**:

    ```bash
    npm i -g vercel
    ```

2.  **Deploy**:
    Run the deploy script from the `sda-connector` directory:
    ```bash
    npm run deploy
    ```
    Or manually:
    ```bash
    vercel deploy --prod
    ```

## Local Development

1.  **Install Dependencies**:

    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy `.env.example` to `.env` and fill in your Supabase credentials.

3.  **Run Server**:
    ```bash
    npm run dev
    ```

## Database Setup

Run the `setup_db.sql` script in your Supabase SQL Editor to create the necessary API key for testing.
