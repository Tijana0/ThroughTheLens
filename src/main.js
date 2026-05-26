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

const data = await d3.dsv(';', '/data/OpenExoplanetCatalogue.csv', row => {
    const n = (v) => v === "" ? NaN : +v;

    return {
        PlanetIdentifier: row.PlanetIdentifier,
        LastUpdated: row.LastUpdated,
        DiscoveryYear: n(row.DiscoveryYear),
        DiscoveryMethod: row.DiscoveryMethod,
        RightAscension: row.RightAscension,
        Declination: row.Declination,
        ListsPlanetIsOn: row.ListsPlanetIsOn,
        TypeFlag: row.TypeFlag,
        HostStarTempK: n(row.HostStarTempK),
        HostStarMassSlrMass: n(row.HostStarMassSlrMass),
        HostStarRadiusSlrRad: n(row.HostStarRadiusSlrRad),
        HostStarMetallicity: n(row.HostStarMetallicity),
        DistFromSunParsec: n(row.DistFromSunParsec),
        HostStarAgeGyr: n(row.HostStarAgeGyr),
        PeriodDays: n(row.PeriodDays),
        RadiusJpt: n(row.RadiusJpt),
        SemiMajorAxisAU: n(row.SemiMajorAxisAU),
        PlanetaryMassJpt: n(row.PlanetaryMassJpt),
        Eccentricity: n(row.Eccentricity),
        SurfaceTempK: n(row.SurfaceTempK),
        InclinationDeg: n(row.InclinationDeg),
        PeriastronDeg: n(row.PeriastronDeg),
        AscendingNodeDeg: n(row.AscendingNodeDeg),
        LongitudeDeg: n(row.LongitudeDeg),
        AgeGyr: n(row.AgeGyr),
        
        // Aliases for compatibility with other components
        planetIdentifier: row.PlanetIdentifier,
        radiusJpt: n(row.RadiusJpt),
        planetaryMassJpt: n(row.PlanetaryMassJpt),
        periodDays: n(row.PeriodDays),
        discoveryMethod: row.DiscoveryMethod,
        discoveryYear: n(row.DiscoveryYear),
        rightAscension: parseRA(row.RightAscension),
        declination: parseDec(row.Declination),
        distFromSunParsec: n(row.DistFromSunParsec),
        hostStarMetallicity: n(row.HostStarMetallicity),
        surfaceTempK: n(row.SurfaceTempK),
    };
});

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

// Timeline Point (Scrubber) Setup
const timeSvg = d3.select('#timeline-svg');
const scrubber = timeSvg.append('circle')
    .attr('id', 'scrubber')
    .attr('cx', 22)
    .attr('r', 4)
    .attr('fill', 'var(--amber)')
    .attr('opacity', 0);

const yearScale = d3.scaleLinear()
    .domain([0, 1])
    .range([1989, 2017])
    .clamp(true);

const yPosScale = d3.scaleLinear()
    .domain([0, 1])
    .range([110, window.innerHeight - 60])
    .clamp(true);

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

function updateAll(year, progress) {
    planets.updateViz(year);
    yieldChart.setYear(year);
    completenessChart.update(year);
    updateNarrativeCard(year);
    
    scrubber
        .attr('opacity', 1)
        .attr('cy', yPosScale(progress));
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

updateAll(1989, 0);

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

window.updateTimeline = updateAll;
