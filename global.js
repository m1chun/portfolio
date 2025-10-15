console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                  // Local server
  : "/website/";         // GitHub Pages repo name

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
