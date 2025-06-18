import React, { useState, useEffect } from 'react';

// PUBLIC_INTERFACE
/**
 * Main container for the GitHubActivityDashboard.
 * Uses unauthenticated/public GitHub API endpoints. No login/logout functionality.
 * Assumes a default public username for demonstration.
 * Provides repository list, activity feed, and profile as a public dashboard for any GitHub user.
 * @returns {JSX.Element} Main Dashboard Container
 */
function GitHubActivityDashboard() {
  // For demo: public GitHub handle (replace or allow input for custom user if desired)
  const DEFAULT_USERNAME = "octocat";

  // State
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputUser, setInputUser] = useState(DEFAULT_USERNAME);

  // --- Fetch user info ---
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    fetch(`https://api.github.com/users/${username}`)
      .then(res => {
        if (!res.ok) throw new Error("User not found");
        return res.json();
      })
      .then(data => {
        setUser(data);
      })
      .catch(() => setError("Failed to fetch user profile."))
      .finally(() => setLoading(false));
  }, [username]);

  // --- Fetch repositories ---
  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(null);
    fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Repo fetch failed");
        }
        return res.json();
      })
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setSelectedRepo(null);
      })
      .catch(() => setError("Failed to fetch repositories."))
      .finally(() => setLoading(false));
  }, [username]);

  // --- Fetch repo activity feed ---
  useEffect(() => {
    if (!selectedRepo) {
      setEvents([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`https://api.github.com/repos/${selectedRepo.full_name}/events?per_page=30`)
      .then(res => {
        if (!res.ok) throw new Error("Events fetch failed");
        return res.json();
      })
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to fetch activity feed."))
      .finally(() => setLoading(false));
  }, [selectedRepo]);

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

    // Activity formatter
    function formatEvent(e) {
      let desc = "";
      switch (e.type) {
        case "PushEvent":
          desc = `pushed to branch ${e.payload.ref?.replace('refs/heads/', '')}`;
          break;
        case "IssuesEvent":
          desc = `${e.payload.action} issue #${e.payload.issue?.number}`;
          break;
        case "PullRequestEvent":
          desc = `${e.payload.action} pull request #${e.payload.pull_request?.number}`;
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

  // PUBLIC_INTERFACE
  /** User search bar to enter a GitHub handle */
  function UserSearch({ onSubmit, value, onChange, loading }) {
    return (
      <form
        style={{ display: "flex", gap: 12, marginBottom: 20 }}
        onSubmit={e => {
          e.preventDefault();
          onSubmit(value);
        }}
        autoComplete="off"
      >
        <input
          style={{
            padding: "9px 17px",
            fontSize: "1.06rem",
            borderRadius: 6,
            border: "1px solid #e1e4e8",
            outline: "none",
            width: 220,
            background: "#fff",
            color: "#222"
          }}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={loading}
          placeholder="Enter GitHub username"
        />
        <button
          className="btn"
          style={{
            background: "#0366d6",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: 6,
            padding: "9px 24px"
          }}
          disabled={loading || !value}
          type="submit"
        >
          View User
        </button>
      </form>
    );
  }


  // Main Render: Always open, no login required
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
        <div className="container" style={{ maxWidth: 880, margin: "0 auto", padding: "0 30px", display: "flex", alignItems: "center" }}>
          <span style={{ color: "#f1f8ff" }}>GitHub Activity Dashboard</span>
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
          {/* User search bar */}
          <UserSearch
            onSubmit={(v) => {
              if (v !== username) setUsername(v.trim());
            }}
            value={inputUser}
            onChange={setInputUser}
            loading={loading}
          />

          {/* User profile */}
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
