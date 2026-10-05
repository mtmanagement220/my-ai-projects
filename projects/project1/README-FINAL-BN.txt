MT MANAGEMENT PRO — FINAL ACCOUNTING VERSION

এই ভার্সনে বর্তমান Firebase Realtime Database ভিত্তিক অ্যাপের উপর নতুন Accounting Engine যোগ করা হয়েছে। পুরোনো ডাটা মুছে ফেলা হয় না।

নতুন ফিচার:
1. Product ও প্রতি-পিস মোট মূল্য সেটআপ
2. প্রতিটি Product-এর জন্য কর্মীভিত্তিক Rate
3. Daily Production: Product + Quantity দিলেই Worker Earnings অটো হিসাব
4. Worker Opening Balance: পুরোনো accounts bill-cost থেকে প্রথমবার নেওয়া হয়
5. Advance/খরচ এবং Payment আলাদা ledger transaction হিসেবে সংরক্ষণ
6. Previous Balance + নতুন কাজ - Advance/Payment = Current Balance
7. Realtime Notification Center
8. Browser Notification permission চালু করলে অ্যাপ খোলা থাকা অবস্থায় তাৎক্ষণিক notification
9. WhatsApp-এর জন্য কর্মীর নম্বরে pre-filled হিসাব message খুলে দেওয়ার ব্যবস্থা
10. Company Invoice ও Company Payment ledger
11. Saturday–Thursday weekly summary generator
12. পুরোনো worker/admin reports এবং login কাঠামো রাখা হয়েছে

গুরুত্বপূর্ণ:
- WhatsApp API এখানে জোর করে যোগ করা হয়নি; API ছাড়া সাধারণ WhatsApp account-এ server থেকে silent automatic message পাঠানো যায় না। এখানে one-tap WhatsApp message link আছে।
- Browser Push notification পুরোপুরি app বন্ধ থাকা অবস্থায় server-side push হিসেবে চালাতে Firebase Cloud Messaging service worker + server/Cloud Function setup দরকার। এই ZIP-এ client-side notification center রাখা হয়েছে যাতে বর্তমান Firebase setup না ভেঙে যায়।
- Firebase Realtime Database Rules অবশ্যই নিরাপদ করতে হবে। বর্তমান custom login client-side হওয়ায় নতুন করে production security hardening প্রয়োজন।
- Deploy করতে index.html, app.js, styles.css এবং এই README একই folder-এ রাখুন। Netlify/Firebase Hosting/অন্যান্য static hosting-এ চালানো যাবে।

প্রথমবার ব্যবহার:
1. Admin login করুন।
2. Product & Rate-এ Product A এবং মোট মূল্য (যেমন 400) দিন।
3. প্রত্যেক কর্মীর প্রতি-পিস rate দিন।
4. Daily Production-এ Product ও Quantity দিন।
5. Worker balance এবং notification তৈরি হবে।
6. Advance/Payment দিলে একইভাবে ledger ও notification তৈরি হবে।
7. Notification / Message থেকে weekly summary দেখুন এবং WhatsApp button ব্যবহার করুন।
