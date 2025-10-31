# FastAPI Social Chat

A complete social media feed application built with a FastAPI backend and a plain JavaScript frontend. This project demonstrates a secure, token-based CRUD (Create, Read, Update, Delete) application with a full authentication system.
---

## ✨ Features

* **User Authentication:** Secure user account creation and password-hashed login using JWT (JSON Web Tokens).
* **Chat Interface:** The social feed is styled as a chat room.
    * Your messages appear on the right (light green).
    * Other users' messages appear on the left (white).
* **Anonymized Names:** User emails are anonymized to show only the first 3 letters (e.g., "uts").
* **Send/Delete Messages:** Users can create new messages (formerly "posts") and delete their own.
* **Voting:** Users can upvote (👍) or downvote (👎) any message, with the total vote count displayed.
* **Chronological Order:** All messages are correctly sorted by the time they were sent.

---

## 🛠 Tech Stack

### Backend
* **FastAPI:** For the core high-performance API.
* **PostgreSQL:** As the production-grade SQL database.
* **SQLAlchemy:** For the ORM (Object-Relational Mapper).
* **Alembic:** For handling database migrations.
* **OAuth2 + JWT:** For secure token-based user authentication.
* **Pydantic:** For data validation and settings management.
* **Argon2:** For securely hashing user passwords.

### Frontend
* **HTML5**
* **CSS3** (with modern Flexbox for layout)
* **Vanilla JavaScript (ES6+):** (Using `fetch` for API calls, `async/await`, and DOM manipulation).

---

## 🚀 Getting Started

To get this project running locally, you'll need to set up the backend and then run the frontend.

### 1. Backend Setup (FastAPI)

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd fastapi
    ```

2.  **Create a Python virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate
    ```

3.  **Create `requirements.txt`:**
    * If you haven't already, create a `requirements.txt` file:
        ```bash
        pip freeze > requirements.txt
        ```
    * (The next time you clone, you can just run `pip install -r requirements.txt`)

4.  **Install dependencies:**
    * You will need to manually install the libraries if you don't have a `requirements.txt`:
        ```bash
        pip install fastapi "uvicorn[standard]" sqlalchemy "psycopg2-binary" pydantic pydantic-settings python-jose "passlib[argon2]" alembic
        ```

5.  **Create a `.env` file:**
    * Create a file named `.env` in the root `fastapi` folder. This is where you'll store your secret credentials.
    * Paste the following and fill in your database details:
        ```ini
        DATABASE_HOSTNAME=localhost
        DATABASE_PORT=5432
        DATABASE_PASSWORD=your_postgres_password
        DATABASE_NAME=your_db_name
        DATABASE_USERNAME=postgres
        SECRET_KEY=your_very_strong_secret_key_here
        ALGORITHM=HS256
        ACCESS_TOKEN_EXPIRE_MINUTES=30
        ```

6.  **Run Database Migrations:**
    * (Assuming you have initialized Alembic) Run this command to apply all the database models (like `posts`, `user`, `votes`) to your PostgreSQL database.
    ```bash
    alembic upgrade head
    ```

7.  **Run the Server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    Your backend is now running, typically at `http://localhost:8000`.

### 2. Frontend Setup (JavaScript)

1.  **Ensure the backend is running.**

2.  **Open the frontend in your browser:**
    * The files `index.html`, `style.css`, and `app.js` are in the root folder.
    * The easiest way to run this is with a local server. If you use VS Code, you can use the **"Live Server"** extension.
    * You can also just **double-click the `index.html` file** to open it directly in your browser.

3.  **Start Chatting!**
    * Create an account, log in, and send messages.

---

## 🔐 API Endpoints

<details>
<summary>Click to expand API Endpoints</summary>

### Authentication
* `POST /login`: Logs in a user. Expects `application/x-www-form-urlencoded` form data, **not JSON**.
    * `username`: The user's email.
    * `password`: The user's password.

### Users
* `POST /users`: Creates a new user.
    * **Body:** `{ "email": "...", "password": "..." }`

### Posts (Messages)
* `GET /posts`: Gets all posts/messages. Requires `Authorization: Bearer <token>`.
* `POST /posts`: Creates a new post/message. Requires `Authorization: Bearer <token>`.
    * **Body:** `{ "content": "...", "published": true }`
* `DELETE /posts/{id}`: Deletes a post/message owned by the user. Requires `Authorization: Bearer <token>`.

### Votes
* `POST /vote`: Casts or removes a vote. Requires `Authorization: Bearer <token>`.
    * **Body:** `{ "post_id": 1, "dir": 1 }` (1 = upvote, 0 = remove vote)

</details>

---

## 🌟 Future Enhancements

* Implement **S3 file uploads** for sharing images and videos.
* Integrate a **real-time AI chatbot** (like Meta AI) by calling an external LLM API.
* Convert the frontend from HTTP polling (`fetch`) to **WebSockets** for a true real-time, low-latency chat experience.
