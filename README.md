# Telegram Account Integration

A premium web application for integrating Telegram accounts with QR code and SMS authentication flows.

## Features

- 🔐 **Dual Authentication**: QR code (recommended) and SMS/phone number login
- 📊 **Account Dashboard**: Beautiful card-based UI with real-time status
- 🎨 **Premium Design**: Dark mode, glassmorphism, vibrant gradients
- ⚡ **Real-time Updates**: Polling for QR scans and session health
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 🔄 **Session Management**: Validate, refresh, and disconnect accounts

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, CSS Modules
- **Animations**: Framer Motion
- **Notifications**: react-hot-toast
- **QR Codes**: qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
telegram-integration/
├── app/
│   ├── api/accounts/      # Backend API routes
│   ├── globals.css        # Design system
│   ├── layout.js          # Root layout
│   └── page.js            # Main dashboard
├── components/            # React components
├── lib/                   # Utilities & mock data
└── package.json
```

## Authentication Flows

### QR Code Login (Recommended)

1. Click "Add Telegram Account"
2. Select QR Code tab
3. Scan with Telegram app
4. Account connects automatically

### SMS Login

1. Enter phone number (E.164 format)
2. Receive verification code
3. Enter code
4. Handle 2FA if required

## Development

The app currently uses mock data for demonstration. To connect to real backend:

1. Replace `lib/mockTelethon.js` with real Telethon integration
2. Replace `lib/database.js` with PostgreSQL connection
3. Add environment variables for API keys
4. Implement R2 storage for sessions

## Mock Data

For testing, use:
- Phone: Any number starting with `+`
- SMS Code: `12345`
- 2FA: Any password

## Design System

- **Colors**: Purple/blue gradients, pink/orange accents
- **Typography**: Inter font family
- **Effects**: Glassmorphism, smooth animations
- **Components**: Reusable buttons, badges, inputs

## API Endpoints

- `POST /api/accounts/qr-login/initiate` - Start QR flow
- `GET /api/accounts/qr-login/status/:jobId` - Poll QR status
- `POST /api/accounts/sms-login/request-code` - Send SMS code
- `POST /api/accounts/sms-login/verify-code` - Verify SMS
- `GET /api/accounts/list` - List all accounts
- `DELETE /api/accounts/:id` - Remove account

## Production Deployment

1. Build the app: `npm run build`
2. Set up environment variables
3. Connect to PostgreSQL database
4. Integrate Telethon workers
5. Setup Cloudflare R2 for sessions
6. Deploy to Vercel/Railway

## Contributing

This is a demonstration project. For production use, implement:
- User authentication
- Real database integration
- Session encryption
- Health monitoring
- Proxy management

## License

MIT
