# Quran Management System - Sheikh Sayed Ahmed Atta

This plan outlines the development of a premium, RTL-supported Quran management system for Sheikh Sayed Ahmed Atta. The system will be designed for high-speed use, allowing the Sheikh to manage students' attendance and recitation progress efficiently.

## 🎨 Design Aesthetic
- **Primary Colors**: Emerald Green (#064E3B) and Metallic Gold (#D4AF37).
- **Style**: Glassmorphism, smooth transitions, and premium typography (e.g., Arabic-friendly fonts like 'Amiri' or 'Cairo').
- **Layout**: Mobile-first, responsive, and fully RTL (Right-to-Left).

## 🚀 Core Features
1. **Student Dashboard**: 
   - Smart search bar for quick filtering.
   - Student cards with status overviews.
2. **Recitation Recording (The "Lawh" Interface)**:
   - Interactive selection for Surah and Aya.
   - Three distinct tracking categories: Al-Lawh (New), Al-Tathbit (Consolidation), and Al-Madi (Long-range Review).
3. **Attendance Tracking**: 
   - Manual attendance logging integrated into the save process.
4. **Backend**: 
   - Firestore integration for real-time data persistence.
   - `Students` and `Attendance_Logs` collections.

## 🛠 Project Structure
- `index.html`: The main dashboard and input interface.
- `inventory.html`: (Optional) Student list management (Add/Edit/Delete).
- `css/style.css`: Premium design system.
- `js/firebase-config.js`: Firebase credentials and initialization.
- `js/quran-data.js`: Static data about Quran Surahs and Aya counts.
- `js/app.js`: Core application logic (Search, Firestore CRUD, UI updates).

## 📋 Implementation Steps
1. **Initialize Project**: Create the directory structure and base files.
2. **Define Quran Data**: Populate `quran-data.js` with all 114 Surahs and their Aya counts.
3. **Develop UI**: Build the emerald-gold theme and responsive layout.
4. **Firestore Logic**: Implement the "Students" collection CRUD operations.
5. **Session Logic**: Create the "Quick Save" functionality that updates multiple fields in a single click.
6. **Polish**: Add micro-interactions and animations.
