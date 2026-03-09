document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG & STATE ---
  // Use /api prefix or empty string depending on your setup
  const API_URL = "";

  let token = localStorage.getItem("token");
  let currentUserId = token ? parseJwt(token).user_id : null;

  // --- DOM ELEMENTS ---
  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");
  const dashboardView = document.getElementById("dashboard-view");
  const messageArea = document.getElementById("message-area");
  const logoutButton = document.getElementById("logout-button");
  const postsContainer = document.getElementById("posts-container");

  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  // File input elements
  const createPostForm = document.getElementById("create-post-form");
  const fileInput = document.getElementById("file-input");

  const showSignupLink = document.getElementById("show-signup-link");
  const showLoginLink = document.getElementById("show-login-link");

  // --- VIEW-SWITCHING LOGIC ---
  function showView(viewId) {
    loginView.classList.add("hidden");
    signupView.classList.add("hidden");
    dashboardView.classList.add("hidden");
    logoutButton.classList.add("hidden");

    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");

    if (viewId === "dashboard-view") {
      logoutButton.classList.remove("hidden");
    }
  }

  // --- HELPER FUNCTIONS ---
  function showMessage(message, type = "error") {
    messageArea.textContent = message;
    messageArea.className =
      type === "error" ? "message-error" : "message-success";
    setTimeout(() => {
      messageArea.textContent = "";
      messageArea.className = "";
    }, 3000);
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT Parse Error:", e);
      return null;
    }
  }

  function formatUsername(email) {
    if (!email) return "User";
    return email.split("@")[0];
  }

  // --- API CALLS ---

  // 1. LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new URLSearchParams();
    formData.append("username", loginForm.username.value);
    formData.append("password", loginForm.password.value);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Invalid credentials");
      }
      
      const data = await response.json();
      token = data.access_token;
      currentUserId = parseJwt(token).user_id;
      localStorage.setItem("token", token);
      
      console.log("Login successful, User ID:", currentUserId);
      
      loginForm.reset();
      showView("dashboard-view");
      fetchPosts();
    } catch (error) {
      console.error("Login error:", error);
      showMessage(error.message);
    }
  });

  // 2. LOGOUT
  logoutButton.addEventListener("click", () => {
    token = null;
    currentUserId = null;
    localStorage.removeItem("token");
    showView("login-view");
    postsContainer.innerHTML = "";
  });

  // 3. SIGN UP
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const response = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create account");
      }

      signupForm.reset();
      showMessage("Account created! Please login.", "success");
      showView("login-view");
    } catch (error) {
      console.error("Signup error:", error);
      showMessage(error.message);
    }
  });

  // 4. FETCH POSTS
  async function fetchPosts() {
    if (!token) {
      console.error("No token available");
      return;
    }
    
    try {
      console.log("Fetching posts with token:", token.substring(0, 20) + "...");
      
      const response = await fetch(`${API_URL}/posts/`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      
      console.log("Fetch posts response status:", response.status);
      
      if (response.status === 401) {
        console.error("Unauthorized - logging out");
        showMessage("Session expired. Please login again.");
        logoutButton.click();
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Fetch posts error:", errorText);
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      
      const postsData = await response.json();
      console.log("Posts fetched:", postsData);
      
      postsData.sort(
        (a, b) => new Date(a.Post.created_at) - new Date(b.Post.created_at)
      );
      renderPosts(postsData);
    } catch (error) {
      console.error("Fetch posts error:", error);
      showMessage("Failed to load posts. Please refresh the page.");
    }
  }

  // 5. RENDER POSTS
  function renderPosts(postsData) {
    postsContainer.innerHTML = "";
    if (!postsData || postsData.length === 0) {
      postsContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#666;">No posts yet. Be the first to post!</div>';
      return;
    }

    postsData.forEach((item) => {
      const post = item.Post;
      const votes = item.votes || 0;
      const imageUrl = item.image_url;
      const isOwner = post.owner_id === currentUserId;

      const postCard = document.createElement("div");
      postCard.className = "post-card";
      postCard.classList.add(isOwner ? "my-post" : "other-post");

      // Extract email from the owner object safely
      const ownerEmail = post.owner ? post.owner.email : "Unknown";

      // Media HTML generation
      let mediaHtml = "";
      if (imageUrl) {
        if (imageUrl.match(/\.(mp4|mov|webm)$/i)) {
          mediaHtml = `<video src="${imageUrl}" controls class="post-media"></video>`;
        } else {
          mediaHtml = `<img src="${imageUrl}" alt="attachment" class="post-media" loading="lazy" />`;
        }
      }

      postCard.innerHTML = `
        <div class="post-author">${formatUsername(ownerEmail)}</div>
        
        ${mediaHtml}

        <div class="post-content-body">
            <p>${post.content}</p>
        </div>
        <div class="post-bubble-footer">
            <div class="post-actions">
                <button class="vote-btn" data-post-id="${post.id}">👍</button>
                <span class="votes">${votes}</span>
                <button class="unvote-btn" data-post-id="${post.id}">👎</button>
                ${
                  isOwner
                    ? `<button class="delete-btn" data-post-id="${post.id}">🗑️</button>`
                    : ""
                }
            </div>
            <span class="post-timestamp">${new Date(
              post.created_at
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</span>
        </div>
      `;
      postsContainer.appendChild(postCard);
    });

    // Auto-scroll to bottom
    const chatWindow = document.querySelector(".chat-background-wrapper");
    if (chatWindow) {
      setTimeout(() => {
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }, 100);
    }
  }

  // 6. CREATE POST (Supports File Upload)
  createPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.getElementById("post-content").value.trim();

    if (!content && !fileInput.files[0]) {
      showMessage("Please enter content or select a file");
      return;
    }

    const formData = new FormData();
    formData.append("content", content || "");
    formData.append("published", "true");

    if (fileInput.files[0]) {
      formData.append("file", fileInput.files[0]);
    }

    try {
      console.log("Creating post...");
      
      const response = await fetch(`${API_URL}/posts/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Create post response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("Create post error:", data);
        throw new Error(data.detail || "Failed to create post");
      }

      console.log("Post created successfully");
      
      createPostForm.reset();
      fileInput.value = "";
      document.getElementById("post-content").style.height = "auto";
      
      // Wait a moment then fetch posts
      setTimeout(() => {
        fetchPosts();
      }, 500);
      
      showMessage("Post created successfully!", "success");
    } catch (error) {
      console.error("Create post error:", error);
      showMessage(error.message);
    }
  });

  // 7. VOTE & DELETE
  postsContainer.addEventListener("click", async (e) => {
    const target = e.target;

    // Traverse up to find button if icon clicked
    const btn = target.closest("button");
    if (!btn) return;

    const postId = btn.dataset.postId;
    if (!postId) return;

    if (
      btn.classList.contains("vote-btn") ||
      btn.classList.contains("unvote-btn")
    ) {
      const dir = btn.classList.contains("vote-btn") ? 1 : 0;
      try {
        const res = await fetch(`${API_URL}/vote/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ post_id: parseInt(postId), dir: dir }),
        });
        if (res.ok || res.status === 409 || res.status === 404) {
          fetchPosts();
        }
      } catch (err) {
        console.error("Vote error:", err);
      }
    }

    if (btn.classList.contains("delete-btn")) {
      if (confirm("Delete this post?")) {
        try {
          const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (res.ok) {
            fetchPosts();
            showMessage("Post deleted successfully", "success");
          }
        } catch (err) {
          console.error("Delete error:", err);
          showMessage(err.message);
        }
      }
    }
  });

  // --- PAGE LOAD ---
  showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    showView("signup-view");
  });
  
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showView("login-view");
  });

  // Check initial state
  if (token) {
    console.log("Token found, showing dashboard");
    showView("dashboard-view");
    fetchPosts();
  } else {
    console.log("No token found, showing login");
    showView("login-view");
  }

  // Auto-resize Textarea
  const ta = document.getElementById("post-content");
  if (ta) {
    ta.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    });
  }
});