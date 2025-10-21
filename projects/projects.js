import { fetchJSON, renderProjects } from '../global.js';

async function initProjects() {
  const projectsContainer = document.querySelector('.projects');
  const projectsHeading = document.querySelector('.projects-title'); // Select the h1

  // Fetch project data
  const projects = await fetchJSON('../lib/projects.json');

  // Update the heading with the number of projects
  if (projects && projects.length > 0) {
    projectsHeading.textContent = `Projects (${projects.length})`;
  } else {
    projectsHeading.textContent = 'Projects (0)';
  }

  // Render projects dynamically
  renderProjects(projects, projectsContainer, 'h2');
}

// Initialize on page load
initProjects();
