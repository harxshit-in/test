# TestBook Platform - Project Structure

```
testbook-platform/
│
├── 📄 package.json                 # Project dependencies and scripts
├── 📄 README.md                    # Project documentation
├── 📄 SETUP_GUIDE.md              # Detailed setup instructions
├── 📄 quick-start.sh              # Quick setup script
├── 📄 .gitignore                  # Git ignore file
│
├── 📁 public/
│   └── 📄 index.html              # HTML template
│
└── 📁 src/
    │
    ├── 📄 index.js                # Application entry point
    ├── 📄 App.js                  # Main app component with routing
    │
    ├── 📁 components/             # Reusable components
    │   └── 📄 PrivateRoute.js     # Protected route wrapper
    │
    ├── 📁 config/                 # Configuration files
    │   └── 📄 firebase.js         # Firebase configuration & initialization
    │
    ├── 📁 context/                # React Context for state management
    │   └── 📄 AuthContext.js      # Authentication context & methods
    │
    ├── 📁 pages/                  # Page components
    │   ├── 📄 Home.js             # Landing page
    │   ├── 📄 Login.js            # Login page
    │   ├── 📄 Signup.js           # Registration page
    │   ├── 📄 Dashboard.js        # Student dashboard
    │   ├── 📄 AdminDashboard.js   # Admin dashboard
    │   └── 📄 Unauthorized.js     # Access denied page
    │
    └── 📁 styles/                 # CSS stylesheets
        ├── 📄 index.css           # Global styles
        ├── 📄 App.css             # App-level styles
        ├── 📄 Auth.css            # Authentication pages styles
        ├── 📄 Dashboard.css       # Dashboard pages styles
        └── 📄 Home.css            # Landing page styles
```

---

## 📋 File Descriptions

### Root Level Files

**package.json**
- Lists all project dependencies (React, Firebase, React Router)
- Contains npm scripts (start, build, test)
- Project metadata

**README.md**
- Project overview and documentation
- Features list
- Tech stack information
- Database schema
- Installation instructions

**SETUP_GUIDE.md**
- Detailed step-by-step setup instructions
- Firebase configuration guide
- Testing procedures
- Troubleshooting tips

**quick-start.sh**
- Automated setup script
- Checks Node.js installation
- Installs dependencies
- Starts development server

**.gitignore**
- Specifies files/folders Git should ignore
- Includes node_modules, build files, environment variables

---

### Public Folder

**public/index.html**
- HTML template for the React app
- Contains the root `<div id="root">` element
- Meta tags and page title

---

### Source Folder (src/)

#### Entry Point

**index.js**
- Application entry point
- Renders the App component into the DOM
- Includes React.StrictMode wrapper

**App.js**
- Main application component
- Defines all routes using React Router
- Wraps app in AuthProvider for authentication
- Includes global styles

---

#### Components Folder

**PrivateRoute.js**
- Higher-order component for protected routes
- Checks authentication status
- Validates user roles (student/admin)
- Redirects unauthorized users

---

#### Config Folder

**firebase.js**
- Firebase initialization
- Exports Firebase services:
  - `auth` - Authentication service
  - `db` - Firestore database
  - `storage` - Cloud storage
- Contains your Firebase project credentials

---

#### Context Folder

**AuthContext.js**
- Authentication state management using Context API
- Provides authentication methods:
  - `signup()` - Create new user account
  - `login()` - Sign in with email/password
  - `signInWithGoogle()` - Google OAuth sign-in
  - `logout()` - Sign out user
  - `fetchUserRole()` - Get user role from Firestore
- Manages current user state
- Handles user role (student/admin)

---

#### Pages Folder

**Home.js**
- Landing page component
- Hero section with call-to-action
- Features showcase
- Navigation to login/signup
- Fully responsive design

**Login.js**
- User login interface
- Email/password login form
- Google sign-in button
- Form validation
- Error handling
- Redirects based on user role

**Signup.js**
- User registration interface
- Account creation form
- Role selection (student/admin)
- Password confirmation
- Google sign-up option
- Creates user document in Firestore

**Dashboard.js**
- Student dashboard page
- Stats display (tests taken, average score, etc.)
- Available tests section (placeholder)
- Test history section (placeholder)
- User profile and logout

**AdminDashboard.js**
- Admin dashboard page
- Admin statistics
- Quick action buttons
- Exam management interface (placeholder)
- User management (placeholder)

**Unauthorized.js**
- Access denied page
- Shown when users try to access routes they don't have permission for
- Link back to appropriate dashboard

---

#### Styles Folder

**index.css**
- Global CSS resets
- Base typography
- Background gradients
- Root element styles

**App.css**
- App-level utility classes
- Button styles (primary, secondary)
- Common component styles
- Loading states

**Auth.css**
- Authentication pages styling
- Form input styles
- Card layout
- Google sign-in button
- Error message styles
- Responsive design

**Dashboard.css**
- Dashboard layout styles
- Navigation bar
- Stat cards
- Action buttons
- Grid layouts
- Responsive design

**Home.css**
- Landing page styles
- Hero section
- Features grid
- Mockup animations
- Footer
- Responsive design

---

## 🔄 Data Flow

```
User Interaction
      ↓
  Components
      ↓
  AuthContext (State Management)
      ↓
  Firebase Services
      ↓
  Firestore Database
```

---

## 🚀 Key Features Implemented

### Phase 1 (Current) ✅
- Complete authentication system
- Role-based access control
- Protected routes
- User session management
- Responsive UI
- Firebase integration

### Phase 2 (Next) 🔄
- Admin panel for exam management
- Question upload with images
- CRUD operations for exams

### Phase 3 (Future) 📅
- Test engine with timer
- Results and analytics
- Performance tracking

---

## 📊 Current Routes

| Route | Access | Component | Description |
|-------|--------|-----------|-------------|
| `/` | Public | Home | Landing page |
| `/login` | Public | Login | User login |
| `/signup` | Public | Signup | User registration |
| `/dashboard` | Student only | Dashboard | Student dashboard |
| `/admin` | Admin only | AdminDashboard | Admin panel |
| `/unauthorized` | Public | Unauthorized | Access denied |

---

## 🎨 Design Philosophy

- **Clean & Modern**: Professional UI with gradient backgrounds
- **Responsive**: Works on all device sizes
- **Accessible**: Proper labels, contrast, and keyboard navigation
- **Intuitive**: Clear navigation and user feedback
- **Consistent**: Unified color scheme and typography
- **Fast**: Optimized performance with React best practices

---

## 🔐 Security Features

- Firebase Authentication
- Role-based access control
- Protected routes
- Secure password requirements
- HTTPS by default (production)
- Firestore security rules
- Input validation
- XSS protection (React built-in)

---

## 📱 Responsive Breakpoints

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px - 1024px
- **Large Desktop**: > 1024px

All pages are optimized for these breakpoints!
