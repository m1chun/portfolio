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


renderCommitInfo(data, commits);
