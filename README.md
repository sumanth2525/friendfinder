# FriendFinder - Mobile App Style Web App

A React.js web application designed to look and feel like a modern mobile app.

## Features

- 📱 Mobile-first design with app-like UI
- 🎨 Modern gradient design with smooth animations
- 📍 Bottom navigation bar (mobile app style)
- 🎯 Touch-friendly buttons and interactions
- 📱 Responsive layout that works on all screen sizes
- ✨ Smooth transitions and animations

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

4. **Open your browser:**
   - Local: `http://localhost:5173`
   - Network: Check terminal for your IP address

### Development Guides
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Comprehensive development guide with tips & tricks
- **[HOW_TO_DEVELOP.md](./HOW_TO_DEVELOP.md)** - Step-by-step guide to developing new features
- **[FEATURES_TO_ADD.md](./FEATURES_TO_ADD.md)** - Complete list of features you can add (60+ features!)

### Access from Mobile Device

To view the app on your mobile device:

1. Make sure your computer and mobile device are on the **same Wi-Fi network**

2. Start the development server:
```bash
npm run dev
```

3. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` in Command Prompt and look for "IPv4 Address"
   - **Mac/Linux**: Run `ifconfig` or `ip addr` and look for your network interface IP

4. On your mobile device, open a browser and navigate to:
   ```
   http://YOUR_IP_ADDRESS:5173
   ```
   
   For example: `http://10.0.0.89:5173`

5. The app will load and look like a native mobile app!

**Note**: Make sure your firewall allows connections on port 5173 if you have issues connecting.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
FriendFinder/
├── src/
│   ├── components/
│   │   ├── Header.jsx      # App header component
│   │   └── BottomNav.jsx   # Bottom navigation bar
│   ├── pages/
│   │   ├── Home.jsx        # Home page
│   │   ├── Search.jsx      # Search page
│   │   └── Profile.jsx     # Profile page
│   ├── App.jsx             # Main app component
│   ├── App.css             # App-specific styles
│   ├── index.css           # Global styles
│   └── main.jsx            # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Technologies Used

- React 18
- Vite (build tool)
- Modern CSS with CSS Variables
- Mobile-first responsive design
- LocalStorage (temporary - will be replaced with Supabase)

## Data Persistence

Currently, the app uses **localStorage** for data persistence:

- ✅ **User Authentication**: Login state persists across page refreshes
- ✅ **Favorites**: Saved destination favorites are remembered
- ✅ **User Preferences**: Profile settings and preferences
- ✅ **Active Tab**: Last viewed tab is remembered

**Note**: This is a temporary solution. The next version will use **Supabase** for:
- Real-time data synchronization
- Server-side storage
- Multi-device support
- Enhanced security
- User authentication with sessions

The localStorage utility (`src/utils/localStorage.js`) is designed to make the migration to Supabase easier.

## Design Features

- **Mobile App Container**: Centered container with max-width of 428px (iPhone size)
- **Bottom Navigation**: Fixed bottom nav bar with icons and labels
- **Card-based Layout**: Modern card design with shadows and rounded corners
- **Gradient Headers**: Beautiful gradient backgrounds
- **Touch Interactions**: Active states and smooth transitions
- **Safe Area Support**: Respects device safe areas (notches, etc.)

## Customization

You can customize the app by modifying:
- Colors in `src/index.css` (CSS variables)
- Components in `src/components/`
- Pages in `src/pages/`
- Global styles in `src/index.css`
