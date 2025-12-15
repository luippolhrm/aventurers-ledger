# Dungeons and Dragons calculator

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/luis-ramos-projects-256cd31a/v0-dungeons-and-dragons-calculator)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/noRk8GDksbm)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/luis-ramos-projects-256cd31a/v0-dungeons-and-dragons-calculator](https://vercel.com/luis-ramos-projects-256cd31a/v0-dungeons-and-dragons-calculator)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/noRk8GDksbm](https://v0.app/chat/noRk8GDksbm)**

## Environment Variables

This project requires Supabase configuration. Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your [Supabase project settings](https://app.supabase.com).

**For Vercel/Production Deployment:**
Add these environment variables in your Vercel project settings under "Environment Variables".

## Local Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```
3. Create `.env.local` with your Supabase credentials (see above)
4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
