# Wrexer Control Plane

This is the frontend dashboard for the Wrexer Platform-as-a-Service (PaaS). It provides a user interface for managing applications, viewing billing information, and configuring your platform settings.

## 🚀 Features

- **Dashboard**: Centralized view of your applications and platform status.
- **Authentication**: Seamless Google Sign-In integration.
- **Application Management**: Create, update, and monitor your deployed applications.
- **Billing**: Detailed billing dashboard with insights into cost and usage.
- **User Settings**: Manage API keys and profile information.
- **Responsive Design**: Fully responsive interface using Tailwind CSS.

## 🛠️ Tech Stack

- **Framework**: React (v19)
- **Engine**: Vite (v7)
- **Styling**: Tailwind CSS (v4)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Router**: React Router DOM (v7)

## 📋 Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

## 🔧 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd control-plane-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory. Key variables may include:
   - `VITE_API_URL`: URL of the backend API

4. **Run Locally**
   
   **Development Mode** (with hot-reload):
   ```bash
   npm run dev
   ```

   **Production Build**:
   ```bash
   npm run build
   ```

   **Preview Build**:
   ```bash
   npm run preview
   ```

## 🐳 Docker Deployment

To build and run the application using Docker:

```bash
# Build the image
docker build -t wrexer-frontend .

# Run the container
docker run -p 80:80 --env-file .env wrexer-frontend
```

## 📁 Project Structure

```
src/
├── api/            # API integration modules
├── components/     # Reusable UI components
├── context/        # React Context providers (Auth, Theme, etc.)
├── pages/          # Main application pages (Dashboard, Billing, Landing)
├── App.jsx         # Main application component & routing
└── main.jsx        # Entry point
```

## 📄 Key Pages

- **Landing**: Public-facing landing page.
- **Dashboard**: Authenticated user dashboard.
- **Billing**: Subscription and usage details.
- **Information**: Terms (`/terms`), Privacy (`/p-info`), Refund (`/r-info`).

## 📜 License

See the LICENSE file for details.
