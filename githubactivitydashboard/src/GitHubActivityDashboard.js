import React, { useState, useEffect } from 'react';

// PUBLIC_INTERFACE
/**
 * Main container for the GitHubActivityDashboard. Handles OAuth login, fetches repositories and events,
 * and displays repository list, activity feed, and user profile.
 * @returns {JSX.Element} Main Dashboard Container
 */
function GitHubActivityDashboard() {
  // GitHub OAuth App credentials -- replace with your own client ID if needed.
  const CLIENT_ID = "Iv1.8b6fc5cd1b8fa3d7"; // Demo/sample only, not production safe
  const REDIRECT_URI = window.location.origin + "/";
  const SCOPE = "repo user";
  const AUTH_URL = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;

  // State
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- OAuth: Handle redirect and get access token ---
  useEffect(() => {
    // Extract ?code= from URL (after GitHub redirects user post-login)
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && !accessToken) {
      setLoading(true);
      // You'd normally send 'code' to backend to exchange for an access_token.
      // For demo: use an open API proxy (do NOT use in production).
      fetch(`https://github-oauth-proxy.vercel.app/api/authenticate/${code}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.token) {
            setAccessToken(data.token);
            window.history.replaceState({}, document.title, "/"); // Clean URL
          } else {
            setError("OAuth failed. Please try again.");
          }
        })
        .catch(() => setError("OAuth exchange failed."))
        .finally(() => setLoading(false));
    }
  }, [accessToken]);

  // --- Fetch user info once logged in ---
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(() => setError("Failed to fetch user profile."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  // --- Fetch repositories ---
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetch("https://api.github.com/user/repos?per_page=100", {
      headers: { Authorization: `token ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to fetch repositories."))
      .finally(() => setLoading(false));
  }, [accessToken]);

  // --- Fetch repo activity feed ---
  useEffect(() => {
    if (!accessToken || !selectedRepo) {
      setEvents([]);
      return;
    }
    setLoading(true);
    fetch(`https://api.github.com/repos/${selectedRepo.full_name}/events?per_page=30`, {
      headers: { Authorization: `token ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to fetch activity feed."))
      .finally(() => setLoading(false));
  }, [accessToken, selectedRepo]);

  // --- UI Components ---

  // PUBLIC_INTERFACE
  /** Start OAuth login */
  function handleLogin() {
    window.location.href = AUTH_URL;
  }

  // PUBLIC_INTERFACE
  /** Logout implementation (clears all local state) */
  function handleLogout() {
    setAccessToken(null);
    setUser(null);
    setRepos([]);
    setSelectedRepo(null);
    setEvents([]);
    window.location.href = "/";
  }

  // PUBLIC_INTERFACE
  /** Repo sidebar list */
  function RepoList({ repos, selectedRepo, onSelect }) {
    return (
      <div style={{
        background: '#24292e',
        color: '#fff',
        padding: 0,
        width: 220,
        minHeight: 'calc(100vh - 64px)',
        borderRight: '1px solid #e1e4e8',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: "1rem",
          borderBottom: "1px solid #e1e4e8",
          fontWeight: 600,
          background: "#24292e",
          color: "#f1f8ff",
        }}>
          Repositories
        </div>
        {repos && repos.length === 0 ? (
          <div style={{ padding: "1rem", color: "#ccc" }}>No repositories found.</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {repos.map(repo => (
              <li key={repo.id}>
                <button
                  onClick={() => onSelect(repo)}
                  style={{
                    background: selectedRepo && repo.id === selectedRepo.id ? "#0366d6" : "transparent",
                    color: selectedRepo && repo.id === selectedRepo.id ? "#fff" : "#f1f8ff",
                    border: "none",
                    textAlign: "left",
                    width: "100%",
                    padding: "10px 18px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {repo.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // PUBLIC_INTERFACE
  /** User profile summary at the top */
  function UserProfile({ user }) {
    if (!user) return null;
    return (
      <div style={{
        background: "#f1f8ff",
        borderRadius: 8,
        padding: "20px 28px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 20,
        boxShadow: "0 1px 4px rgba(36,41,46,0.04)",
      }}>
        <img
          src={user.avatar_url}
          alt="User avatar"
          style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid #0366d6" }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "1.2rem", color: "#24292e" }}>{user.name || user.login}</div>
          <div style={{ color: "#586069" }}>@{user.login}</div>
          {user.bio && <div style={{ color: "#586069", fontSize: "0.95rem", marginTop: 6 }}>{user.bio}</div>}
        </div>
        <a
          href={user.html_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#0366d6",
            textDecoration: "none",
            fontWeight: 500,
            background: "#fff",
            border: "1px solid #0366d6",
            padding: "7px 16px",
            borderRadius: 4,
          }}
        >View Profile</a>
      </div>
    );
  }

  // PUBLIC_INTERFACE
  /** Activity feed for a repository */
  function ActivityFeed({ events }) {
    if (!events || events.length === 0) {
      return <div style={{
        background: "#fff",
        borderRadius: 8,
        padding: "24px",
        minHeight: 120,
        color: "#586069",
        fontSize: "1.05rem",
        marginTop: 24,
        boxShadow: "0 1px 4px rgba(36,41,46,0.04)",
      }}>No activity for this repository.</div>;
    }

    // Activity formatter (simple for demo)
    function formatEvent(e) {
      let desc = "";
      switch (e.type) {
        case "PushEvent":
          desc = `pushed to branch ${e.payload.ref.replace('refs/heads/', '')}`;
          break;
        case "IssuesEvent":
          desc = `${e.payload.action} issue #${e.payload.issue.number}`;
          break;
        case "PullRequestEvent":
          desc = `${e.payload.action} pull request #${e.payload.pull_request.number}`;
          break;
        default:
          desc = e.type.replace(/([A-Z])/g, ' $1').trim();
      }
      return desc;
    }

    return (
      <div style={{
        background: "#fff",
        borderRadius: 8,
        padding: "24px",
        marginTop: 24,
        boxShadow: "0 1px 4px rgba(36,41,46,0.07)"
      }}>
        <h3 style={{ marginTop: 0, color: "#24292e" }}>Recent Activity</h3>
        <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
          {events.map(ev => (
            <li key={ev.id} style={{
              padding: "10px 0",
              borderBottom: "1px solid #f1f1f1"
            }}>
              <span style={{ fontWeight: 500, color: "#0366d6" }}>{ev.actor?.login || "Someone"}</span>{" "}
              {formatEvent(ev)}
              <span style={{ float: "right", color: "#586069", fontSize: "0.92rem" }}>
                {new Date(ev.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Main Render
  if (!accessToken) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f1f8ff",
        display: "flex",
        flexDirection: "column",
      }}>
        <nav style={{
          background: "#24292e",
          color: "#fff",
          padding: "17px 0",
          fontWeight: 600,
          fontSize: "1.13rem",
          boxShadow: "0 1px 2px rgba(36,41,46,0.07)"
        }}>
          <div className="container" style={{ maxWidth: 880, margin: "0 auto", padding: "0 30px" }}>
            <span style={{ color: "#f1f8ff" }}>GitHub Activity Dashboard</span>
          </div>
        </nav>

        <main style={{
          flex: "1 1 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: "48px 40px",
            boxShadow: "0 2px 12px #e1e4e880",
            minWidth: 320,
          }}>
            <h2 style={{ marginTop: 0, color: "#24292e" }}>Welcome</h2>
            <p style={{ color: "#586069" }}>Sign in with GitHub to view your repositories and recent activity.</p>
            <button
              className="btn btn-large"
              style={{
                background: "#24292e",
                color: "#f1f8ff",
                border: "none",
                borderRadius: 5,
                fontSize: "1.1rem",
                padding: "14px 22px",
                marginTop: 15,
                cursor: "pointer"
              }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Connecting..." : "Login with GitHub"}
            </button>
            {error && <div style={{ color: "red", marginTop: 14 }}>{error}</div>}
          </div>
        </main>
      </div>
    );
  }

  // Authenticated dashboard layout
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f8ff",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Navbar */}
      <nav style={{
        background: "#24292e",
        color: "#fff",
        padding: "17px 0",
        fontWeight: 600,
        fontSize: "1.13rem",
        boxShadow: "0 1px 2px rgba(36,41,46,0.07)"
      }}>
        <div style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "0 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span style={{ color: "#f1f8ff" }}>GitHub Activity Dashboard</span>
          <button
            style={{
              color: "#fff",
              background: "#0366d6",
              border: "none",
              borderRadius: 4,
              padding: "8px 18px",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={handleLogout}
          >Logout</button>
        </div>
      </nav>

      {/* Dashboard Grid */}
      <div style={{
        display: "flex",
        minHeight: "calc(100vh - 56px)"
      }}>
        {/* Sidebar */}
        <RepoList
          repos={repos}
          selectedRepo={selectedRepo}
          onSelect={setSelectedRepo}
        />
        {/* Main Content */}
        <main style={{
          flex: 1,
          background: "#f1f8ff",
          padding: "42px 40px",
          maxWidth: 800,
          margin: "0 auto"
        }}>
          <UserProfile user={user} />

          <div>
            <h2 style={{ margin: "15px 0 6px 0", color: "#24292e" }}>
              {selectedRepo ? selectedRepo.name : "Select a repository"}
            </h2>
            {selectedRepo && (
              <div style={{
                color: "#586069",
                marginBottom: 18
              }}>
                {selectedRepo.description}
                <span style={{
                  marginLeft: 12,
                  fontWeight: 500,
                  color: "#24292e"
                }}>
                  {selectedRepo.private ? "Private" : "Public"}
                </span>
              </div>
            )}
          </div>

          {loading && (
            <div style={{ color: "#0366d6", marginTop: 24 }}>Loading...</div>
          )}

          {error && (
            <div style={{ color: "red", marginTop: 16 }}>{error}</div>
          )}

          {selectedRepo ? (
            <ActivityFeed events={events} />
          ) : (
            <div style={{
              background: "#fff",
              borderRadius: 8,
              color: "#586069",
              minHeight: 160,
              padding: "34px",
              marginTop: 24,
              fontSize: "1.15rem",
              boxShadow: "0 1px 4px rgba(36,41,46,0.04)",
            }}>Select a repository to see recent activity.</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default GitHubActivityDashboard;
