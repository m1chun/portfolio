import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
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
        // What other options do we need to set?
        // Hint: look up configurable, writable, and enumerable
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

  const dl = stats.selectAll('dl')
    .data(statItems)
    .enter()
    .append('dl');

  dl.append('dt').html(d => d.label);
  dl.append('dd').text(d => d.value);
}

function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');
  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([0, width])
  .nice();
  const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
  const dots = svg.append('g').attr('class', 'dots');

  const colorScale = d3.scaleSequential()
  .domain([0, 24])
  .interpolator(d3.interpolateHslLong("midnightblue", "orange"));

  dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', d => colorScale(d.hourFrac));

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };
  const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
  xScale.range([usableArea.left, usableArea.right]);
  yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Create the axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Add X axis
  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  // Add Y axis
  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
    
}

let data = await loadData();
let commits = processCommits(data);

const fileLengths = d3.rollups(
  data,
  (v) => d3.max(v, (v) => v.line),
  (d) => d.file,
);

const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) => new Date(d.datetime).toLocaleString('en', { hour: 'numeric', hour12: true })
);
const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

const numFiles = d3.groups(data, d => d.file).length;

// Map each row to its weekday (0 = Sunday, 6 = Saturday)
const workByDay = d3.rollups(
  data,
  v => d3.sum(v, d => d.length),     // total "work" per day
  d => new Date(d.datetime).getDay() // group by weekday number
);

// Find the day with the max total work
const maxWorkDayNum = d3.greatest(workByDay, d => d[1])?.[0];

// Optional: convert number to name
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const maxWorkDayName = weekdays[maxWorkDayNum];

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);
