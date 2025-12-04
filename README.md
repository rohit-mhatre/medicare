# Medicare: Advanced Medication Management & Caregiver Platform

Medicare is a comprehensive mobile health (mHealth) application designed to improve medication adherence and facilitate remote patient monitoring. It bridges the gap between patients and caregivers through real-time data synchronization, emergency alerts, and detailed health tracking.

## Key Features

### For Patients
*   **Smart Medication Scheduling**: Complex scheduling engine supporting daily, weekly, and custom frequency dosages.
*   **Interactive Dashboard**: Glassmorphism-inspired UI showing daily progress, upcoming doses, and adherence stats.
*   **Health Vitals Tracking**: Log and visualize critical metrics like Blood Pressure, Heart Rate, Glucose, and Weight.
*   **Emergency SOS**: One-tap emergency alert system that broadcasts real-time location to linked caregivers.
*   **Appointment Manager**: Integrated calendar for tracking doctor visits with location and notes.
*   **PDF Health Reports**: On-demand generation of comprehensive health reports (meds, vitals, appointments) for doctor visits.

### For Caregivers
*   **Dedicated Caregiver Portal**: Secure dashboard to monitor multiple linked patients simultaneously.
*   **Real-time Adherence Monitoring**: View patient's daily medication intake and missed doses instantly.
*   **Remote Health Access**: View patient's logged vitals and upcoming appointments.
*   **Emergency Response**: Receive high-priority push notifications and in-app alerts when a patient triggers SOS.
*   **Patient Management**: Seamlessly link new patients via secure invite codes.

## Technical Specifications

### Mobile (Frontend)
*   **Framework**: React Native with Expo (Managed Workflow).
*   **Navigation**: React Navigation (Stack & Bottom Tabs) with role-based routing.
*   **Styling**: Custom design system using `StyleSheet` with a focus on Glassmorphism and premium aesthetics.
*   **Native Modules**: `expo-notifications`, `expo-location`, `expo-print`, `expo-sharing`, `expo-haptics`.

### Backend (API)
*   **Runtime**: Node.js with TypeScript.
*   **Framework**: Express.js REST API.
*   **Database**: PostgreSQL (Relational Data Model).
*   **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing.
*   **Architecture**: Service-Controller-Route pattern for scalability and testability.

## Project Structure

```
medicare/
├── backend/            # Express.js API and Database logic
├── mobile/             # React Native Expo application
├── docs/               # Project documentation and reports
├── .gitignore          # Git configuration
└── README.md           # Project overview
```

## Getting Started

### Prerequisites
*   Node.js (v14 or later)
*   PostgreSQL
*   Expo Go app (for mobile testing)

### Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd medicare
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    npm install
    # Configure .env with your database credentials
    npm run dev
    ```

3.  **Mobile Setup**
    ```bash
    cd mobile
    npm install
    npx expo start
    ```
