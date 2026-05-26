import * as d3 from 'd3';
import './style.css';
import scrollama from 'scrollama';
import {drawLens} from "./lens.js";
import PlanetsChart from "./PlanetsChart.js";
import YieldChart from "./YieldChart.js";

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
    planetIdentifier: row.PlanetIdentifier,
    radiusJpt: +row.RadiusJpt,
    discoveryMethod:      row.DiscoveryMethod,
    discoveryYear:       +row.DiscoveryYear,
    rightAscension: parseRA(row.RightAscension),
    declination:    parseDec(row.Declination),
    distFromSunParsec:   +row.DistFromSunParsec,
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

// Timeline Point (Scrubber) Setup
const timeSvg = d3.select('#timeline-svg');
const scrubber = timeSvg.append('circle')
    .attr('id', 'scrubber')
    .attr('cx', 22) // Align with .timeline-axis left: 22px
    .attr('r', 4)
    .attr('fill', 'var(--amber)')
    .attr('opacity', 0);

const yearScale = d3.scaleLinear()
    .domain([0, 1]) // scroll progress
    .range([1989, 2017])
    .clamp(true);

const yPosScale = d3.scaleLinear()
    .domain([0, 1])
    .range([110, 600]) // Match .timeline-axis top/bottom roughly
    .clamp(true);

// Step 2: The Note Card Update Function
function updateNarrativeCard(year) {
    const allUntilNow = data.filter(d => d.discoveryYear <= year && d.discoveryYear > 0);
    const thisYearBatch = data.filter(d => d.discoveryYear === year);
    
    const runningTotal = allUntilNow.length;
    const thisYearTotal = thisYearBatch.length;
    
    // Method mix (top method)
    const methods = d3.rollups(allUntilNow, v => v.length, d => d.discoveryMethod);
    const topMethodEntry = d3.greatest(methods, d => d[1]);
    const topMethod = topMethodEntry ? topMethodEntry[0] : '—';
    
    d3.select('#n-year').text(year);
    d3.select('#n-this').text(thisYearTotal);
    d3.select('#n-run').text(runningTotal.toLocaleString());
    d3.select('#n-mix').text(topMethod);
    
    // Narrative text logic
    let text = "The search for other worlds continues.";
    if (year <= 1995) text = "51 Pegasi b is discovered, the first exoplanet found orbiting a Sun-like star.";
    else if (year <= 2009) text = "The number of known planets grows as ground-based surveys mature.";
    else if (year <= 2013) text = "The Kepler Mission begins to reveal a universe teeming with planets of all sizes.";
    else if (year >= 2016) text = "Seven Earth-sized planets are found orbiting the ultra-cool dwarf star TRAPPIST-1.";
    
    d3.select('#n-text').text(text);
}

// Global update function
function updateAll(year, progress) {
    planets.updateViz(year);
    yieldChart.setYear(year);
    updateNarrativeCard(year);
    
    // Move the timeline point
    scrubber
        .attr('opacity', 1)
        .attr('cy', yPosScale(progress));
}

// Scrollama Setup
const scroller = scrollama();

scroller
    .setup({
        step: '.step',
        progress: true,
        offset: 0.5
    })
    .onStepProgress(response => {
        // Calculate global progress across all steps
        // response.progress is 0 to 1 for the current step
        // We can simplify this for the skeleton:
        const stepCount = d3.selectAll('.step').size();
        const globalProgress = (response.index + response.progress) / stepCount;
        const year = Math.floor(yearScale(globalProgress));
        updateAll(year, globalProgress);
    });

// Initial state
updateAll(1989, 0);

window.updateTimeline = updateAll;
