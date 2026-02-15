# TestBook Platform - Online Test Preparation

A comprehensive online test preparation platform built with React and Firebase, similar to Testbook. This platform allows users to take timed mock tests, view detailed performance analytics, and enables administrators to upload questions and manage exams.

## 🚀 Features

### Current (Phase 1 - Authentication)
- ✅ Email/Password and Google Sign-in authentication
- ✅ Role-based access control (Student & Admin)
- ✅ Protected routes with authentication
- ✅ Beautiful, responsive UI with modern design
- ✅ Student and Admin dashboards (basic layout)

### Upcoming Features
- Admin Panel for exam management (CRUD operations)
- Question bank with image upload support
- Test engine with strict exam environment
- Timer with auto-submit functionality
- Detailed results and analytics
- Subject-wise performance breakdown
- Test history and progress tracking

## 🛠️ Tech Stack

- **Frontend**: React.js with React Router
- **Backend/Database**: Firebase (Authentication, Firestore, Storage)
- **State Management**: Context API
- **Styling**: Custom CSS (easily adaptable to Tailwind CSS)

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd testbook-platform
```

2. Install dependencies:
```bash
npm install
```

3. Firebase is already configured with the provided credentials. However, for production, you should:
   - Set up Firebase Security Rules
   - Enable Authentication methods (Email/Password and Google) in Firebase Console
   - Set up Firestore database

4. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
testbook-platform/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── PrivateRoute.js          # Protected route component
│   ├── config/
│   │   └── firebase.js              # Firebase configuration
│   ├── context/
│   │   └── AuthContext.js           # Authentication context
│   ├── pages/
│   │   ├── Home.js                  # Landing page
│   │   ├── Login.js                 # Login page
│   │   ├── Signup.js                # Signup page
│   │   ├── Dashboard.js             # Student dashboard
│   │   ├── AdminDashboard.js        # Admin dashboard
│   │   └── Unauthorized.js          # Unauthorized access page
│   ├── styles/
│   │   ├── index.css                # Global styles
│   │   ├── App.css                  # App-level styles
│   │   ├── Auth.css                 # Authentication pages styles
│   │   ├── Dashboard.css            # Dashboard styles
│   │   └── Home.css                 # Landing page styles
│   ├── App.js                       # Main app component with routing
│   └── index.js                     # Entry point
├── package.json
└── README.md
```

## 🔐 Firebase Configuration

The app is configured with the following Firebase project:
- Project ID: harxshit-in-app
- Auth Domain: harxshit-in-app.firebaseapp.com

### Required Firebase Setup:

1. **Enable Authentication Methods**:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google"

2. **Create Firestore Database**:
   - Go to Firebase Console → Firestore Database
   - Create database (start in test mode for development)

3. **Set Up Security Rules** (Important for production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Exams collection (to be added)
    match /exams/{examId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Questions collection (to be added)
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Attempts collection (to be added)
    match /attempts/{attemptId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

## 📊 Database Schema

### Users Collection
```javascript
{
  uid: string,
  name: string,
  email: string,
  role: 'student' | 'admin',
  createdAt: timestamp
}
```

### Exams Collection (Coming in Phase 2)
```javascript
{
  examId: string,
  title: string,
  category: string,
  durationMinutes: number,
  totalMarks: number,
  createdAt: timestamp
}
```

### Questions Collection (Coming in Phase 2)
```javascript
{
  questionId: string,
  examId: string,
  text: string,
  options: array,
  correctOptionIndex: number,
  explanation: string,
  marks: number,
  imageUrl?: string
}
```

### Attempts Collection (Coming in Phase 3)
```javascript
{
  attemptId: string,
  userId: string,
  examId: string,
  answers: object,
  score: number,
  startTime: timestamp,
  endTime: timestamp
}
```

## 🎯 Available Routes

- `/` - Home/Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Student dashboard (protected, requires student role)
- `/admin` - Admin dashboard (protected, requires admin role)
- `/unauthorized` - Unauthorized access page

## 👥 User Roles

1. **Student**:
   - Can view and take mock tests
   - Can view their test history and analytics
   - Access to student dashboard

2. **Admin**:
   - Can create and manage exams
   - Can add, edit, and delete questions
   - Can view student performance analytics
   - Access to admin dashboard

## 🚧 Next Steps (Phase 2 - Admin Panel)

1. Create exam management interface
2. Build question upload form with image support
3. Implement CRUD operations for exams and questions
4. Add exam categorization (SSC, Banking, Railways, etc.)
5. Integrate Firebase Storage for image uploads

## 📝 Development Notes

- The current implementation uses Context API for state management
- All routes are protected based on authentication and user roles
- The UI is fully responsive and works on all device sizes
- Firebase configuration is exposed in the frontend (this is normal for Firebase)
- Security is enforced through Firestore Security Rules (to be set up)

## 🤝 Contributing

This is a learning project. Feel free to fork and modify as needed.

## 📄 License

This project is open source and available under the MIT License.
