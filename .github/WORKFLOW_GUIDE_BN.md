# Project Audit Workflow — বাংলা নির্দেশিকা

## এই workflow কী করে

1. Pull Request খুললে বা আপডেট হলে GitHub Actions অডিট চালায়।
2. `projects/<project-name>/` ফোল্ডারের প্রজেক্ট ফাইল পরীক্ষা করে।
3. JSON, Python ও JavaScript-এর সীমিত syntax checks চালায়।
4. কনফিগার করা AI provider-গুলো দিয়ে সম্ভাব্য সমস্যা খোঁজে।
5. সমস্যা থাকলে সীমিত AI repair চেষ্টা করে; পরিবর্তনগুলো শুধু রান-এর অস্থায়ী working copy-তে হয়।
6. রিপোর্ট, লগ, এবং প্রস্তাবিত patch artifact হিসেবে দেয়।
7. **কোনো পরিবর্তন নিজে থেকে main-এ commit, merge বা deploy করে না।**

## প্রতিটি নতুন প্রজেক্ট কোথায় রাখবেন

উদাহরণ:

```text
projects/
  demo-app/
    index.html
    styles.css
    app.js
  customer-site-02/
    package.json
    src/
      ...
```

প্রতিটি আলাদা প্রজেক্টের জন্য আলাদা ফোল্ডার ব্যবহার করুন। `.env`, API key, password, service-account JSON বা অন্য secret GitHub-এ আপলোড করবেন না।

## নিরাপদে পরীক্ষা করার ধাপ

1. `main` থেকে নতুন branch তৈরি করুন।
2. প্রজেক্টটি `projects/<project-name>/`-এ আপলোড করুন।
3. সেই branch থেকে `main`-এ Pull Request খুলুন।
4. **Actions** ট্যাবে audit run সম্পূর্ণ হওয়া পর্যন্ত অপেক্ষা করুন।
5. Pull Request-এর Checks এবং workflow summary পড়ুন।
6. Actions run-এর Artifacts থেকে `project-audit-report-...` ডাউনলোড করে `report.md`, `final-static-check.txt`, `final-ai-audit.txt` এবং থাকলে `proposed-repair.patch` দেখুন।
7. কোনো required check fail করলে merge করবেন না। প্রস্তাবিত repair patch-কে নিজে যাচাই না করে গ্রহণ করবেন না।
8. সব সমস্যা সমাধান, checks pass, এবং আপনার অনুমোদনের পরেই merge করুন।

## GitHub Secrets

AI audit চালাতে অন্তত একটি provider-এর valid API key GitHub repository-এর **Settings → Secrets and variables → Actions → New repository secret** থেকে যোগ করতে হবে:

- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `OPENROUTER_API_KEY`

একাধিক provider ব্যবহার করলে সবগুলোর key দিতে পারেন। কোনো key কোড, README, issue বা report-এ লিখবেন না। ঐচ্ছিক Gmail notification এই সংস্করণে বাদ রাখা হয়েছে, যাতে প্রথমে মূল audit flow স্থিতিশীল করা যায়।

## Production deployment সম্পর্কে জরুরি কথা

এই workflow Production deploy করে না। কিন্তু Netlify-তে `main` branch auto-publish চালু থাকলে `main`-এ merge হলেই deploy হতে পারে। নিরাপদভাবে ব্যবহার করতে Netlify-তে production branch/auto-publish সেটিং যাচাই করুন; সম্ভব হলে আলাদা preview branch ও manual production publish ব্যবহার করুন। GitHub Actions-এর এই ফাইল একা Netlify-র সেটিং পরিবর্তন করতে পারে না।

## বর্তমান পরীক্ষার সীমা

- সব framework-এর build/test স্বয়ংক্রিয়ভাবে চালানো হয় না।
- JavaScript syntax check-এর জন্য Node.js ব্যবহার করা হয়, কিন্তু TypeScript/React/Vue/Flutter/Java ইত্যাদির প্রকৃত build-এর জন্য প্রজেক্টভিত্তিক test command যোগ করতে হবে।
- AI review ভুল করতে পারে বা সমস্যা বাদ দিতে পারে। `PASSED` মানে কেবল বর্তমান checks পাস করেছে—সম্পূর্ণ নিরাপদ বা bug-free হওয়ার নিশ্চয়তা নয়।
- Pull Request run-এ API secrets ব্যবহারের GitHub security সীমাবদ্ধতা থাকতে পারে। Fork থেকে আসা PR-এ secrets সাধারণত পাওয়া যায় না; এ অবস্থায় AI audit fail হওয়া প্রত্যাশিত নিরাপত্তা আচরণ।

## ফাইলগুলোর ভূমিকা

- `.github/workflows/ai-checker.yml` — কখন workflow চলবে এবং রিপোর্ট কীভাবে তৈরি হবে।
- `.github/scripts/static_check.py` — deterministic syntax checks।
- `.github/scripts/review.py` — AI audit ও status যাচাই।
- `.github/scripts/auto_fix.py` — `projects/`-এর মধ্যে সীমাবদ্ধ AI repair।
- `projects/` — ব্যবহারকারীর প্রজেক্ট রাখার জায়গা।
