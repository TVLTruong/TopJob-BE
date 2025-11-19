# 📚 TypeORM Migrations Guide - TopJob Backend

## 🎯 Tổng quan

Migration là **version control cho database schema** - giúp quản lý và đồng bộ cấu trúc database giữa các môi trường (development, staging, production) một cách an toàn.

## ⚠️ Tại sao cần Migration?

### ❌ Vấn đề với `synchronize: true`

```typescript
// NGUY HIỂM trong Production!
synchronize: true; // TypeORM tự động ALTER/DROP tables
```

**Rủi ro:**

- 🔴 **Mất dữ liệu** khi đổi tên/xóa column
- 🔴 Không có **version control**
- 🔴 Không **rollback** được
- 🔴 Team không biết ai thay đổi gì, khi nào

### ✅ Giải pháp với Migration

```typescript
// AN TOÀN và KIỂM SOÁT
synchronize: false; // Tắt auto-sync
// Dùng migration files để quản lý schema changes
```

---

## 🛠️ Setup đã hoàn thành

### 1. **Data Source Configuration** (`src/database/data-source.ts`)

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  // ... connection config
  synchronize: false, // ← Tắt auto-sync
  entities: [join(__dirname, 'entities', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '**', '*.{ts,js}')],
  migrationsTableName: 'migrations',
});
```

### 2. **NPM Scripts** (package.json)

```json
{
  "scripts": {
    "migration:generate": "npm run typeorm -- migration:generate",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:run": "npm run typeorm -- migration:run",
    "migration:revert": "npm run typeorm -- migration:revert",
    "migration:show": "npm run typeorm -- migration:show"
  }
}
```

---

## 🚀 Cách sử dụng Migrations

### **1️⃣ Tạo Migration đầu tiên (Initial Schema)**

Tạo migration từ tất cả entities hiện có:

```bash
npm run migration:generate src/database/migrations/InitialSchema
```

**TypeORM sẽ:**

- ✅ So sánh **Entities (code)** vs **Database (tables hiện tại)**
- ✅ Tạo file migration với SQL tạo tất cả tables
- ✅ File được đặt tên: `1732012345678-InitialSchema.ts`

**Example output:**

```typescript
export class InitialSchema1732012345678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng users
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "email" VARCHAR(255) NOT NULL UNIQUE,
                "password_hash" VARCHAR(255) NOT NULL,
                "role" VARCHAR(50) NOT NULL,
                "status" VARCHAR(50) NOT NULL,
                -- ... more columns
            )
        `);

    // Tạo bảng candidates
    await queryRunner.query(`
            CREATE TABLE "candidates" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL UNIQUE,
                "full_name" VARCHAR(255) NOT NULL,
                -- ... more columns
                CONSTRAINT "fk_candidate_user" 
                    FOREIGN KEY ("user_id") REFERENCES "users"("id") 
                    ON DELETE CASCADE
            )
        `);

    // ... tất cả các tables khác
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: DROP tables
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TABLE "users"`);
    // ... drop all tables
  }
}
```

### **2️⃣ Chạy Migration**

```bash
npm run migration:run
```

**Output:**

```
query: SELECT * FROM "migrations"
query: BEGIN TRANSACTION
query: CREATE TABLE "users" ...
query: CREATE TABLE "candidates" ...
query: INSERT INTO "migrations" VALUES (...)
query: COMMIT
Migration InitialSchema1732012345678 has been executed successfully.
```

### **3️⃣ Kiểm tra Migrations đã chạy**

```bash
npm run migration:show
```

**Output:**

```
 [X] InitialSchema1732012345678
 [ ] NextMigration1732012345679  ← Chưa chạy
```

---

## 📝 Quy trình làm việc thực tế

### **Scenario 1: Thêm field mới vào Entity**

**Step 1:** Sửa Entity

```typescript
// src/database/entities/user.entity.ts
@Entity('users')
export class User {
  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string; // ← FIELD MỚI
}
```

**Step 2:** Generate migration

```bash
npm run migration:generate src/database/migrations/AddPhoneToUser
```

**Step 3:** Review migration file

```typescript
export class AddPhoneToUser1732012345679 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "phone" VARCHAR(20)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "phone"
        `);
  }
}
```

**Step 4:** Run migration

```bash
npm run migration:run
```

**Step 5:** Commit vào Git

```bash
git add src/database/migrations/
git add src/database/entities/user.entity.ts
git commit -m "feat: add phone field to User entity"
git push
```

---

### **Scenario 2: Tạo Migration thủ công (Custom SQL)**

Dùng khi cần:

- ✅ Thêm indexes
- ✅ Insert seed data
- ✅ Tạo stored procedures
- ✅ Custom SQL logic

```bash
npm run migration:create src/database/migrations/AddIndexes
```

**Edit file được tạo:**

```typescript
export class AddIndexes1732012345680 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Thêm indexes để tối ưu performance
    await queryRunner.query(`
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_users_status ON users(status);
            CREATE INDEX idx_candidates_user_id ON candidates(user_id);
        `);

    // Seed admin user (optional)
    await queryRunner.query(`
            INSERT INTO users (email, password_hash, role, status)
            VALUES ('admin@topjob.com', '$2b$10$...', 'ADMIN', 'ACTIVE');
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_users_email;`);
    await queryRunner.query(`DROP INDEX idx_users_status;`);
    await queryRunner.query(`DROP INDEX idx_candidates_user_id;`);
  }
}
```

---

## 🔄 Migration trong Team Workflow

```
Developer A (Local)
  ↓
1. Sửa Entity → Thêm column "phone"
  ↓
2. Generate migration
   npm run migration:generate src/database/migrations/AddPhoneColumn
  ↓
3. Run migration locally
   npm run migration:run
  ↓
4. Test → OK
  ↓
5. Commit migration file + entity changes
   git commit -m "feat: add phone to User"
  ↓
6. Push to repository
   git push

────────────────────────────────────────────

Developer B (Pull latest code)
  ↓
7. Pull code từ repository
   git pull
  ↓
8. Chạy migrations mới
   npm run migration:run
  ↓
9. Database của B giống với A ✅

────────────────────────────────────────────

Production Server
  ↓
10. Deploy code mới
  ↓
11. Backup database (QUAN TRỌNG!)
    pg_dump topjob_db > backup_$(date +%Y%m%d).sql
  ↓
12. Run migrations
    npm run migration:run
  ↓
13. Verify → OK
  ↓
14. Service restart
```

---

## ⚠️ Rollback Migration

Nếu có lỗi sau khi chạy migration:

```bash
# Rollback migration gần nhất
npm run migration:revert
```

**Lưu ý:**

- ✅ Chỉ rollback 1 migration mỗi lần
- ✅ Rollback theo thứ tự **ngược lại** (LIFO)
- ✅ Luôn backup database trước khi chạy migration production

---

## 📊 Migration Table trong Database

TypeORM tạo bảng `migrations` để tracking:

```sql
SELECT * FROM migrations ORDER BY id DESC;
```

**Output:**

```
id | timestamp     | name
1  | 1732012345678 | InitialSchema1732012345678
2  | 1732012345679 | AddPhoneToUser1732012345679
3  | 1732012345680 | AddIndexes1732012345680
```

**TypeORM dùng bảng này để:**

- ✅ Biết migration nào đã chạy
- ✅ Chỉ chạy migration chưa execute
- ✅ Rollback đúng thứ tự

---

## ✅ Best Practices

### **DO:**

```bash
# 1. Luôn tắt synchronize trong production
synchronize: false

# 2. Generate migration sau khi thay đổi entity
npm run migration:generate src/database/migrations/DescriptiveName

# 3. Review migration trước khi commit
cat src/database/migrations/*-DescriptiveName.ts

# 4. Test migration trên DB local/staging trước
npm run migration:run       # Test
npm run migration:revert    # Rollback test
npm run migration:run       # Test lại

# 5. Backup DB trước khi run production
pg_dump topjob_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 6. Tên migration rõ ràng, mô tả đúng thay đổi
AddEmailVerificationToUsers
RemoveDeprecatedColumnsFromJobs
CreateJobCategoriesTable
```

### **DON'T:**

```bash
# ❌ 1. KHÔNG sửa migration đã chạy production
# → Tạo migration mới để fix thay vì edit cũ

# ❌ 2. KHÔNG xóa migration files
# → Team khác và production server cần chúng

# ❌ 3. KHÔNG dùng synchronize: true trong production
# → Nguy cơ mất data cao

# ❌ 4. KHÔNG commit code mà thiếu migration
# → Database structure sẽ không khớp với entities

# ❌ 5. KHÔNG quên commit cả entity và migration
git add src/database/entities/
git add src/database/migrations/
git commit -m "Complete change"
```

---

## 🐛 Troubleshooting

### **Issue 1: Migration generates empty file**

**Nguyên nhân:** TypeORM không phát hiện thay đổi

**Solution:**

```bash
# Check entity có được import đúng không
# Check dataSource config có đúng entities path
# Xóa folder dist/ và build lại
rm -rf dist/
npm run build
npm run migration:generate src/database/migrations/MyMigration
```

### **Issue 2: `migrations` table not found**

**Nguyên nhân:** Chưa chạy migration lần đầu

**Solution:**

```bash
# Run migration để tạo bảng migrations
npm run migration:run
```

### **Issue 3: Migration chạy lỗi**

**Nguyên nhân:** SQL syntax error hoặc constraint violation

**Solution:**

```bash
# 1. Check logs để xem lỗi cụ thể
npm run migration:run

# 2. Rollback migration
npm run migration:revert

# 3. Fix SQL trong migration file
# 4. Run lại
npm run migration:run
```

---

## 📁 Cấu trúc thư mục Migration

```
src/database/
├── entities/
│   ├── user.entity.ts
│   ├── candidate.entity.ts
│   ├── employer.entity.ts
│   ├── job.entity.ts
│   └── ...
│
├── migrations/
│   ├── 1732012345678-InitialSchema.ts
│   ├── 1732012345679-AddPhoneToUser.ts
│   ├── 1732012345680-AddIndexes.ts
│   └── ...
│
├── data-source.ts        ← DataSource config
└── database.module.ts
```

---

## 🎓 Commands Cheat Sheet

```bash
# Generate migration từ entity changes
npm run migration:generate src/database/migrations/MigrationName

# Tạo migration rỗng (custom SQL)
npm run migration:create src/database/migrations/MigrationName

# Chạy tất cả migrations chưa execute
npm run migration:run

# Rollback migration gần nhất
npm run migration:revert

# Xem danh sách migrations và status
npm run migration:show
```

---

## 📚 Tài liệu tham khảo

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [NestJS Database Documentation](https://docs.nestjs.com/techniques/database)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

## 🆘 Liên hệ

Nếu gặp vấn đề với migrations, liên hệ team lead hoặc tạo issue trên GitHub repository.

---

**✅ Migration setup hoàn tất! Bắt đầu sử dụng ngay:**

```bash
npm run migration:generate src/database/migrations/InitialSchema
npm run migration:run
```
