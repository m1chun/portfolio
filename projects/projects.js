import { renderProjects } from '../global.js';

// Fetch project data
fetch('../lib/projects.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    const container = document.querySelector('.projects');
    renderProjects(data, container);
  })
  .catch(error => console.error('Error loading projects:', error));