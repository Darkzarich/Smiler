<div align="center">
   <img src="logo.png"/>
</div>

# Smiler

### [Demo](https://smiler.darkzarich.com/posts/all)

## Table of Contents

- [Key Features](#key-features)
  - [Common Features](#common-features)
  - [Backend Key Features](#backend-key-features)
  - [Frontend Key Features](#frontend-key-features)
- [Motivation](#motivation)
- [Get Involved](#get-involved)
- [Requirements](#requirements)
- [How to Run It](#how-to-run-it)
  - [Prerequisites](#prerequisites)
  - [Option 1: Running Without Docker](#option-1-running-without-docker)
  - [Option 2: Running with Docker](#option-2-running-with-docker)
  - [Option 3: Running with Docker Compose (All-in-One)](#option-3-running-with-docker-compose-all-in-one)
- [Building Images](#building-images)

## Key Features

This project is built on the MEVN stack (MongoDB, Express, Vue.js, Node.js) and is a Single Page Application (SPA) inspired by platforms like Reddit and 9gag. Below are the key features that make this project stand out:

### Common Features

- **Containerized with Docker**: The project is fully containerized using Docker, and the `docker-compose` setup is highly flexible. It can also run without Docker if needed.

### Backend Key Features

- **General**:

  - **Clustering**: If an exception occurs on the server, the app won't crash. Instead, another instance will be spawned to keep the application running.
  - **CORS Protection**: The API restricts access to allowed domains via environment variables.
  - **Logging**: Every request is logged using [Winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan). Logs are also saved to a file for debugging and monitoring.
  - **Integration Testing**: The backend is rigorously tested with **integration tests** to ensure real-world functionality. These tests verify that ORM functions interact correctly with the database, API endpoints return the expected data, and dependencies (e.g., ORM, middleware) work as intended, even after updates. -

- **Posts**:

  - **Creating Posts**: Users can create posts with a slug generated from the title. Posts are composed of "sections," which can be text, pictures, picture links, or video links. Sections retain their order in the database, and users can add up to 8 sections per post.
  - **Uploading Pictures**: Images can be uploaded directly or via a link. Uploaded images are **resized and optimized** for performance.
  - **Updating and Deleting Posts**: Users can update or delete their posts, but only within 10 minutes of creation.
  - **Feed**: Users can view the latest posts from followed users or tags.
  - **Tags**: Posts can have up to 8 tags, and users can follow/unfollow tags to customize their feed.
  - **Post Retrieval**: Posts can be retrieved with pagination and filtered by author, date, rating, or title regex. The API also indicates if the user has already rated a post.
  - **Post Rating**: Posts have a rating system that contributes to the user's overall rating.

- **Users**:

  - **Profile Picture**: Users can set a profile picture using a link.
  - **Following Users**: Users can follow/unfollow other users.
  - **Bio**: Users can add a short description about themselves.
  - **Registration and Authentication**: Standard registration and authentication features are implemented.
  - **Sessions**: Instead of JWT, the app uses sessions for enhanced security.
  - **Saving Drafts**: Users can save post drafts, including sections, title, and body, without publishing them.
  - **Individual Rating**: Each user has a rating based on the sum of ratings for their posts and comments.

- **Comments**:

  - **Hierarchical Comment Tree**: Comments are displayed in a nested tree structure, with recursive checks to show if the user has already rated a comment.
  - **Creating, Updating, and Deleting Comments**: Users can create, update, or delete comments within a specific time frame, provided no one has replied to them.
  - **Comment Rating**: Comments have a rating system that contributes to the user's overall rating.

- **Swagger Documentation**: Full API documentation is available at `/api-docs/`.

### Frontend Key Features

- **General**:

  - **Auth Guards**: Routes requiring authentication are protected.
  - **Allowed Routes Guard**: Non-existent routes redirect to a 404 page.
  - **Expired Actions Guard**: Prevents access to actions like editing a post after the allowed time has passed.
  - **Global Request Error Notifications**: Errors trigger animated notifications that disappear after a few seconds.
  - **Adaptive Design**: The frontend is fully responsive.
  - **Dynamic Document Title**: The page title updates dynamically based on the route.
  - **End-to-End (E2E) Testing**: Most frontend components are covered with **E2E tests** to ensure reliability and a smooth user experience. These tests simulate real user interactions and validate the functionality of the application.

- **Posts**:

  - **Multiple Post Pages**: Includes pages like _Today_, _All_, _Blowing_, _Top This Week_, and _New_, each with unique sorting and filtering.
  - **Post Editor**: A rich text editor for creating and editing posts, with drag-and-drop support for sections.
  - **Preloader**: Smooth loading animations for better UX.
  - **Infinite Scroll**: Loads more posts as the user scrolls.
  - **Search with Filters**: Allows users to search posts with advanced filters.
  - **Following Tags**: Users can follow/unfollow tags directly from the UI.

- **Users**:

  - **Auth State Management**: Handles authentication state, hiding unavailable features for logged-out users.
  - **User Profile Page**: Displays user posts, rating, followers, bio, and avatar.
  - **Follow/Unfollow Users**: Users can follow or unfollow others.
  - **Settings**: Users can manage their profile, including bio, avatar, and followed users/tags.
  - **Registration and Login**: Standard registration and login forms.

- **Comments**:
  - **Tree Comments**: Nested comments with a hierarchical structure.
  - **Rich Text Editor**: For creating and updating comments.
  - **Delete and Update Comments**: Users can delete or update their comments within a specific time frame.

## Motivation

The primary motivation behind this project is to have fun while learning new technologies and implementing creative solutions. By focusing on integration testing for the backend, I aim to ensure the application remains robust and maintainable as it evolves.

## Get Involved

I hope you find this project as enjoyable as I do! Feel free to explore the code, report issues, or contribute. Your feedback and contributions are always welcome!

## How to Run It

This project can be run in multiple ways, depending on your preferences and setup. Below are the steps for each scenario:

### Prerequisites
- **Node.js** (>=20.16.0)
- **[pnpm](https://pnpm.io/)** (>=8.6.0)
- **Docker** and **Docker Compose** (optional, for containerized setups)
- **MongoDB** (can be set up locally, remotely, or via Docker)

---

### Option 1: Running Without Docker
If you prefer not to use Docker, follow these steps:

1. **Set Up MongoDB**:
   - **Option A: Local MongoDB**  
     Install MongoDB locally on your machine and ensure it’s running.  
     - [MongoDB Installation Guide](https://www.mongodb.com/docs/manual/installation/)  
   - **Option B: Remote MongoDB (e.g., MongoDB Atlas)**  
     Use a remote MongoDB instance like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Copy the connection string provided by the service.

2. **Configure Environment Variables**:
   - Rename `.env.example` to `.env` in the root folder.
   - Open the `.env` file and fill in the required values:
     - For **Local MongoDB**: Set `DB_URL` to `mongodb://localhost:27017/smiler`.
     - For **Remote MongoDB**: Set `DB_URL` to the connection string provided by your remote MongoDB service.

3. **Install Dependencies**:
   ```bash
   pnpm install
   ```

4. **Run the Application**:
   ```bash
   pnpm dev
   ```

---

### Option 2: Running With Docker
If you prefer to use Docker, follow these steps:

1. **Set Up MongoDB**:
   - **Option A: Use Docker to Run MongoDB**  
     Run a MongoDB container using Docker:
     ```bash
     docker run -d -v /usr/src/smiler/db:/data/db -p 27017:27017 --name smiler-mongo mongo:5.0.10
     ```
     Update the `DB_URL` in `.env` to `mongodb://smiler-mongo:27017/smiler`.

   - **Option B: Use Remote MongoDB (e.g., MongoDB Atlas)**  
     Use a remote MongoDB instance like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). Copy the connection string and update the `DB_URL` in `.env`.

2. **Configure Environment Variables**:
   - Rename `.env.example` to `.env` in the root folder.
   - Open the `.env` file and fill in the required values.

3. **Build Images**:
   - Build the images using the following commands:
   ```bash
   docker build --target frontend -t <your_username>/smiler-frontend:latest .
   docker build --target backend -t <your_username>/smiler-backend:latest .
   ```
4. **Run the Application Images with Docker**:
   - Run the images using the following commands:
   ```bash
   docker run -d -p 8080:80 --name smiler-frontend <your_username>/smiler-frontend:latest
   docker run -d -p 3000:3000 --name smiler-backend <your_username>/smiler-backend:latest
   ```

---

### Option 3: Running With Docker Compose (All-in-One)
If you want to run both the application and MongoDB using Docker Compose, follow these steps:

1. **Configure Environment Variables**:
   - Rename `.env.example` to `.env` in the root folder.
   - Open the `.env` file and fill in the required values. For MongoDB, set `DB_URL` to `mongodb://mongo:27017/smiler`.

2. **Run Docker Compose**:
   - Use the provided `docker-compose.yml` and `docker-compose.local.yml` files to start the application and MongoDB together:
     ```bash
     # Optionally add --build to build images instead of pulling them from Docker Hub
     docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
     ```

## License

This project is licensed under the [MIT License](LICENSE).
