# 30 Concurrent Users Limit - Implementation Guide

## 🎯 **Feature Overview:**

This feature prevents more than 30 students from taking the same test simultaneously, protecting your Firebase free tier limits.

---

## ⚙️ **How It Works:**

### **1. When Student Clicks "Start Test":**
```
1. System checks: How many students are currently taking this test?
2. Counts active attempts (started in last 5 minutes, not finished)
3. If count < 30: Allow test to start ✅
4. If count >= 30: Show wait screen ⏳
```

### **2. What Counts as "Active":**
- Started test in last 5 minutes AND
- Either:
  - Not submitted yet, OR
  - Submitted in last 2 minutes

### **3. Auto-Cleanup:**
After 5 minutes, old attempts are not counted (assuming student completed or left)

---

## 📝 **Implementation Steps:**

### **Step 1: Update TestEngine.js**

Add these state variables (after line 22):
```javascript
const [concurrentUsers, setConcurrentUsers] = useState(0);
const [canStartTest, setCanStartTest] = useState(false);
const [checkingCapacity, setCheckingCapacity] = useState(true);

const MAX_CONCURRENT_USERS = 30; // Change this number as needed
```

### **Step 2: Replace useEffect (around line 26)**

Replace:
```javascript
useEffect(() => {
  fetchExamAndQuestions();
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
}, [examId]);
```

With:
```javascript
useEffect(() => {
  checkConcurrentUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [examId]);

useEffect(() => {
  if (canStartTest && !exam) {
    fetchExamAndQuestions();
  }
  return () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [canStartTest]);
```

### **Step 3: Add checkConcurrentUsers Function**

Add before `fetchExamAndQuestions`:
```javascript
const checkConcurrentUsers = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const recentAttemptsQuery = query(
      collection(db, 'attempts'),
      where('examId', '==', examId)
    );
    
    const snapshot = await getDocs(recentAttemptsQuery);
    
    const activeCount = snapshot.docs.filter(doc => {
      const data = doc.data();
      const startTime = data.startTime ? new Date(data.startTime) : null;
      const endTime = data.endTime ? new Date(data.endTime) : null;
      
      if (startTime && startTime > fiveMinutesAgo) {
        if (!endTime || endTime > new Date(now.getTime() - 2 * 60 * 1000)) {
          return true;
        }
      }
      return false;
    }).length;

    console.log('Active concurrent users:', activeCount, 'Max:', MAX_CONCURRENT_USERS);
    setConcurrentUsers(activeCount);
    
    if (activeCount >= MAX_CONCURRENT_USERS) {
      setCanStartTest(false);
    } else {
      setCanStartTest(true);
    }
    setCheckingCapacity(false);
  } catch (error) {
    console.error('Error checking concurrent users:', error);
    setCanStartTest(true); // Allow on error
    setCheckingCapacity(false);
  }
};
```

### **Step 4: Add Wait Screens**

Add before the main return statement (after `if (loading)` check):

```javascript
if (checkingCapacity) {
  return (
    <div className="test-wait-screen">
      <div className="wait-content">
        <div className="spinner"></div>
        <h2>Checking Test Availability...</h2>
        <p>Please wait while we check the server capacity.</p>
      </div>
    </div>
  );
}

if (!canStartTest) {
  return (
    <div className="test-wait-screen">
      <div className="wait-content">
        <div className="wait-icon">⏳</div>
        <h2>Test Capacity Reached</h2>
        <p>Currently <strong>{concurrentUsers}</strong> students are taking this test.</p>
        <p>Maximum concurrent users allowed: <strong>{MAX_CONCURRENT_USERS}</strong></p>
        <div className="wait-message">
          <p>⏱️ Please wait a few minutes and try again.</p>
          <p>Tests typically take 30-60 minutes to complete.</p>
        </div>
        <div className="wait-actions">
          <button className="btn-primary" onClick={checkConcurrentUsers}>
            🔄 Check Again
          </button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **Step 5: Add CSS**

The CSS has already been added to `TestEngine.css` (wait screen styles).

---

## 🎯 **User Experience:**

### **Scenario 1: Test Available (< 30 users)**
```
Student clicks "Start Test"
  ↓
Checking... (1-2 seconds)
  ↓
Test loads normally ✅
```

### **Scenario 2: Test Full (= 30 users)**
```
Student clicks "Start Test"
  ↓
Checking... (1-2 seconds)
  ↓
Wait Screen appears:
┌─────────────────────────────┐
│        ⏳                   │
│   Test Capacity Reached     │
│                             │
│ Currently 30 students are   │
│ taking this test.           │
│                             │
│ Maximum: 30 users           │
│                             │
│ ⏱️ Please wait a few minutes│
│                             │
│ [🔄 Check Again]           │
│ [← Back to Dashboard]      │
└─────────────────────────────┘
```

### **Scenario 3: Waiting Student**
```
Student sees wait screen
  ↓
Waits 5-10 minutes
  ↓
Clicks "🔄 Check Again"
  ↓
System recounts active users
  ↓
If < 30: Test starts ✅
If still 30: Wait screen again ⏳
```

---

## 💡 **Configuration:**

### **Change Maximum Users:**
In `TestEngine.js`, change this line:
```javascript
const MAX_CONCURRENT_USERS = 30; // Change to 20, 50, 100, etc.
```

### **Change Time Windows:**
```javascript
// Change 5 minutes to 10 minutes:
const fiveMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

// Change 2 minutes grace period:
if (!endTime || endTime > new Date(now.getTime() - 5 * 60 * 1000))
```

---

## 📊 **Firebase Impact:**

### **Without This Feature:**
```
Unlimited concurrent users
  ↓
Potential Firestore read/write spike
  ↓
Could exceed free tier limits
  ↓
Extra charges or service disruption ❌
```

### **With This Feature:**
```
Max 30 concurrent users
  ↓
Controlled Firestore usage
  ↓
Stays within free tier limits
  ↓
No extra charges ✅
```

### **Free Tier Limits:**
- **Reads:** 50,000/day
- **Writes:** 20,000/day
- **Deletes:** 20,000/day

**30 concurrent users = Safe** ✅

---

## 🧪 **Testing:**

### **Test with Multiple Accounts:**

1. **Create 3-5 test accounts**
2. **Change MAX to 3** (for easier testing)
3. **Start test on 3 accounts**
4. **Try 4th account** → Should see wait screen
5. **Submit one test**
6. **Try 4th account again** → Should work now

### **Test Auto-Cleanup:**

1. Start test but don't submit
2. Wait 6 minutes
3. Try starting test with new account
4. Should work (old attempt not counted)

---

## ⚠️ **Important Notes:**

### **Limitations:**
- Client-side check (can be bypassed by tech-savvy users)
- Based on timestamps (requires accurate client clocks)
- Counts ALL attempts, not unique users

### **Improvements Possible:**
- Server-side enforcement (Cloud Functions)
- User-based limiting (one active test per user)
- Real-time updates (Firestore listeners)
- Admin override capability

### **Current Behavior:**
- ✅ Protects Firebase limits
- ✅ Graceful user experience
- ✅ Easy to configure
- ✅ No backend needed
- ⚠️ Not bulletproof (good enough for most cases)

---

## 🎯 **Production Recommendations:**

### **For Small Scale (< 100 students):**
- MAX = 30 ✅
- Current implementation works well

### **For Medium Scale (100-500 students):**
- MAX = 50-100
- Consider scheduling test windows
- Monitor Firebase usage

### **For Large Scale (500+ students):**
- Use Firebase paid plan
- Implement backend validation
- Use Cloud Functions for enforcement
- Add queue system

---

## 📞 **Troubleshooting:**

### **Issue: Students stuck on wait screen**
**Cause:** Old attempts not being cleaned up
**Fix:** 
1. Reduce time window (3 minutes instead of 5)
2. Or manually delete old attempts from Firestore

### **Issue: Test starts even when full**
**Cause:** Error in checkConcurrentUsers
**Fix:** Check console for errors, verify Firestore permissions

### **Issue: Always shows "checking..."**
**Cause:** checkConcurrentUsers failing
**Fix:** Check Firebase connection, verify query syntax

---

## ✅ **Implementation Checklist:**

- [ ] Add state variables to TestEngine.js
- [ ] Replace useEffect hooks
- [ ] Add checkConcurrentUsers function
- [ ] Add wait screen returns
- [ ] Verify CSS added
- [ ] Test with multiple accounts
- [ ] Set appropriate MAX value
- [ ] Monitor Firebase usage
- [ ] Deploy

---

**This feature protects your Firebase free tier while providing a good user experience!** 🎯🔒
