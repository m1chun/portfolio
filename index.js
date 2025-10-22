import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projectsContainer = document.querySelector('.projects');
const profileStatsContainer = document.querySelector('#profile-stats');

// Determine correct base path for GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"        // local dev
  : "/portfolio/"; // replace 'portfolio' with your repo name if different

// Render latest 3 projects
async function showLatestProjects() {
  const projects = await fetchJSON(`${BASE_PATH}lib/projects.json`);
  if (!projects) return;

  const latestProjects = [...projects]
    .sort((a, b) => parseInt(b.year) - parseInt(a.year))
    .slice(0, 3);

  renderProjects(latestProjects, projectsContainer, 'h2');
}

// Fetch and display GitHub stats
async function showGitHubStats() {
  const githubData = await fetchGitHubData('m1chun');
  if (!githubData || !profileStatsContainer) return;

  profileStatsContainer.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
    </dl>
  `;
}

// Run both functions
showLatestProjects();
showGitHubStats();
