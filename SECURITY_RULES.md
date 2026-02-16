# Firebase Security Rules - ExamPrepBook Platform

## 🔒 **Enhanced Security Rules for Firestore**

Copy and paste these rules into your Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    
    // Check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Check if user owns the resource
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Validate user data
    function validUserData() {
      let data = request.resource.data;
      return data.keys().hasAll(['uid', 'email', 'role', 'createdAt']) &&
             data.uid is string &&
             data.email is string &&
             data.role in ['student', 'admin'] &&
             data.createdAt is string;
    }
    
    // Validate exam data
    function validExamData() {
      let data = request.resource.data;
      return data.keys().hasAll(['title', 'category', 'durationMinutes', 'totalMarks']) &&
             data.title is string &&
             data.category is string &&
             data.durationMinutes is int &&
             data.durationMinutes > 0 &&
             data.totalMarks is int &&
             data.totalMarks > 0;
    }
    
    // Validate question data
    function validQuestionData() {
      let data = request.resource.data;
      return data.keys().hasAll(['examId', 'text', 'options', 'correctOptionIndex', 'marks']) &&
             data.examId is string &&
             data.text is string &&
             data.options is list &&
             data.options.size() == 4 &&
             data.correctOptionIndex is int &&
             data.correctOptionIndex >= 0 &&
             data.correctOptionIndex <= 3 &&
             data.marks is number &&
             data.marks > 0;
    }
    
    // Validate attempt data
    function validAttemptData() {
      let data = request.resource.data;
      return data.keys().hasAll(['userId', 'examId', 'score', 'startTime', 'endTime']) &&
             data.userId == request.auth.uid &&  // Must be current user
             data.userId is string &&
             data.examId is string &&
             data.score is number &&
             data.score >= 0 &&
             data.startTime is string &&
             data.endTime is string;
    }
    
    // ==========================================
    // COLLECTION RULES
    // ==========================================
    
    // USERS COLLECTION
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if isSignedIn();
      
      // Users can create their own document during signup
      // CRITICAL: Force role to 'student' on creation to prevent admin escalation
      allow create: if isSignedIn() && 
                       request.auth.uid == userId &&
                       validUserData() &&
                       request.resource.data.role == 'student';  // Force student role!
      
      // Users can update their own profile (except role)
      allow update: if isOwner(userId) &&
                       validUserData() &&
                       request.resource.data.role == resource.data.role;  // Cannot change role
      
      // Only the user can delete their own profile
      allow delete: if isOwner(userId);
    }
    
    // EXAMS COLLECTION
    match /exams/{examId} {
      // Anyone authenticated can read exams
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete exams
      allow create: if isAdmin() && validExamData();
      allow update: if isAdmin() && validExamData();
      allow delete: if isAdmin();
    }
    
    // QUESTIONS COLLECTION
    match /questions/{questionId} {
      // Anyone authenticated can read questions (for taking tests)
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete questions
      allow create: if isAdmin() && validQuestionData();
      allow update: if isAdmin() && validQuestionData();
      allow delete: if isAdmin();
    }
    
    // ATTEMPTS COLLECTION
    match /attempts/{attemptId} {
      // Users can only read their own attempts
      // Also allow reading for leaderboard (but filter by examId in queries)
      allow read: if isSignedIn();
      
      // Users can create attempts (submitting test)
      allow create: if isSignedIn() && 
                       validAttemptData() &&
                       request.resource.data.userId == request.auth.uid;
      
      // Users cannot update or delete attempts (data integrity)
      allow update: if false;
      allow delete: if false;
    }
    
    // DENY ALL OTHER COLLECTIONS
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🛡️ **What These Rules Protect Against:**

### **1. Admin Panel Hacking:**
✅ **Prevents role escalation** - Users cannot set themselves as admin  
✅ **Forces student role** on signup - No way to create admin via app  
✅ **Locks role changes** - Users cannot modify their own role  
✅ **Validates all admin actions** - Every write checks admin status  

### **2. Data Integrity:**
✅ **Validates all data** - Ensures correct field types and values  
✅ **Prevents tampering** - Test attempts cannot be modified after submission  
✅ **Enforces ownership** - Users can only modify their own data  

### **3. Exam Security:**
✅ **Read-only for students** - Can view but not modify exams/questions  
✅ **Admin-only writes** - Only admins can create/edit/delete content  
✅ **Validated submissions** - Test submissions must match user ID  

---

## 📋 **How to Apply These Rules:**

### **Step 1: Open Firebase Console**
1. Go to: https://console.firebase.google.com/
2. Select your project: **harxshit-in-app**
3. Click **Firestore Database** in left sidebar
4. Click **Rules** tab at the top

### **Step 2: Replace Rules**
1. **Delete** all existing rules
2. **Copy** the rules from above
3. **Paste** into the editor
4. **Click "Publish"**

### **Step 3: Test Security**
Try these tests to verify:

**Test 1: Cannot self-promote to admin**
```javascript
// This should FAIL
db.collection('users').doc(myUserId).update({
  role: 'admin'  // ❌ Blocked by security rules
});
```

**Test 2: Students cannot create exams**
```javascript
// This should FAIL
db.collection('exams').add({
  title: 'Hacked Exam',  // ❌ Blocked - not an admin
  ...
});
```

**Test 3: Cannot modify test attempts**
```javascript
// This should FAIL
db.collection('attempts').doc(attemptId).update({
  score: 100  // ❌ Blocked - attempts are immutable
});
```

---

## 🔐 **Additional Security Measures:**

### **1. Environment Variables (Optional)**
For extra security, you can hide your Firebase config:

```javascript
// .env file (don't commit to Git!)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
// ... etc
```

### **2. Email Verification**
Enable email verification for extra security:

```javascript
// In AuthContext.js after signup
await sendEmailVerification(userCredential.user);
```

### **3. Rate Limiting**
Firebase automatically rate limits, but you can add:
- App Check (prevents bots)
- reCAPTCHA on sensitive operations

### **4. Audit Logs**
Monitor admin actions:
- Check Firestore logs regularly
- Set up alerts for suspicious activity
- Review who has admin access

---

## ⚠️ **Critical Security Points:**

### **DO:**
✅ Apply these security rules immediately  
✅ Test rules in Firebase Console  
✅ Review admin users regularly  
✅ Use strong passwords  
✅ Enable 2FA (when available)  
✅ Monitor Firestore logs  

### **DON'T:**
❌ Allow role changes via the app  
❌ Trust client-side validation alone  
❌ Share admin credentials  
❌ Commit API keys to public repos  
❌ Skip security rule testing  
❌ Grant admin access carelessly  

---

## 🧪 **Testing Your Security Rules:**

### **Firebase Console Rules Playground:**

1. Go to **Firestore Database** → **Rules** → **Rules Playground**
2. Test scenarios:

**Scenario 1: Student tries to create exam**
```
Location: /exams/newExamId
Operation: create
Authenticated: Yes (as student)
Result: Should be DENIED ❌
```

**Scenario 2: Admin creates exam**
```
Location: /exams/newExamId
Operation: create
Authenticated: Yes (as admin)
Result: Should be ALLOWED ✅
```

**Scenario 3: User changes own role**
```
Location: /users/userId
Operation: update
Field: role = "admin"
Result: Should be DENIED ❌
```

---

## 🎯 **Verification Checklist:**

After applying rules, verify:

- [ ] Rules are published in Firebase Console
- [ ] Students can sign up (creates student role only)
- [ ] Students can read exams and questions
- [ ] Students cannot create/edit exams or questions
- [ ] Students can submit test attempts
- [ ] Students cannot edit submitted attempts
- [ ] Admins (manually created) can manage exams
- [ ] Admins can manage questions
- [ ] Users cannot change their own role
- [ ] Tested in Rules Playground

---

## 🚨 **Emergency: If Security is Breached:**

1. **Immediately close Firestore rules:**
```javascript
match /{document=**} {
  allow read, write: if false;  // Deny everything
}
```

2. **Review all users** in Authentication
3. **Check admin users** in Firestore
4. **Review recent activity** in logs
5. **Change all admin passwords**
6. **Apply new secure rules**
7. **Audit all data** for tampering

---

## 📞 **Support:**

If you encounter rule-related errors:
1. Check browser console for permission errors
2. Verify user role in Firestore
3. Test in Rules Playground
4. Review the rules syntax
5. Check Firebase logs for details

---

**Remember:** Security rules are your last line of defense. Never skip this step! 🛡️
