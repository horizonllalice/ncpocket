# Expense Tracker with Supabase

แอปจัดการเงินแบบ 60/20/20 ที่ใช้ Supabase เป็นฐานข้อมูล

## การติดตั้งและตั้งค่า

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Supabase

1. สร้างโปรเจค Supabase ใหม่ที่ [https://supabase.com](https://supabase.com)
2. ไปที่ Settings > API เพื่อดู URL และ API Keys
3. คัดลอกไฟล์ `.env.local.example` เป็น `.env.local`:

```bash
cp .env.local.example .env.local
```

4. แก้ไขไฟล์ `.env.local` และใส่ข้อมูล Supabase ของคุณ:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. สร้างฐานข้อมูล

1. ไปที่ Supabase Dashboard > SQL Editor
2. คัดลอกเนื้อหาจากไฟล์ `supabase/schema.sql` และรันใน SQL Editor
3. รันไฟล์ `scripts/setup-default-data.sql` เพื่อสร้างข้อมูลเริ่มต้น (หรือใช้ `scripts/setup-default-data-safe.sql` หากต้องการรันซ้ำได้)

หรือใช้ Supabase CLI:

```bash
# ติดตั้ง Supabase CLI
npm install -g supabase

# เชื่อมต่อกับโปรเจค
supabase link --project-ref your-project-ref

# รัน migration
supabase db push
```

**หมายเหตุ**: หากเจอ error เกี่ยวกับ ON CONFLICT ให้ใช้ไฟล์ `scripts/setup-default-data.sql` แทน

### 4. รันแอปพลิเคชัน

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## โครงสร้างฐานข้อมูล

### ตารางหลัก

- **users**: ข้อมูลผู้ใช้ (สำหรับการรองรับหลายผู้ใช้ในอนาคต)
- **budget_settings**: การตั้งค่าเปอร์เซ็นต์การแบ่งเงิน (60/20/20)
- **income_records**: บันทึกรายรับ
- **fixed_expense_categories**: หมวดหมู่ค่าใช้จ่ายคงที่
- **fixed_expense_subitems**: รายการย่อยของค่าใช้จ่ายคงที่
- **fixed_expense_transactions**: ธุรกรรมค่าใช้จ่ายคงที่
- **variable_expenses**: ค่าใช้จ่ายแปรผัน
- **wants_transactions**: ธุรกรรมความต้องการ
- **savings_transactions**: ธุรกรรมการออม
- **daily_food_transactions**: ธุรกรรมค่าอาหารรายวัน

### ฟีเจอร์หลัก

1. **การจัดการรายรับ**: บันทึกรายรับและแบ่งเงินอัตโนมัติตามเปอร์เซ็นต์ที่ตั้งไว้
2. **ค่าใช้จ่ายคงที่**: จัดการค่าใช้จ่ายประจำ เช่น ค่าเช่า ค่าไฟ ค่าน้ำ
3. **รายการย่อย**: แบ่งค่าใช้จ่ายคงที่เป็นรายการย่อยได้
4. **ค่าใช้จ่ายแปรผัน**: บันทึกค่าใช้จ่ายที่ไม่คงที่
5. **การออมและลงทุน**: ติดตามเงินออมและการลงทุน
6. **ความต้องการ**: จัดการเงินสำหรับสิ่งที่อยากได้
7. **ประวัติการทำธุรกรรม**: ดูประวัติการเพิ่มเงินในแต่ละหมวด
8. **การตั้งค่าเปอร์เซ็นต์**: ปรับเปอร์เซ็นต์การแบ่งเงินได้ตามต้องการ

## การใช้งาน

### การเริ่มต้น

1. ตั้งเป้าหมายรายรับรายเดือน
2. ปรับเปอร์เซ็นต์การแบ่งเงิน (ค่าเริ่มต้น 60/20/20)
3. เพิ่มหมวดหมู่ค่าใช้จ่ายคงที่และตั้งเป้าหมาย

### การบันทึกรายรับ

เมื่อมีรายรับ ระบบจะแบ่งเงินอัตโนมัติ:
- ความจำเป็น (60%): สำหรับค่าใช้จ่ายคงที่และอาหาร
- ความต้องการ (20%): สำหรับสิ่งที่อยากได้
- การออม (20%): สำหรับอนาคต

### การจัดการค่าใช้จ่าย

1. **ค่าใช้จ่ายคงที่**: เพิ่มเงินเข้าหมวดต่างๆ เช่น ค่าเช่า ค่าไฟ
2. **ค่าใช้จ่ายแปรผัน**: บันทึกค่าใช้จ่ายที่ไม่คงที่ เช่น ค่าเดินทาง ค่าซื้อของ

## การพัฒนา

### โครงสร้างไฟล์

```
expense-tracker/
├── lib/
│   ├── supabase.js          # การตั้งค่า Supabase client
│   └── database.js          # ฟังก์ชันจัดการฐานข้อมูล
├── pages/
│   └── index.js             # หน้าหลักของแอป
├── supabase/
│   └── schema.sql           # โครงสร้างฐานข้อมูล
├── .env.local.example       # ตัวอย่างไฟล์ environment variables
└── README.md
```

### การเพิ่มฟีเจอร์ใหม่

1. เพิ่มฟังก์ชันฐานข้อมูลใน `lib/database.js`
2. อัปเดต UI ใน `pages/index.js`
3. เพิ่มตารางใหม่ใน `supabase/schema.sql` หากจำเป็น

## การแก้ไขปัญหา

### ปัญหาการเชื่อมต่อฐานข้อมูล

1. ตรวจสอบ URL และ API Key ใน `.env.local`
2. ตรวจสอบว่าได้รันสคริปต์สร้างตารางแล้ว
3. ตรวจสอบ RLS policies ใน Supabase Dashboard

### ปัญหาการแสดงผล

1. ตรวจสอบ console ในเบราว์เซอร์
2. ตรวจสอบ Network tab สำหรับ API calls
3. ตรวจสอบ Supabase logs ใน Dashboard

## การ Deploy

### Vercel (แนะนำ)

1. Push โค้ดไปยัง GitHub
2. เชื่อมต่อ repository กับ Vercel
3. เพิ่ม environment variables ใน Vercel dashboard
4. Deploy

### อื่นๆ

สามารถ deploy ไปยัง platform อื่นๆ ที่รองรับ Next.js ได้ เช่น Netlify, Railway, หรือ self-hosted

## License

MIT License
