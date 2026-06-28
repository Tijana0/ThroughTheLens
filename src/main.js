import * as d3 from 'd3';
import './style.css';
import scrollama from 'scrollama';
import {drawLens} from "./lens.js";
import PlanetsChart from "./PlanetsChart.js";
import YieldChart from "./YieldChart.js";
import CompletenessChart from "./CompletenessChart.js";
import HabitabilityChart from "./HabitabilityChart.js";
import CoverageChart from "./CoverageChart.js";
import DiscoveryShareChart from "./DiscoveryShareChart.js";
import HotJupitersChart from "./HotJupitersChart.js";

// parsing functions
function parseRA(str) {
    if (!str) return NaN;
    const [h, m, s] = str.trim().split(' ').map(Number);
    return (h + m / 60 + s / 3600) * 15;
}

function parseDec(str) {
    if (!str) return NaN;
    const parts = str.trim().split(' ').map(Number);
    const sign = parts[0] < 0 ? -1 : 1;
    return sign * (Math.abs(parts[0]) + parts[1] / 60 + parts[2] / 3600);
}

const data = await d3.dsv(';', '/data/OpenExoplanetCatalogue.csv', row => ({
    planetIdentifier: row.PlanetIdentifier,      // planet name, e.g. "HD 143761 b"
    typeFlag: +row.TypeFlag,              // 0=planet, 1=binary orbit, 2=circumbinary, 3=pulsar
    planetaryMassJpt: +row.PlanetaryMassJpt,      // planet mass in Jupiter masses
    radiusJpt: +row.RadiusJpt,             // planet radius in Jupiter radii
    periodDays:          +row.PeriodDays,            // orbital period in days
    semiMajorAxisAU:     +row.SemiMajorAxisAU,       // orbit size in AU (1 = Earth-Sun distance)
    eccentricity:        +row.Eccentricity,          // orbit shape: 0 = circle, 1 = parabolic
    periastronDeg:       +row.PeriastronDeg,         // angle of closest point in orbit (degrees)
    longitudeDeg:        +row.LongitudeDeg,          // orbital longitude reference angle (degrees)
    ascendingNodeDeg:    +row.AscendingNodeDeg,      // where orbit crosses the reference plane (degrees)
    inclinationDeg:      +row.InclinationDeg,        // orbit tilt: 90° = edge-on to us
    surfaceTempK:        +row.SurfaceTempK,          // estimated surface temperature in Kelvin
    ageGyr:              +row.AgeGyr,                // planet age in billions of years
    discoveryMethod:      row.DiscoveryMethod,       // how it was found, e.g. "RV", "Transit", "Imaging"
    discoveryYear:       +row.DiscoveryYear,         // year of discovery
    lastUpdated:          row.LastUpdated,           // last catalogue update (YY/MM/DD)
    rightAscension: parseRA(row.RightAscension),     // sky position: like longitude (HH MM SS)
    declination:    parseDec(row.Declination),       // sky position: like latitude (±DD MM SS)
    distFromSunParsec:   +row.DistFromSunParsec,     // distance from Sun in parsecs (1pc ≈ 3.26 ly)
    hostStarMassSlrMass: +row.HostStarMassSlrMass,   // host star mass in solar masses (1 = our Sun)
    hostStarRadiusSlrRad:+row.HostStarRadiusSlrRad,  // host star radius in solar radii
    hostStarMetallicity: +row.HostStarMetallicity,   // star metal content vs Sun (log scale, 0 = solar)
    hostStarTempK:       +row.HostStarTempK,         // host star surface temperature in Kelvin
    hostStarAgeGyr:      +row.HostStarAgeGyr,        // host star age in billions of years
    listsPlanetIsOn:      row.ListsPlanetIsOn,       // catalogue category, e.g. "Confirmed planets"
    
    // Legacy support for capitalized coverage chart keys
    PlanetIdentifier: row.PlanetIdentifier,
    LastUpdated: row.LastUpdated,
    DiscoveryYear: +row.DiscoveryYear,
    DiscoveryMethod: row.DiscoveryMethod,
    RightAscension: row.RightAscension,
    Declination: row.Declination,
    ListsPlanetIsOn: row.ListsPlanetIsOn,
    TypeFlag: +row.TypeFlag,
    HostStarTempK: +row.HostStarTempK,
    HostStarMassSlrMass: +row.HostStarMassSlrMass,
    HostStarRadiusSlrRad: +row.HostStarRadiusSlrRad,
    HostStarMetallicity: +row.HostStarMetallicity,
    DistFromSunParsec: +row.DistFromSunParsec,
    HostStarAgeGyr: +row.HostStarAgeGyr,
    PeriodDays: +row.PeriodDays,
    RadiusJpt: +row.RadiusJpt,
    SemiMajorAxisAU: +row.SemiMajorAxisAU,
    PlanetaryMassJpt: +row.PlanetaryMassJpt,
    Eccentricity: +row.Eccentricity,
    SurfaceTempK: +row.SurfaceTempK,
    InclinationDeg: +row.InclinationDeg,
    PeriastronDeg: +row.PeriastronDeg,
    AscendingNodeDeg: +row.AscendingNodeDeg,
    LongitudeDeg: +row.LongitudeDeg,
    AgeGyr: +row.AgeGyr,
}));

const svg = d3.select('#lens-svg');
const lensArea = drawLens(svg);

const planets = new PlanetsChart(data, {
    parentElement: '#lens-svg',
    lensArea: lensArea,
});

const yieldChart = new YieldChart(data, {
    parentElement: '#g-yield'
});

const completenessChart = new CompletenessChart(data, {
    parentElement: '#g-complete'
});

const hotJupitersChart = new HotJupitersChart(data, {
    parentElement: '#p1-svg'
});

const habitabilityChart = new HabitabilityChart(data, {
    parentElement: '#p2-svg'
});

const coverageChart = new CoverageChart(data, {
    parentElement: '#p3-svg'
});

const discoveryShareChart = new DiscoveryShareChart(data, {
    parentElement: '#p4-svg'
});

// Timeline Setup
const timeSvg = d3.select('#timeline-svg');
const yearsRange = d3.range(1992, 2018);

const yearScale = d3.scaleLinear()
    .domain([0, 1])
    .range([1992, 2017])
    .clamp(true);

const yearYScale = d3.scaleLinear()
    .domain([1992, 2017])
    .range([110, window.innerHeight - 60])
    .clamp(true);

// Draw the vertical axis line
timeSvg.append('line')
    .attr('class', 'timeline-axis-line')
    .attr('x1', 22)
    .attr('y1', yearYScale(1992))
    .attr('x2', 22)
    .attr('y2', yearYScale(2017))
    .attr('stroke', 'var(--rule)')
    .attr('stroke-width', 1);

// Draw year tick groups
const timelineTicks = timeSvg.selectAll('.tl-tick')
    .data(yearsRange)
    .join('g')
    .attr('class', d => `tl-tick tl-tick-${d}`)
    .attr('transform', d => `translate(0, ${yearYScale(d)})`);

// Add tick line
timelineTicks.append('line')
    .attr('x1', 18)
    .attr('x2', 26)
    .attr('y1', 0)
    .attr('y2', 0)
    .attr('stroke', 'var(--rule)')
    .attr('stroke-width', d => (d % 5 === 0 || d === 1992 || d === 2017) ? 1.5 : 1);

// Add year text labels (hidden by default except milestones)
timelineTicks.append('text')
    .attr('x', 34)
    .attr('y', 0)
    .attr('dy', '0.35em')
    .attr('fill', 'var(--ink-3)')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--mono)')
    .attr('class', d => `tl-tick-label ${(d % 5 === 0 || d === 1992 || d === 2017) ? 'milestone' : ''}`)
    .text(d => d);

// Make ticks clickable for smooth scrolling
timelineTicks
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
        const stepIndex = d - 1992;
        const stepEl = document.querySelectorAll('.step')[stepIndex];
        if (stepEl) {
            stepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

// Scrubber Setup
const scrubber = timeSvg.append('circle')
    .attr('id', 'scrubber')
    .attr('cx', 22)
    .attr('r', 4)
    .attr('fill', 'var(--amber)')
    .attr('opacity', 0);

function updateNarrativeCard(year) {
    const allUntilNow = data.filter(d => d.discoveryYear <= year && d.discoveryYear > 0);
    const thisYearBatch = data.filter(d => d.discoveryYear === year);
    
    const runningTotal = allUntilNow.length;
    const thisYearTotal = thisYearBatch.length;
    
    const methods = d3.rollups(allUntilNow, v => v.length, d => d.discoveryMethod);
    const topMethodEntry = d3.greatest(methods, d => d[1]);
    const topMethod = topMethodEntry ? topMethodEntry[0] : '—';
    
    d3.select('#n-year').text(year);
    d3.select('#n-this').text(thisYearTotal);
    d3.select('#n-run').text(runningTotal.toLocaleString());
    d3.select('#n-mix').text(topMethod);
    
    d3.select('#n-text').text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
}

let lastYear = null;
function updateAll(year, progress) {
    // Position scrubber smoothly
    scrubber
        .attr('opacity', 1)
        .attr('cy', yearYScale(yearScale(progress)));

    // Highlight active year on the timeline
    timeSvg.selectAll('.tl-tick-label')
        .classed('active', false)
        .filter(d => d === year)
        .classed('active', true);

    timeSvg.selectAll('.tl-tick line')
        .attr('stroke', d => d === year ? 'var(--amber)' : 'var(--rule)');

    // expensive: only redo when the integer year actually changes
    if (year === lastYear) return;
    lastYear = year;

    planets.updateViz(year);
    yieldChart.setYear(year);
    completenessChart.update(year);
    updateNarrativeCard(year);
}

const scroller = scrollama();

scroller
    .setup({
        step: '.step',
        progress: true,
        offset: 0.6
    })
    .onStepProgress(response => {
        const stepCount = d3.selectAll('.step').size();
        const globalProgress = Math.min(1.0, (response.index + response.progress) / (stepCount - 0.5));
        const year = Math.floor(yearScale(globalProgress));
        updateAll(year, globalProgress);
    });

updateAll(1992, 0);

const modeToggle = document.getElementById('ll-mode-toggle');
const modeText   = document.getElementById('ll-mode-text');
modeToggle.addEventListener('change', () => {
    const thisYear = modeToggle.checked;
    modeText.textContent = thisYear
        ? 'Only planets discovered this year'
        : 'All planets up to this year';
    planets.setMode(thisYear ? 'thisYear' : 'cumulative');
});

const totalCount = data.length;
d3.select('#term-total').text(totalCount.toLocaleString());

const streamContainer = d3.select('#term-stream');
function addLine() {
    const d = data[Math.floor(Math.random() * data.length)];
    const massVal = isNaN(d.planetaryMassJpt) ? '<span class="err">[ERR]</span>' : `<span class="val">${d.planetaryMassJpt.toFixed(2)} Mj</span>`;
    const tempVal = isNaN(d.surfaceTempK) ? '<span class="err">[NULL]</span>' : `<span class="val">${d.surfaceTempK}K</span>`;

    streamContainer.append('div')
        .attr('class', 'term-line')
        .html(`ID: ${d.planetIdentifier.slice(0,16).padEnd(16)} <span>|</span> MASS: ${massVal} <span>|</span> TEMP: ${tempVal}`);

    const lines = streamContainer.selectAll('.term-line');
    if (lines.size() > 8) {
        lines.filter((d, i) => i === 0).remove();
    }
}
setInterval(addLine, 1000);


