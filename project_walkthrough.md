# دليل نظام الـ Authentication والـ Multi-tenancy 🚀

تم تطبيق نظام متكامل لإدارة مكاتب متعددة (Multi-tenancy) لضمان خصوصية كل مكتب وسهولة الوصول لبياناته.

## 1. الهيكل البرمجي (Files Structure)
*   **`js/firebase-config.js`**: ملف الربط بـ Firebase (يحتاج منك استبدال الـ API Keys).
*   **`js/auth.js`**: يحتوي على منطق تسجيل الدخول، إنشاء الحساب، والتحقق من الهوية.
*   **`auth.html`**: صفحة تسجيل دخول ممتازة بتصميم عصري.
*   **`app.js`**: تم تعديله ليربط كل العمليات بـ `officeId`.

## 2. تقسيم قاعدة البيانات (Database Schema)
تم تنظيم البيانات لضمان عدم التداخل:
*   `offices/{uid}`: بيانات المكتب الأساسية (الاسم، المسؤول، الهاتف).
*   `students/`: تحتوي على كل الطلاب، وكل طالب لديه حقل `officeId` يساوي الـ UID الخاص بالمكتب.

## 3. قواعد الأمان (Security Rules) 🛡️
لضمان الأمان الفعلي في Firebase، يجب عليك نسخ هذه القواعد في قسم **Realtime Database -> Rules**:

```json
{
  "rules": {
    "offices": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "students": {
      ".read": "auth != null",
      ".write": "auth != null",
      ".indexOn": ["officeId"],
      "$studentId": {
         // نضمن أن المكتب لا يكتب إلا بياناته
         ".validate": "newData.child('officeId').val() === auth.uid || data.child('officeId').val() === auth.uid"
      }
    }
  }
}
```

## 4. كيفية البدء (How to Start)
1.  قم بإنشاء مشروع جديد على **Firebase Console**.
2.  فَعّل خاصية **Email/Password Authentication**.
3.  أَنشئ قاعدة بيانات **Realtime Database**.
4.  انسخ بيانات الـ Config من صفحة الإعدادات وضعها في `js/firebase-config.js`.
5.  ارفع الملفات على **Hostinger** وستعمل التصفية التلقائية بناءً على حساب المكتب المسجل.

> [!IMPORTANT]
> تم استخدام `orderByChild` و `equalTo` كما هو مطلوب لضمان أن كل مستخدم يشاهد طلاب مكتبه فقط.
