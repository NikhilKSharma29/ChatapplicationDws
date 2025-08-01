# AI Chat Application

A modern, responsive chat application built with Next.js and OpenAI's API, featuring real-time messaging, emoji support, and toast notifications.

## 🚀 Features

- Real-time chat interface
- Emoji picker for expressive messaging
- Responsive design for desktop and mobile
- Toast notifications for user feedback
- Clean and modern UI with smooth animations
- Powered by OpenAI's advanced language models
- Docker containerization for easy development and deployment
- CI/CD pipeline with GitHub Actions
- Mock server for development and testing

## 🛠 Tech Stack

- **Frontend Framework**: [Next.js 15](https://nextjs.org/)
- **UI Components**: React 19
- **Styling**: Tailwind CSS
- **Icons**: Hero Icons & React Icons
- **State Management**: React Hooks
- **Date Handling**: date-fns
- **Emoji Support**: emoji-mart
- **Notifications**: react-hot-toast
- **AI Integration**: OpenAI API
- **Containerization**: Docker
- **CI/CD**: GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Node.js 20.0 or later
- npm or yarn
- Docker & Docker Compose
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NikhilKSharma29/Chat-appDws
   cd aichat-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

### Development with Docker (Recommended)

1. Start the development environment with Docker Compose:
   ```bash
   docker-compose up
   ```
   This will start:
   - Next.js app on http://localhost:3000
   - Mock JSON server on http://localhost:3001

2. For production build:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build
   ```

### Development without Docker

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🚀 CI/CD Pipeline

The project includes a GitHub Actions workflow that runs on every push to `main` or `develop` branches and on pull requests. The pipeline includes:

- Linting checks
- Tests (if configured)
- Build verification
- Docker image build and push (on main/develop branches)

### Required Secrets for CI/CD

For the Docker image push to work, you need to set these secrets in your GitHub repository:
- `DOCKERHUB_USERNAME`: Your Docker Hub username
- `DOCKERHUB_TOKEN`: Your Docker Hub access token

## 🐳 Production Deployment

### Using Docker

1. Build the production image:
   ```bash
   docker build -t your-username/chat-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -e OPENAI_API_KEY=your_key your-username/chat-app
   ```

### Using Docker Compose (Production)

1. Create a `docker-compose.prod.yml` file with your production settings
2. Run:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 📱 Screenshots

### Desktop View
![Desktop View](/public/desktop.png)

### Tablet View
![Tablet View](/public/tab.png)

### Mobile View
![Mobile View](/public/mobile.png)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Icons by [Hero Icons](https://heroicons.com/)
- Emoji support by [emoji-mart](https://github.com/missive/emoji-mart)
