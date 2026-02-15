# TestBook Platform - Complete Setup Guide

## 📚 Table of Contents
1. [Initial Setup](#initial-setup)
2. [Firebase Configuration](#firebase-configuration)
3. [Running the Application](#running-the-application)
4. [Testing the Authentication](#testing-the-authentication)
5. [Next Steps](#next-steps)

---

## 1. Initial Setup

### Prerequisites
Make sure you have installed:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A **Firebase account** - [Create one here](https://firebase.google.com/)

### Installation Steps

```bash
# Navigate to the project directory
cd testbook-platform

# Install all dependencies
npm install

# This will install:
# - react & react-dom (UI framework)
# - react-router-dom (routing)
# - firebase (backend services)
# - react-scripts (development server)
```

---

## 2. Firebase Configuration

### Step 1: Firebase Console Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select Your Project**: harxshit-in-app (already configured)
3. Complete the following setup tasks:

### Step 2: Enable Authentication

1. In Firebase Console, click **Authentication** in the left sidebar
2. Click **Get Started** (if first time)
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - ✅ **Email/Password**: Click on it → Toggle "Enable" → Save
   - ✅ **Google**: Click on it → Toggle "Enable" → Add support email → Save

### Step 3: Create Firestore Database

1. In Firebase Console, click **Firestore Database** in the left sidebar
2. Click **Create Database**
3. Select **Start in test mode** (for development)
4. Choose a location (default is fine)
5. Click **Enable**

### Step 4: Set Up Security Rules (IMPORTANT!)

After creating Firestore, update the security rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if isAuthenticated();
      // Users can only write their own document
      allow write: if request.auth.uid == userId;
    }
    
    // Exams collection
    match /exams/{examId} {
      // Anyone authenticated can read exams
      allow read: if isAuthenticated();
      // Only admins can create, update, or delete exams
      allow write: if isAdmin();
      
      // Questions subcollection
      match /questions/{questionId} {
        allow read: if isAuthenticated();
        allow write: if isAdmin();
      }
    }
    
    // Attempts collection
    match /attempts/{attemptId} {
      // Users can only read their own attempts
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      // Users can create attempts
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      // Users cannot update or delete attempts (integrity)
      allow update, delete: if false;
    }
  }
}
```

3. Click **Publish**

### Step 5: Enable Firebase Storage (For Question Images)

1. In Firebase Console, click **Storage** in the left sidebar
2. Click **Get Started**
3. Use default security rules (we'll update later)
4. Click **Done**

---

## 3. Running the Application

### Development Mode

```bash
# Start the development server
npm start

# The app will automatically open in your browser at:
# http://localhost:3000
```

### What You Should See

1. **Home Page** (`/`) - Beautiful landing page with features
2. **Navigation** - Login and Sign Up buttons
3. **Responsive Design** - Should work on all screen sizes

---

## 4. Testing the Authentication

### Test Case 1: Sign Up as Student

1. Click **"Get Started"** or **"Sign Up"** button
2. Fill in the form:
   - Full Name: "John Student"
   - Email: "student@test.com"
   - Password: "password123"
   - Confirm Password: "password123"
   - Account Type: **Student**
3. Click **"Create Account"**
4. You should be redirected to `/dashboard` (Student Dashboard)

### Test Case 2: Sign Up as Admin

1. Logout (click Logout button)
2. Go to Sign Up page
3. Fill in the form:
   - Full Name: "Admin User"
   - Email: "admin@test.com"
   - Password: "password123"
   - Confirm Password: "password123"
   - Account Type: **Admin**
4. Click **"Create Account"**
5. You should be redirected to `/admin` (Admin Dashboard)

### Test Case 3: Login with Existing Account

1. Logout if logged in
2. Click **"Sign In"**
3. Enter credentials:
   - Email: "student@test.com"
   - Password: "password123"
4. Click **"Sign In"**
5. Should redirect to appropriate dashboard based on role

### Test Case 4: Google Sign-In

1. Logout if logged in
2. Click **"Continue with Google"** on Login page
3. Select your Google account
4. Should redirect to student dashboard (Google users default to student role)

### Test Case 5: Protected Routes

1. Try accessing `/dashboard` without logging in
2. Should redirect to `/login`
3. Try accessing `/admin` as a student
4. Should redirect to `/unauthorized`

---

## 5. Next Steps

### Verify Everything is Working

Before moving to Phase 2, check:

- ✅ Sign up works (both email and Google)
- ✅ Login works (both email and Google)
- ✅ Role-based routing works (student → `/dashboard`, admin → `/admin`)
- ✅ Protected routes work (can't access without login)
- ✅ Logout works
- ✅ User data is saved in Firestore (check Firebase Console → Firestore Database)

### Phase 2: Admin Panel

Once authentication is working, we'll build:

1. **Exam Management**:
   - Create new exams
   - Edit existing exams
   - Delete exams
   - View all exams

2. **Question Management**:
   - Add questions to exams
   - Support for multiple choice questions
   - Image upload for questions
   - Edit and delete questions

3. **Category Management**:
   - Organize exams by category (SSC, Banking, Railways, etc.)
   - Filter and search functionality

---

## 🐛 Troubleshooting

### Issue: npm install fails
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install again
npm install
```

### Issue: Firebase authentication error
**Solution**:
- Check that Email/Password and Google are enabled in Firebase Console
- Verify the API key in `src/config/firebase.js`
- Check browser console for specific error messages

### Issue: "Network request failed"
**Solution**:
- Check your internet connection
- Verify Firebase project is active
- Check Firebase Console for service status

### Issue: User document not created in Firestore
**Solution**:
- Check Firestore security rules are set up correctly
- Verify the database is created and accessible
- Check browser console for permission errors

### Issue: Can't access protected routes
**Solution**:
- Make sure you're logged in
- Check the console for authentication state
- Verify role is set correctly in Firestore user document

---

## 📞 Support

If you encounter any issues:
1. Check the browser console for error messages
2. Check Firebase Console logs
3. Verify all Firebase services are enabled
4. Review this setup guide again

---

## 🎉 Success Checklist

Before moving to Phase 2, confirm:

- [ ] Project installed and runs without errors
- [ ] Firebase Authentication is configured
- [ ] Firestore database is created
- [ ] Security rules are set up
- [ ] Can sign up with email/password
- [ ] Can sign up with Google
- [ ] Can login with existing account
- [ ] Student role redirects to `/dashboard`
- [ ] Admin role redirects to `/admin`
- [ ] Protected routes work correctly
- [ ] Can logout successfully
- [ ] User data appears in Firestore

Once all items are checked, you're ready for **Phase 2: Admin Panel Development**! 🚀
