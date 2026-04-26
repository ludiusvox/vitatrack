# Daily Health Tracker

A lightweight, fully local health tracking application designed for Android deployment. It helps users track daily hygiene tasks, vitamins/OTC medications, and prescriptions with image attachments. All data is stored locally on the device using browser-based storage, making it completely self-contained without requiring a backend server.

## Features
- 📅 **Daily History**: Navigate through past dates to view/edit previous checklists via the sidebar calendar.
- 🚿 **Hygiene Checklist**: Pre-populated tasks (Shower, Brush Teeth, Floss, Deodorant) with support for custom additions.
- 💊 **Vitamins & OTC**: Track multivitamins and over-the-counter medications. Attach reference images for elderly users or personal identification.
- 🕒 **Prescriptions**: Schedule medications at preset times (9 AM - 9 PM) or add custom time slots. Includes image attachment support.
- 📱 **Android Ready**: Built with React & Vite, optimized for packaging via Capacitor into a native Android app.
- 💾 **Local Persistence**: All data persists locally in the device's storage. No server required.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS
- **Icons**: Lucide React
- **Mobile Packaging**: Capacitor (for Android WebView)
- **Storage**: LocalStorage with Base64 image serialization

## Getting Started
See [installation.md](./installation.md) for detailed setup and deployment instructions.

## License
MIT
