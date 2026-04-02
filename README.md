Gemini said
EcoSpark-Hub Server
This is the backend service for EcoSpark-Hub, a platform dedicated to eco-friendly innovations and community sustainability. It provides a robust API for managing community ideas, handling secure authentication, and processing payments for sustainability initiatives.

## 🚀 Live Links
```text
Server API: [https://eco-spark-hub-server-wine.vercel.app]

Client Application: [https://ecospark-hub-client.vercel.app]
```
## ✨ Features
Secure Authentication: Powered by Better-Auth for seamless and secure user sessions.
Database Management: Type-safe database queries using Prisma ORM with a PostgreSQL adapter.
Payment Processing: Integrated Stripe for handling transactions and subscriptions, including webhook support.
Media Handling: Image uploads managed via Multer and stored securely on Cloudinary.
Communication: Email notifications and alerts implemented with Nnodemailer.
PDF Generation: Automated document and report creation using PDFKit.
Data Validation: Strict schema validation using Zod to ensure API integrity.

## 🛠 Technologies Used
* Runtime: Node.js (v20+)
Framework: Express.js (v5)
Language: TypeScript
Database: PostgreSQL & Prisma ORM
Authentication: Better-Auth & JSON Web Tokens (JWT)
Payments: Stripe API
Storage: Cloudinary
Bundler: tsup

## ⚙️ Setup Instructions
Follow these steps to set up the project locally:
```text
1. Clone the repository:
Bash
git clone https://github.com/your-username/EcoSpark-Hub-Server.git
cd EcoSpark-Hub-Server
```

## 2. Install dependencies:
```text
Bash
pnpm install
```
## 3. Environment Configuration:
```text
Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```
```text
Database (PostgreSQL)
DATABASE_URL="your_postgresql_connection_string"
```
```text
Better-Auth Configuration
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:5000
```
```
JWT Secrets
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
```
```text
Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google
```
```text
Email Service (Nodemailer)
EMAIL_SENDER_SMTP_USER=your_email@example.com
EMAIL_SENDER_SMTP_PASS=your_app_password
EMAIL_SENDER_SMTP_HOST=smtp.gmail.com
EMAIL_SENDER_SMTP_PORT=587
EMAIL_SENDER_SMTP_FROM=noreply@ecosparkhub.com
```
```text
Payments (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```
```text
Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

# Add other necessary keys for Better-Auth, Nodemailer, etc.

## 4. Database Migration:
```text
Bash
pnpm run migrate
```
## 5. Start the development server:
```text
Bash
pnpm run dev
```
## 📜 Available Scripts
```
pnpm run dev: Starts the server in development mode with tsx watch.
pnpm run build: Compiles the TypeScript code to optimized ESM for production.
pnpm run start: Runs the compiled production build.
pnpm run studio: Opens the Prisma Studio GUI to interact with your data.
pnpm run stripe:webhook: Listens for local Stripe webhook events.
```
