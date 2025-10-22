console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/portfolio/";         // GitHub Pages repo name

// let navLinks = $$("nav a");
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');
let pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'resume/', title: 'Resume' },
  { url: 'https://github.com/m1chun', title: "GitHub" }
];

let nav = document.querySelector('nav'); 

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  a.classList.toggle(
  'current',
  a.host === location.host && a.pathname === location.pathname,
  );

  if (a.host !== location.host) {
  a.target = "_blank";
  a.rel = "noopener noreferrer"; 
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme" position='absolute'>
    Theme:
    <select id="color-scheme-select">
      <option value="auto" selected>Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector('#color-scheme-select');

// Apply saved preference on page load
if ('colorScheme' in localStorage) {
  select.value = localStorage.colorScheme;
  document.documentElement.style.setProperty('color-scheme', select.value);
}

// Update color scheme and save preference when changed
select.addEventListener('input', function(event) {
  const value = event.target.value;

  if (value === 'auto') {
    document.documentElement.style.removeProperty('color-scheme');
  } else {
    document.documentElement.style.setProperty('color-scheme', value);
  }

  localStorage.colorScheme = value;
});

const form = document.querySelector('#myForm');

form?.addEventListener('submit', function(event) {
    // Prevent the default mail client from opening
    event.preventDefault();

    // Create FormData from the form
    const data = new FormData(form);
    let params = [];

    // Iterate over each field
    for (let [name, value] of data) {
        console.log(name, value); // check raw values
        params.push(`${name}=${encodeURIComponent(value)}`); // encode values
    }

    // Build the mailto URL
    const url = form.action + "?" + params.join("&");
    console.log(url); // final URL with proper encoding

    // Open the email client with the encoded URL
    location.href = url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    console.log('Fetch response:', response); // 👈 add this here

  if (!response.ok) {
  throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }   
  const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  if (!containerElement) return; // Safety check

  containerElement.innerHTML = '';

  if (!projects || projects.length === 0) {
    const placeholder = document.createElement('p');
    placeholder.textContent = 'No projects available at the moment.';
    containerElement.appendChild(placeholder);
    return;
  }

  // Automatically set the correct base path for images
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? ""                     // running in Live Server → use plain relative paths
    : "/portfolio/";    // 🔁 replace with your actual GitHub repo name

  projects.forEach(project => {
    const article = document.createElement('article');

    // Heading
    const heading = document.createElement(headingLevel);
    heading.textContent = project.title || 'Untitled Project';

    // Year
    const year = document.createElement('p');
    year.textContent = project.year || '';
    year.classList.add('project-year');

    // Image
    const img = document.createElement('img');
    if (project.image) {
      img.src = project.image.startsWith('http')
        ? project.image
        : `${BASE_PATH}${project.image}`;
      img.alt = project.title || 'Project image';
    }

    // Description
    const p = document.createElement('p');
    p.textContent = project.description || '';

    // Append all elements
    article.appendChild(heading);
    article.appendChild(year);
    if (project.image) article.appendChild(img);
    article.appendChild(p);

    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  // return statement here
  return fetchJSON(`https://api.github.com/users/${username}`);
}