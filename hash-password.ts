import * as bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);

  console.log('='.repeat(60));
  console.log('🔐 Password Hash Generator');
  console.log('='.repeat(60));
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('='.repeat(60));
  console.log('\n📋 SQL Query to create admin:\n');
  console.log(`INSERT INTO "users" 
  ("email", "password_hash", "role", "status", "is_verified", "email_verified_at", "created_at", "updated_at") 
VALUES 
  ('admin@topjob.com', '${hash}', 'admin', 'active', true, NOW(), NOW(), NOW());
`);
  console.log('='.repeat(60));
}

const password = process.argv[2] || 'Admin@123';
hashPassword(password).catch(console.error);
