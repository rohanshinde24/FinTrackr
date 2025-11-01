# Quick Start - Admin Features

## 🚀 Admin Functionality Summary

Your FinTrackr now has **complete admin functionality** with role-based access control!

---

## 📋 What's New

### ✅ User Roles
- **USER** - Regular users (default)
- **ADMIN** - Administrators (can view/manage users)
- **SUPER_ADMIN** - Super administrators (full control)

### ✅ Features Implemented

1. **Separate Admin Login** - `/api/auth/admin/login`
2. **View All Users** - Paginated, searchable, filterable
3. **User Details** - See individual user data
4. **Platform Statistics** - Dashboard metrics
5. **Manage User Roles** - Promote/demote users (SUPER_ADMIN only)
6. **Verify Users** - Manually verify emails
7. **Delete Users** - Remove users (SUPER_ADMIN only)

---

## 🎯 Quick Test Guide

### Step 1: Create Your First Admin User

**Method 1: Via Database (Quickest)**

```bash
# Connect to PostgreSQL
docker exec -it fintrackr-postgres psql -U fintrackr_user -d fintrackr_db

# First, register a normal user via API
# Then run this SQL:
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'your-email@example.com';

# Verify
SELECT email, role FROM users WHERE email = 'your-email@example.com';

# Exit
\q
```

**Method 2: Register + Manual Update**

1. Register via API:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fintrackr.com",
    "password": "AdminPass123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

2. Update role in database (see Method 1)

---

### Step 2: Test Admin Login

```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fintrackr.com",
    "password": "AdminPass123!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@fintrackr.com",
      "role": "SUPER_ADMIN",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token!** You'll need it for admin requests.

---

### Step 3: View All Users

```bash
# Replace YOUR_ADMIN_TOKEN with the token from Step 2
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### Step 4: Get Platform Statistics

```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🔑 Admin API Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/api/auth/admin/login` | POST | Public | Admin login only |
| `/api/admin/users` | GET | ADMIN | List all users |
| `/api/admin/users/:id` | GET | ADMIN | Get user details |
| `/api/admin/stats` | GET | ADMIN | Platform statistics |
| `/api/admin/users/:id/verify` | PATCH | ADMIN | Verify user email |
| `/api/admin/users/:id/role` | PATCH | SUPER_ADMIN | Change user role |
| `/api/admin/users/:id` | DELETE | SUPER_ADMIN | Delete user |

---

## 🗄️ Database Schema Update

The `users` table now has a `role` column:

```sql
users
├── id (UUID)
├── email
├── password
├── firstName
├── lastName
├── role (USER | ADMIN | SUPER_ADMIN)  ← NEW!
├── isEmailVerified
├── ...
```

---

## 🧪 Testing Scenarios

### Test 1: Regular User Cannot Access Admin Endpoints
```bash
# Login as regular user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Try to access admin endpoint (should fail with 403)
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: 403 Forbidden - "Admin access required"
```

### Test 2: Regular User Cannot Use Admin Login
```bash
# Try admin login with regular user
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Expected: 403 Forbidden - "Admin access denied"
```

### Test 3: ADMIN Cannot Change Roles (Only SUPER_ADMIN Can)
```bash
# Login as ADMIN (not SUPER_ADMIN)
# Try to change user role (should fail with 403)
curl -X PATCH http://localhost:3001/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'

# Expected: 403 Forbidden - "Super admin access required"
```

---

## 📊 Sample Admin Queries

### Search for users by name
```bash
curl -X GET "http://localhost:3001/api/admin/users?search=john" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Filter by role
```bash
curl -X GET "http://localhost:3001/api/admin/users?role=USER" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Sort by email
```bash
curl -X GET "http://localhost:3001/api/admin/users?sortBy=email&order=ASC" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Combine filters
```bash
curl -X GET "http://localhost:3001/api/admin/users?search=john&role=USER&page=1&limit=5" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🛡️ Security Features

✅ **Separate Admin Login** - Different endpoint than regular users  
✅ **Role Validation** - Checked at middleware level  
✅ **Token-Based Auth** - JWT with role information  
✅ **Self-Protection** - Admins can't modify their own role/delete themselves  
✅ **Tiered Access** - USER < ADMIN < SUPER_ADMIN  

---

## 📝 Common Admin Tasks

### Promote User to Admin
```bash
curl -X PATCH http://localhost:3001/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'
```

### Verify User's Email
```bash
curl -X PATCH http://localhost:3001/api/admin/users/USER_ID/verify \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### View Specific User
```bash
curl -X GET http://localhost:3001/api/admin/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## 🔍 Need More Info?

See **ADMIN_GUIDE.md** for complete documentation including:
- Detailed API specs
- Security best practices
- Database migration guide
- Troubleshooting tips

---

## ✅ Your System is Now Ready!

**What You Have:**
- ✅ Full-stack finance tracker
- ✅ 90% backend test coverage
- ✅ WCAG accessibility
- ✅ Admin dashboard & user management
- ✅ Role-based access control
- ✅ Docker containerization
- ✅ GitHub Actions CI/CD
- ✅ Azure deployment configs

**Perfect for your resume!** 🎉

