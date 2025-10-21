import { fetchJSON, renderProjects } from './global.js';

async function initProjects() {
  const projects = await fetchJSON('/lib/projects.json');
  if (!projects) return;

  const latestProjects = projects.slice(0, 3);

  const projectsContainer = document.querySelector('.projects');

  renderProjects(latestProjects, projectsContainer, 'h3');
}

initProjects();

import { fetchGitHubData } from './global.js';

async function displayGitHubStats() {
  const githubData = await fetchGitHubData('m1chun'); // fetch the data

  const profileStats = document.querySelector('#profile-stats');

  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <dl>
        <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers:</dt><dd>${githubData.followers}</dd>
        <dt>Following:</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
}

// Call the function
displayGitHubStats();
