# FinTrackr Admin Guide

## Overview

FinTrackr now includes comprehensive admin functionality with role-based access control (RBAC). This allows administrators to manage users, view statistics, and perform administrative tasks.

---

## User Roles

The system supports three user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| **USER** | Regular user | Can manage their own finances (accounts, transactions, budgets) |
| **ADMIN** | Administrator | Can view/manage all users, view platform statistics |
| **SUPER_ADMIN** | Super Administrator | Full access including changing user roles and deleting users |

---

## Admin Features

### 1. **Separate Admin Login** 🛡️

Admins use a dedicated login endpoint that validates admin role before allowing access.

**Endpoint**: `POST /api/auth/admin/login`

**Request**:
```json
{
  "email": "admin@fintrackr.com",
  "password": "your-secure-password"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@fintrackr.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "isEmailVerified": true,
      "createdAt": "2025-10-31T...",
      "updatedAt": "2025-10-31T..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note**: Only users with `ADMIN` or `SUPER_ADMIN` role can login through this endpoint. Regular users will be denied.

---

### 2. **View All Users** 👥

Get a paginated list of all users in the system with search and filtering.

**Endpoint**: `GET /api/admin/users`

**Headers**: `Authorization: Bearer <admin-token>`

**Query Parameters**:
- `page` (default: 1) - Page number
- `limit` (default: 20) - Users per page
- `search` - Search by email, firstName, or lastName
- `role` - Filter by role (USER, ADMIN, SUPER_ADMIN)
- `sortBy` (default: createdAt) - Sort field
- `order` (default: DESC) - Sort order (ASC or DESC)

**Example Request**:
```bash
GET /api/admin/users?page=1&limit=20&role=USER&search=john
```

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-1",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "USER",
        "isEmailVerified": true,
        "defaultCurrency": "USD",
        "language": "en",
        "theme": "light",
        "createdAt": "2025-10-31T...",
        "updatedAt": "2025-10-31T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

### 3. **View User Details** 🔍

Get detailed information about a specific user including their accounts, transactions, and budgets.

**Endpoint**: `GET /api/admin/users/:id`

**Headers**: `Authorization: Bearer <admin-token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "accounts": [...],
      "transactions": [...],
      "budgets": [...]
    }
  }
}
```

---

### 4. **Platform Statistics** 📊

View comprehensive platform statistics and metrics.

**Endpoint**: `GET /api/admin/stats`

**Headers**: `Authorization: Bearer <admin-token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalTransactions": 5430,
      "totalAccounts": 320,
      "totalBudgets": 180
    },
    "users": {
      "byRole": {
        "USER": 145,
        "ADMIN": 4,
        "SUPER_ADMIN": 1
      },
      "recentSignups": 23,
      "verifiedUsers": 130,
      "unverifiedUsers": 20
    }
  }
}
```

---

### 5. **Update User Role** 👑 (SUPER_ADMIN only)

Change a user's role.

**Endpoint**: `PATCH /api/admin/users/:id/role`

**Headers**: `Authorization: Bearer <super-admin-token>`

**Request**:
```json
{
  "role": "ADMIN"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "ADMIN",
      ...
    }
  }
}
```

**Restrictions**:
- Only SUPER_ADMIN can change roles
- Cannot change your own role
- Valid roles: USER, ADMIN, SUPER_ADMIN

---

### 6. **Manually Verify User Email** ✅

Manually verify a user's email address.

**Endpoint**: `PATCH /api/admin/users/:id/verify`

**Headers**: `Authorization: Bearer <admin-token>`

**Response**:
```json
{
  "success": true,
  "message": "User email verified successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "isEmailVerified": true,
      ...
    }
  }
}
```

---

### 7. **Delete User** 🗑️ (SUPER_ADMIN only)

Permanently delete a user and all their data.

**Endpoint**: `DELETE /api/admin/users/:id`

**Headers**: `Authorization: Bearer <super-admin-token>`

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Restrictions**:
- Only SUPER_ADMIN can delete users
- Cannot delete your own account
- Cascading deletion removes all user's accounts, transactions, budgets, etc.

---

## Creating the First Admin User

To create your first admin user, you'll need to:

### Option 1: Via Database (Recommended)

1. Register a normal user through the API:
```bash
POST /api/auth/register
{
  "email": "admin@fintrackr.com",
  "password": "SecurePassword123!",
  "firstName": "Admin",
  "lastName": "User"
}
```

2. Connect to your PostgreSQL database:
```bash
docker exec -it fintrackr-postgres psql -U fintrackr_user -d fintrackr_db
```

3. Update the user's role:
```sql
UPDATE users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'admin@fintrackr.com';
```

4. Verify the change:
```sql
SELECT id, email, "firstName", "lastName", role FROM users WHERE email = 'admin@fintrackr.com';
```

### Option 2: Via Seed Script

Create a seed file: `backend/src/scripts/createAdmin.ts`

```typescript
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../models/User";
import bcrypt from "bcryptjs";

async function createAdmin() {
  await AppDataSource.initialize();
  
  const userRepository = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash("AdminPassword123!", 12);
  
  const admin = userRepository.create({
    email: "admin@fintrackr.com",
    password: hashedPassword,
    firstName: "Super",
    lastName: "Admin",
    role: UserRole.SUPER_ADMIN,
    isEmailVerified: true,
  });
  
  await userRepository.save(admin);
  console.log("✅ Super admin created successfully");
  process.exit(0);
}

createAdmin();
```

Run: `ts-node backend/src/scripts/createAdmin.ts`

---

## Security Features

### 🔒 Authentication
- JWT tokens with role information
- Separate admin login endpoint
- Token expiration (7 days default)

### 🛡️ Authorization
- Role-based middleware (`requireAdmin`, `requireSuperAdmin`)
- Prevents admins from modifying their own role
- Prevents admins from deleting their own account

### 🔐 Data Protection
- Passwords never returned in API responses
- Bcrypt hashing with 12 salt rounds
- Rate limiting on all endpoints

---

## Admin API Summary

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/auth/admin/login` | POST | Public | Admin login |
| `/api/admin/users` | GET | ADMIN | List all users |
| `/api/admin/users/:id` | GET | ADMIN | Get user details |
| `/api/admin/stats` | GET | ADMIN | Platform statistics |
| `/api/admin/users/:id/verify` | PATCH | ADMIN | Verify user email |
| `/api/admin/users/:id/role` | PATCH | SUPER_ADMIN | Update user role |
| `/api/admin/users/:id` | DELETE | SUPER_ADMIN | Delete user |

---

## Testing Admin Endpoints

### Using cURL:

**1. Admin Login**:
```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fintrackr.com",
    "password": "AdminPassword123!"
  }'
```

**2. View All Users**:
```bash
curl -X GET "http://localhost:3001/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**3. Get Platform Stats**:
```bash
curl -X GET http://localhost:3001/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Database Schema Changes

The `users` table now includes:

```sql
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'USER' 
CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));
```

This change is handled automatically by TypeORM when the server starts.

---

## Best Practices

1. **Protect Admin Credentials**: Use strong passwords and store them securely
2. **Limit SUPER_ADMIN Accounts**: Only create one or two
3. **Regular Audits**: Monitor admin activity logs
4. **Use HTTPS**: Always use HTTPS in production
5. **Rotate Tokens**: Implement token refresh and rotation

---

## Need Help?

For questions or issues with admin functionality, check the main README or contact support.

