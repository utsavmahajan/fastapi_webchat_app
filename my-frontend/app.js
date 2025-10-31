document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIG & STATE ---
  const API_URL = "http://localhost:8000"; // Your FastAPI backend URL
  let token = localStorage.getItem("token");
  let currentUserId = token ? parseJwt(token).user_id : null;

  // --- DOM ELEMENTS ---
  const loginView = document.getElementById("login-view");
  const signupView = document.getElementById("signup-view");
  const dashboardView = document.getElementById("dashboard-view");
  const messageArea = document.getElementById("message-area");
  const logoutButton = document.getElementById("logout-button");
  const postsContainer = document.getElementById("posts-container");

  // Forms
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const createPostForm = document.getElementById("create-post-form");

  // View-switching Links
  const showSignupLink = document.getElementById("show-signup-link");
  const showLoginLink = document.getElementById("show-login-link");

  // --- VIEW-SWITCHING LOGIC ---

  /** Hides all main views and shows the one with the specified ID */
  function showView(viewId) {
    // Hide all views
    loginView.classList.add("hidden");
    signupView.classList.add("hidden");
    dashboardView.classList.add("hidden");
    logoutButton.classList.add("hidden");

    // Show the requested view
    const view = document.getElementById(viewId);
    if (view) {
      view.classList.remove("hidden");
    }

    // Show logout button if user is on dashboard
    if (viewId === "dashboard-view") {
      logoutButton.classList.remove("hidden");
    }
  }

  // --- HELPER FUNCTIONS ---

  /** Displays a message to the user */
  function showMessage(message, type = "error") {
    messageArea.textContent = message;
    messageArea.className =
      type === "error" ? "message-error" : "message-success";

    // Clear message after 3 seconds
    setTimeout(() => {
      messageArea.textContent = "";
      messageArea.className = "";
    }, 3000);
  }

  /** Decodes a JWT token to get the payload (e.g., user_id) */
  function parseJwt(token) {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error decoding JWT", e);
      return null;
    }
  }

  // --- API CALLS & EVENT HANDLERS ---

  // 1. LOGIN
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // IMPORTANT: Your backend expects 'form-data' for login, not JSON.
    // We use URLSearchParams to create this format.
    const formData = new URLSearchParams();
    formData.append("username", loginForm.username.value);
    formData.append("password", loginForm.password.value);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Invalid credentials");
      }

      // Login Success
      token = data.access_token;
      currentUserId = parseJwt(token).user_id;
      localStorage.setItem("token", token);

      loginForm.reset();
      showView("dashboard-view");
      fetchPosts();
    } catch (error) {
      showMessage(error.message);
    }
  });

  // 2. LOGOUT
  logoutButton.addEventListener("click", () => {
    token = null;
    currentUserId = null;
    localStorage.removeItem("token");
    showView("login-view");
    postsContainer.innerHTML = ""; // Clear posts
  });

  // 3. SIGN UP
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create account");
      }

      // Signup Success
      signupForm.reset();
      showMessage("Account created successfully! Please login.", "success");
      showView("login-view");
    } catch (error) {
      showMessage(error.message);
    }
  });

  // 4. FETCH ALL POSTS
  async function fetchPosts() {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token is invalid or expired
        logoutButton.click();
        showMessage("Your session expired. Please login again.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const postsData = await response.json();
      postsData.sort(
        (a, b) => new Date(a.Post.created_at) - new Date(b.Post.created_at)
      );
      renderPosts(postsData);
    } catch (error) {
      showMessage(error.message);
    }
  }
  function formatUsername(email) {
    const username = email.split("@")[0]; // "utsavmahajan5@gmail.com" -> "utsavmahajan5"
    return username.substring(0, 3); // "utsavmahajan5" -> "uts"
  }
  // 5. RENDER ALL POSTS
  function renderPosts(postsData) {
    postsContainer.innerHTML = ""; // Clear existing posts

    if (postsData.length === 0) {
      // No changes here
      return;
    }

    postsData.forEach((item) => {
      const post = item.Post;
      const votes = item.votes;
      const postCard = document.createElement("div");
      postCard.className = "post-card";
      const isOwner = post.owner_id === currentUserId;
      postCard.classList.add(isOwner ? "my-post" : "other-post");

      // --- THIS IS THE UPDATED LINE ---
      postCard.innerHTML = `
                <div class="post-author">${formatUsername(
                  post.owner.email
                )}</div>
                <div class="post-content-body">
                    <p>${post.content}</p>
                </div>
                <div class="post-bubble-footer">
                    <div class="post-actions">
                        <button class="vote-btn" title="Upvote" data-post-id="${
                          post.id
                        }">👍</button>
                        <span class="votes">${votes}</span>
                        <button class="unvote-btn" title="Remove Vote" data-post-id="${
                          post.id
                        }">👎</button>
                        ${
                          isOwner
                            ? `<button class="delete-btn" title="Delete" data-post-id="${post.id}">❌</button>`
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

    // --- BONUS: Scroll to bottom ---
    // After rendering, scroll the chat window to the newest message
    const chatWindow = document.querySelector(".chat-background-wrapper");
    if (chatWindow) {
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  }

  // 6. CREATE A NEW POST
  createPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // DELETE the 'title' line completely
    const content = document.getElementById("post-content").value;

    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, published: true }), // <-- REMOVE 'title' FROM HERE
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create post");
      }

      // Success
      createPostForm.reset();
      showMessage("Post created!", "success");
      fetchPosts(); // Refresh the post list
    } catch (error) {
      showMessage(error.message);
    }
  });

  // 7. VOTE or DELETE (using Event Delegation)
  // We listen for clicks on the whole container, then check what was clicked
  postsContainer.addEventListener("click", async (e) => {
    const target = e.target;

    // --- Handle Voting ---
    let voteDirection = -1;
    if (target.classList.contains("vote-btn")) {
      voteDirection = 1; // Upvote
    } else if (target.classList.contains("unvote-btn")) {
      voteDirection = 0; // Remove vote
    }

    if (voteDirection !== -1) {
      const postId = target.dataset.postId;
      try {
        const response = await fetch(`${API_URL}/vote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            post_id: parseInt(postId),
            dir: voteDirection,
          }),
        });

        if (response.status === 409) {
          showMessage("You have already voted on this post.");
          return;
        }
        if (response.status === 404) {
          showMessage("Vote not found to be removed.");
          return;
        }
        if (!response.ok) {
          throw new Error("Vote failed");
        }

        // Success, refresh posts to show new vote count
        fetchPosts();
      } catch (error) {
        showMessage(error.message);
      }
    }

    // --- Handle Deleting ---
    if (target.classList.contains("delete-btn")) {
      const postId = target.dataset.postId;

      if (confirm("Are you sure you want to delete this post?")) {
        try {
          const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 401) {
            throw new Error("You are not authorized to delete this post.");
          }
          if (!response.ok) {
            throw new Error("Failed to delete post.");
          }

          // Success (HTTP 204 No Content)
          showMessage("Post deleted.", "success");
          fetchPosts(); // Refresh post list
        } catch (error) {
          showMessage(error.message);
        }
      }
    }
  });

  // --- PAGE LOAD LOGIC ---

  // View switching links
  showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    showView("signup-view");
  });

  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    showView("login-view");
  });

  // Initial page load:
  // Check if user is already logged in (token in localStorage)
  if (token) {
    showView("dashboard-view");
    fetchPosts();
  } else {
    showView("login-view");
  }
  // --- WHATSAPP TEXTBOX AUTO-RESIZE ---

  const postContentTextarea = document.getElementById("post-content");

  // Function to resize the textarea
  function autoResizeTextarea() {
    // Reset height to auto to shrink if text is deleted
    postContentTextarea.style.height = "auto";
    // Set new height based on scroll height
    postContentTextarea.style.height = postContentTextarea.scrollHeight + "px";
  }

  // Add event listener for input
  postContentTextarea.addEventListener("input", autoResizeTextarea);

  // Also resize when the page loads, in case there's cached text
  autoResizeTextarea();

  // After sending a message, reset the form AND the textarea height
  createPostForm.addEventListener("submit", () => {
    // We add a tiny delay to reset the height *after* the form submits
    setTimeout(() => {
      postContentTextarea.style.height = "auto";
    }, 0);
  });
}); // This is the closing brace of your main DOMContentLoaded listener
