import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: true,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const stats = d3.select('#stats').attr('class', 'stats');

  const statItems = [
    { label: 'Total LOC', value: data.length },
    { label: 'Total Commits', value: commits.length },
    { label: 'Number of Files', value: numFiles },
    { label: 'Average File Length', value: averageFileLength },
    { label: 'Busiest Time of Day', value: maxPeriod },
    { label: 'Busiest Day of Week', value: maxWorkDayName },
  ];

  const dl = stats.selectAll('dl').data(statItems).enter().append('dl');
  dl.append('dt').html((d) => d.label);
  dl.append('dd').text((d) => d.value);
}

function renderScatterPlot(data, commits) {
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const width = 1000;
  const height = 600;
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const margin = { top: 10, right: 10, bottom: 20, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([20, 980]);

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([580, 20]);

  const colorScale = d3
    .scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateHslLong('midnightblue', 'orange'));

  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const dots = svg.append('g').attr('class', 'dots');

  // Use key function and handle enter + update properly
  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', d => colorScale(d.hourFrac))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        }),
      update => update
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', d => colorScale(d.hourFrac))
    );

  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis)
    .selectAll('text')
    .attr('dy', '1.5em');

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  createBrushSelector(svg);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  // Raise dots and everything after overlay
  svg.selectAll('.dots, .overlay ~ *').raise();
}

function brushed(event) {
  console.log(event);
  const selection = event.selection;
  d3.selectAll('circle').classed('selected', (d) =>
    isCommitSelected(selection, d),
  );
  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  countElement.textContent = `${
    selectedCommits.length || 'No'
  } commits selected`;

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }
  const requiredCommits = selectedCommits.length ? selectedCommits : commits;
  const lines = requiredCommits.flatMap((d) => d.lines);

  // Use d3.rollup to count lines per language
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type,
  );

  // Update DOM with breakdown
  container.innerHTML = '';

  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);

    container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
  }
}

let xScale, yScale, svg;
let data = await loadData();
let commits = processCommits(data);

const fileLengths = d3.rollups(
  data,
  (v) => d3.max(v, (v) => v.line),
  (d) => d.file
);

const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) =>
    new Date(d.datetime).toLocaleString('en', {
      hour: 'numeric',
      hour12: true,
    })
);
const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

const numFiles = d3.groups(data, (d) => d.file).length;

const workByDay = d3.rollups(
  data,
  (v) => d3.sum(v, (d) => d.length),
  (d) => new Date(d.datetime).getDay()
);

const maxWorkDayNum = d3.greatest(workByDay, (d) => d[1])?.[0];
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const maxWorkDayName = weekdays[maxWorkDayNum];

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);



function updateScatterPlot(commitsToRender) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3.select('#chart').select('svg');

  xScale.domain(d3.extent(commitsToRender, d => d.datetime));

  const [minLines, maxLines] = d3.extent(commitsToRender, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const colorScale = d3
    .scaleSequential()
    .domain([0, 24])
    .interpolator(d3.interpolateHslLong('midnightblue', 'orange'));

  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commitsToRender, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join(
      enter => enter.append('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', d => colorScale(d.hourFrac))
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
          d3.select(event.currentTarget).style('fill-opacity', 1);
          renderTooltipContent(commit);
          updateTooltipVisibility(true);
          updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget).style('fill-opacity', 0.7);
          updateTooltipVisibility(false);
        }),
      update => update
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => rScale(d.totalLines))
        .attr('fill', d => colorScale(d.hourFrac))
    );

  // Update x-axis only
  const xAxis = d3.axisBottom(xScale);
  svg.selectAll('g.x-axis').remove();
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(xAxis);
}

// --- Slider setup ---
let commitProgress = 100;
let timeScale = d3
  .scaleTime()
  .domain([
    d3.min(commits, (d) => d.datetime),
    d3.max(commits, (d) => d.datetime),
  ])
  .range([0, 100]);

let commitMaxTime = timeScale.invert(commitProgress);

const timeSlider = document.getElementById("commit-progress");
const commitTimeDisplay = document.getElementById("commit-time");

// Declare filteredCommits first to avoid "cannot access before initialization"
let filteredCommits = commits;

function onTimeSliderChange() {
  // Get slider value
  commitProgress = Number(timeSlider.value);
  commitMaxTime = timeScale.invert(commitProgress);

  // Update time display
  commitTimeDisplay.textContent = commitMaxTime.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  // Filter commits up to selected time
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);
  updateScatterPlot(filteredCommits);
  updateFileDisplay(filteredCommits);  // <-- ADD THIS
}

// Attach listener
timeSlider.addEventListener("input", onTimeSliderChange);

// Initialize slider display
onTimeSliderChange();


function updateFileDisplay(filteredCommits) {
  // Flatten all lines from filtered commits
  let lines = filteredCommits.flatMap(d => d.lines);

  // Group lines by file
  let files = d3.groups(lines, d => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length); // sort descending

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // Compute maximum number of lines in any file for scaling
  const maxLines = d3.max(files, d => d.lines.length);
  const widthScale = d3.scaleLinear().domain([0, maxLines]).range([0, 100]); // percent

  // Bind data to file containers
  let filesContainer = d3.select('#files')
    .selectAll('div.file')
    .data(files, d => d.name)
    .join(
      enter => enter.append('div')
        .attr('class', 'file')
        .call(div => {
          // dt for filename + total lines
          const dt = div.append('dt');
          dt.append('code'); // filename
          dt.append('span').attr('class', 'total-lines'); // line count
          div.append('dd'); // container for dots
        })
    );

  // Update filename and total lines
  filesContainer.select('dt code').text(d => d.name);
  filesContainer.select('dt .total-lines').text(d => `${d.lines.length} lines`);

  // Update dots inside dd
  filesContainer.select('dd')
    .html('') // clear previous dots
    .selectAll('span.loc')
    .data(d => d.lines)
    .join('span')
    .attr('class', 'loc')
    .style('background-color', d => colors(d.type));

}




