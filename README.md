# User Management Microservice

A reusable Node.js/Fastify microservice for user authentication and management.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT token generation and validation
- QR code authentication
- Google OAuth integration
- Device management
- Redis session management
- Profile image retrieval

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file with the following variables:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
```

## Usage

### As a Standalone Service

```bash
npm start
```

### As a Git Submodule

1. Add to your project:
```bash
git submodule add <repository-url> user-management
git submodule update --init --recursive
```

2. Install dependencies:
```bash
cd user-management
npm install
```

3. In your Fastify app:
```javascript
const userManagementRoutes = require('./user-management/routes/authRoutes');
app.register(userManagementRoutes, { prefix: '/user' });
```

## API Endpoints

- `POST /user/public/create` - Create new user
- `POST /user/public/login` - User login
- `POST /user/get/code` - Generate QR code for authentication
- `POST /user/login/code/:code` - Login with QR code
- `GET /user/get/image` - Get user profile image
- `POST /user/public/register` - Register with Google OAuth
- `GET /user/get/devices` - Get user devices
- `POST /user/delete/devices` - Remove devices

## Database Schema

Required users table:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  mobile VARCHAR(20),
  first_name VARCHAR(255),
  middle_name VARCHAR(255),
  last_name VARCHAR(255),
  profile_photo TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## License

MIT
