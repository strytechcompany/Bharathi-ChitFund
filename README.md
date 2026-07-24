# Bharathi-ChitFund
# Bharathi Chit Fund - Full Stack Application

A comprehensive web application for managing chit fund operations with modern features like real-time notifications, secure authentication, and a responsive user interface.

## 🚀 Features

- **User Authentication**: Secure login and registration with JWT-based authentication.
- **Chit Fund Management**: Create, join, and manage chit funds with different branches.
- **Branch Management**: Create and manage branches with unique branch codes.
- **Real-time Notifications**: Instant notifications for branch creation, user registration, and more.
- **Responsive UI**: Modern, mobile-first design using React and Tailwind CSS.
- **Admin Dashboard**: Centralized dashboard for managing users and branches.
- **Email Integration**: Automated email notifications for user verification and branch codes.

## 🛠️ Tech Stack

### Backend
- **Node.js** & **Express.js**: Web framework for building the API.
- **MongoDB**: NoSQL database for data storage.
- **Mongoose**: ODM for MongoDB.
- **JWT (JSON Web Tokens)**: Authentication and authorization.
- **Bcrypt.js**: Password hashing.
- **Nodemailer**: Email notifications.
- **Dotenv**: Environment variable management.

### Frontend
- **React**: UI library.
- **Vite**: Build tool and development server.
- **Tailwind CSS**: Utility-first CSS framework.
- **Axios**: HTTP client for API requests.
- **React Router DOM**: Client-side routing.
- **React Hot Toast**: Toast notifications.

## 📂 Project Structure

```
Bharathi-ChitFund/
├── backend/                # Node.js/Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware (auth, error handling)
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions (email, JWT)
│   ├── server.js           # Application entry point
│   └── package.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── App.jsx         # Main application component
│   │   ├── index.css       # Global styles
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (or **yarn**)
- **MongoDB** (local or cloud instance)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Bharathi-ChitFund
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### Running the Application

**Start the backend:**
```bash
cd backend
npm run dev
```

**Start the frontend:**
```bash
cd ../frontend
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## 📋 Usage

### Admin User
- **Email**: [EMAIL_ADDRESS]`
- **Password**: `admin123`

### Normal User
- Register a new account through the frontend.
- Verify your email to activate the account.

## 📂 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Branches
- `POST /api/branches` - Create a new branch (admin only)
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID

### Chits
- `POST /api/chits` - Create a new chit (admin only)
- `GET /api/chits` - Get all chits
- `GET /api/chits/:id` - Get chit by ID

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
