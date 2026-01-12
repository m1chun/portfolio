import { renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let allProjects = [];
const container = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');
const title = document.querySelector('.projects-title');
const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

let selectedIndex = -1; // tracks the selected pie slice
let arcDataGlobal = [];

// Helper: get the year of the selected slice
function getSelectedYear() {
  if (selectedIndex === -1) return null;
  return arcDataGlobal[selectedIndex].data.label;
}

// Unified filter: combines search query and selected year
function getFilteredProjects() {
  const query = searchInput.value.toLowerCase();
  return allProjects.filter(project => {
    const matchesQuery = !query || Object.values(project).join(' ').toLowerCase().includes(query);
    const matchesYear = selectedIndex === -1 || project.year == getSelectedYear();
    return matchesQuery && matchesYear;
  });
}

// Function to render pie chart based on current projects
function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  arcDataGlobal = d3.pie().value(d => d.value)(data);

  // Clear previous chart and legend
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

  // Draw pie slices
  svg.selectAll('path')
    .data(arcDataGlobal)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => d3.schemeTableau10[i % 10]) // keep colors simple
    .attr('class', 'pie-slice')
    .style('cursor', 'pointer')
    .attr('opacity', 1)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
    })
    .on('mouseout', function(event, d) {
      const index = arcDataGlobal.indexOf(d);
      d3.select(this).attr('opacity', selectedIndex === index ? 1 : 0.3);
    })
    .on('click', function(event, d) {
      const index = arcDataGlobal.indexOf(d);
      selectedIndex = index;

      svg.selectAll('path')
        .attr('opacity', (_, i) => (selectedIndex === i ? 1 : 0.3))
        .attr('class', (_, i) => (selectedIndex === i ? 'pie-slice selected' : 'pie-slice'));

      legend.selectAll('li')
        .attr('class', (_, i) => (selectedIndex === i ? 'selected' : ''));

      const filteredProjects = getFilteredProjects();
      renderProjects(filteredProjects, container);
      title.textContent = `Projects (${filteredProjects.length})${selectedIndex !== -1 ? ` — ${getSelectedYear()}` : ''}`;
    });

  // Draw legend
  data.forEach((d, idx) => {
    legend.append('li')
      .attr('style', `--color:${d3.schemeTableau10[idx % 10]}`)
      .attr('class', selectedIndex === idx ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = idx;
        svg.selectAll('path').filter((_, i) => i === idx).dispatch('click');
      });
  });
}

// Fetch projects
fetch('/lib/projects.json')
  .then(response => response.json())
  .then(projects => {
    allProjects = projects;

    renderProjects(allProjects, container);
    title.textContent = `Projects (${allProjects.length})`;
    renderPieChart(allProjects);
  })
  .catch(error => console.error('Error loading projects:', error));

// Search functionality
searchInput.addEventListener('input', () => {
  const filteredProjects = getFilteredProjects();
  renderProjects(filteredProjects, container);
  title.textContent = `Projects (${filteredProjects.length})${selectedIndex !== -1 ? ` — ${getSelectedYear()}` : ''}`;

  renderPieChart(filteredProjects);
});