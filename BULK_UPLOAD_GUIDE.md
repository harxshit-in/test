# Bulk Question Upload Guide - JSON Format 📁

## 🎯 **What is Bulk Upload?**

Bulk upload allows admins to add **multiple questions at once** using a JSON file, instead of adding them one by one. This saves massive amounts of time when creating large question banks!

---

## ✅ **Benefits:**

- ⚡ **Fast**: Upload 10, 50, or 100+ questions in seconds
- 📝 **Efficient**: Prepare questions offline in any text editor
- 🔄 **Reusable**: Save JSON files for future use
- 📋 **Easy**: Copy-paste from Excel, Google Sheets, or anywhere
- ✏️ **Flexible**: Edit JSON easily before upload

---

## 🚀 **How to Use Bulk Upload:**

### **Step 1: Access Bulk Upload**

1. **Login as Admin**
2. **Go to:** `/admin/exams`
3. **Click:** "Manage Questions" on any exam
4. **Click:** "📁 Bulk Upload JSON" button (top right)

---

### **Step 2: Prepare Your JSON**

You have **3 options**:

#### **Option A: Use the Example** (Easiest)
1. Click "Show Example JSON" in the modal
2. Click "Copy Example to Editor"
3. Modify the questions as needed
4. Click "Validate & Upload"

#### **Option B: Create Your Own**
1. Use the format below
2. Paste into the editor
3. Click "Validate & Upload"

#### **Option C: Upload a File**
1. Save your JSON as a `.json` file
2. Click "📁 Upload JSON File"
3. Select your file
4. Click "Validate & Upload"

---

## 📋 **JSON Format:**

### **Basic Structure:**

```json
[
  {
    "text": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctOptionIndex": 0,
    "explanation": "Why this answer is correct",
    "marks": 2,
    "subject": "General Knowledge",
    "difficulty": "easy"
  }
]
```

### **Required Fields:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `text` | string | Any text | The question text |
| `options` | array | 4 strings | Must have exactly 4 options |
| `correctOptionIndex` | number | 0, 1, 2, or 3 | Index of correct answer (0=A, 1=B, 2=C, 3=D) |
| `marks` | number | Positive number | Points for this question |

### **Optional Fields:**

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `explanation` | string | Any text | Explanation shown after test |
| `subject` | string | Any text | Subject/topic category |
| `difficulty` | string | "easy", "medium", "hard" | Difficulty level |

---

## 📝 **Complete Example:**

```json
[
  {
    "text": "What is the capital of India?",
    "options": ["Mumbai", "New Delhi", "Kolkata", "Chennai"],
    "correctOptionIndex": 1,
    "explanation": "New Delhi is the capital of India since 1911.",
    "marks": 2,
    "subject": "General Knowledge",
    "difficulty": "easy"
  },
  {
    "text": "Which planet is known as the Red Planet?",
    "options": ["Venus", "Mars", "Jupiter", "Saturn"],
    "correctOptionIndex": 1,
    "explanation": "Mars is known as the Red Planet due to iron oxide on its surface.",
    "marks": 2,
    "subject": "General Knowledge",
    "difficulty": "easy"
  },
  {
    "text": "What is 15 × 12?",
    "options": ["160", "170", "180", "190"],
    "correctOptionIndex": 2,
    "explanation": "15 × 12 = 180. You can calculate: (15 × 10) + (15 × 2) = 150 + 30 = 180",
    "marks": 2,
    "subject": "Quantitative Aptitude",
    "difficulty": "medium"
  },
  {
    "text": "Who wrote 'Romeo and Juliet'?",
    "options": ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    "correctOptionIndex": 1,
    "explanation": "William Shakespeare wrote Romeo and Juliet around 1594-1596.",
    "marks": 1,
    "subject": "English Literature",
    "difficulty": "easy"
  },
  {
    "text": "What is the chemical symbol for Gold?",
    "options": ["Go", "Gd", "Au", "Ag"],
    "correctOptionIndex": 2,
    "explanation": "Au is the chemical symbol for Gold, from the Latin word 'Aurum'.",
    "marks": 1,
    "subject": "Chemistry",
    "difficulty": "medium"
  }
]
```

---

## 💡 **Tips & Best Practices:**

### **1. Preparing Questions:**

✅ **DO:**
- Use a text editor with JSON support (VS Code, Notepad++, etc.)
- Validate JSON before uploading (use jsonlint.com)
- Keep questions clear and concise
- Write detailed explanations
- Group questions by subject

❌ **DON'T:**
- Use special characters that break JSON (unescaped quotes)
- Leave any required field empty
- Use more or less than 4 options
- Use correctOptionIndex outside 0-3 range

### **2. Common Mistakes:**

**Missing Comma:**
```json
❌ Wrong:
[
  {"text": "Q1?", ...}
  {"text": "Q2?", ...}  // Missing comma after first object
]

✅ Correct:
[
  {"text": "Q1?", ...},  // Comma here
  {"text": "Q2?", ...}
]
```

**Wrong Option Count:**
```json
❌ Wrong:
"options": ["A", "B", "C"]  // Only 3 options

✅ Correct:
"options": ["A", "B", "C", "D"]  // Must be 4
```

**Wrong correctOptionIndex:**
```json
❌ Wrong:
"correctOptionIndex": 4  // Options are 0-3, not 1-4!

✅ Correct:
"correctOptionIndex": 0  // For option A
"correctOptionIndex": 1  // For option B
"correctOptionIndex": 2  // For option C
"correctOptionIndex": 3  // For option D
```

### **3. Validation:**

The system validates:
- ✅ JSON syntax is correct
- ✅ All required fields present
- ✅ Exactly 4 options per question
- ✅ correctOptionIndex is 0-3
- ✅ marks is positive number
- ✅ difficulty is "easy", "medium", or "hard" (if provided)

If validation fails, you'll see specific error messages.

---

## 🔄 **Converting from Other Formats:**

### **From Excel/Google Sheets:**

1. **Create columns:** Question, Option A, Option B, Option C, Option D, Correct (0-3), Explanation, Marks, Subject, Difficulty

2. **Export as CSV**

3. **Use a CSV to JSON converter** (online tools available)

4. **Format to match structure** above

5. **Upload!**

### **From Word Document:**

1. Copy questions to text editor
2. Format as JSON manually (use example as template)
3. Copy-paste into bulk upload editor

### **From Another Platform:**

1. Export questions if possible
2. Convert to JSON format
3. Upload

---

## ⚠️ **Important Notes:**

### **Images:**
- 🚫 **Cannot upload images via JSON**
- ✅ Add images individually after bulk upload
- ✅ Or upload questions without images, then edit to add images

### **Duplicate Detection:**
- ❌ System does NOT check for duplicates
- ⚠️ Uploading same JSON twice will create duplicate questions
- ✅ Keep track of what you've uploaded

### **Undo:**
- ❌ No bulk undo feature (yet)
- ⚠️ Delete questions individually if needed
- ✅ Test with small batches first

---

## 📊 **Use Cases:**

### **1. Creating Practice Sets:**
```json
// 50 questions on "General Knowledge"
// Upload in one go
```

### **2. Previous Year Papers:**
```json
// SSC CGL 2023 questions
// All 100 questions at once
```

### **3. Subject-Specific Tests:**
```json
// 30 Math questions
// 20 Reasoning questions
// Upload separately with subject tags
```

### **4. Difficulty-Based:**
```json
// Easy: 20 questions
// Medium: 15 questions
// Hard: 10 questions
```

---

## 🎯 **Real World Example:**

**Scenario:** Creating an SSC CGL mock test

```json
[
  {
    "text": "The HCF of 12 and 18 is:",
    "options": ["2", "3", "6", "9"],
    "correctOptionIndex": 2,
    "explanation": "Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. HCF = 6",
    "marks": 2,
    "subject": "Quantitative Aptitude",
    "difficulty": "easy"
  },
  {
    "text": "Who is known as the Father of Indian Constitution?",
    "options": ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B.R. Ambedkar", "Sardar Patel"],
    "correctOptionIndex": 2,
    "explanation": "Dr. B.R. Ambedkar is known as the Father of the Indian Constitution.",
    "marks": 1,
    "subject": "General Awareness",
    "difficulty": "easy"
  },
  {
    "text": "Find the odd one out: 3, 7, 15, 31, 63",
    "options": ["3", "7", "31", "63"],
    "correctOptionIndex": 1,
    "explanation": "Pattern: 2^n - 1. 3(2^2-1), 7(2^3-1), 15(2^4-1), 31(2^5-1), 63(2^6-1). 7 breaks pattern.",
    "marks": 2,
    "subject": "General Intelligence",
    "difficulty": "medium"
  }
]
```

**Result:** 3 questions uploaded instantly!

---

## ✅ **Success Checklist:**

Before uploading, verify:

- [ ] JSON is valid (no syntax errors)
- [ ] All questions have required fields
- [ ] Each question has exactly 4 options
- [ ] correctOptionIndex is 0, 1, 2, or 3
- [ ] marks are positive numbers
- [ ] Subject names are consistent
- [ ] Explanations are helpful
- [ ] Tested with small batch first

---

## 🎓 **Pro Tips:**

1. **Start Small:** Upload 5 questions first to test
2. **Save Templates:** Keep JSON files for different subjects
3. **Version Control:** Name files: `ssc-math-v1.json`, `ssc-math-v2.json`
4. **Backup:** Keep copies of all JSON files
5. **Collaborate:** Share JSON files with team members
6. **Quality Check:** Review questions after upload
7. **Iterate:** Update and re-upload as needed

---

## 📞 **Troubleshooting:**

### **"Invalid JSON format"**
- Check for missing commas between objects
- Ensure all quotes are properly closed
- Use a JSON validator online

### **"Must have exactly 4 options"**
- Count your options array items
- Don't have trailing commas in arrays

### **"correctOptionIndex must be 0, 1, 2, or 3"**
- Remember: A=0, B=1, C=2, D=3
- Not 1-4!

### **"marks must be a positive number"**
- Use numbers, not strings: `2` not `"2"`
- Must be greater than 0

### **Upload succeeds but questions don't appear**
- Refresh the page
- Check Firebase Console → questions collection
- Verify examId matches

---

## 🚀 **Quick Start:**

1. **Click "📁 Bulk Upload JSON"**
2. **Click "Show Example JSON"**
3. **Click "Copy Example to Editor"**
4. **Edit the 3 sample questions**
5. **Click "Validate & Upload"**
6. **Done!** 🎉

---

**Ready to upload 100s of questions in minutes?** Start with the example and scale up! 📚✨
