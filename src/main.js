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

const milestoneEvents = {
    1992: "First confirmed exoplanets (pulsar PSR B1257+12)",
    1995: "First planet around a sun-like star (51 Pegasi b)",
    2000: "First transiting exoplanet detected (HD 209458 b)",
    2005: "First direct imaging of an exoplanet (2M1207b)",
    2010: "Kepler's first multi-planet systems confirmed",
    2015: "Kepler-452b discovered ('Earth's Older Cousin')",
    2017: "TRAPPIST-1's 7 Earth-sized planets confirmed"
};

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

// Add event description popup cards for milestone years
const eventPopup = timelineTicks.filter(d => milestoneEvents[d])
    .append('g')
    .attr('class', 'tl-event-popup');

eventPopup.append('rect')
    .attr('rx', 4)
    .attr('ry', 4)
    .attr('width', 295)
    .attr('height', 28)
    .attr('fill', 'var(--bg-2)')
    .attr('stroke', 'var(--rule)')
    .attr('stroke-width', 1);

eventPopup.append('text')
    .attr('x', 10)
    .attr('y', 14)
    .attr('dy', '0.35em')
    .attr('fill', 'var(--ink-1)')
    .attr('font-size', '9.5px')
    .attr('font-family', 'var(--mono)')
    .text(d => milestoneEvents[d]);

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

const yearNarratives = {
    1992: "The era of exoplanet discovery begins. Radio astronomers Aleksander Wolszczan and Dale Frail detect two rocky planets orbiting the pulsar PSR B1257+12, proving planets can survive supernova explosions.",
    1993: "A quiet year of verification. Astronomers confirm the pulsar planets discovered in 1992 and refine their orbital measurements, while searching for the first planets orbiting sun-like stars.",
    1994: "A third planet is detected in the PSR B1257+12 pulsar system. The discovery demonstrates that multi-planet systems exist outside of our solar system.",
    1995: "A monumental milestone. Michel Mayor and Didier Queloz discover 51 Pegasi b, the first exoplanet orbiting a Sun-like star. This \"Hot Jupiter\" challenges existing theories of planet formation.",
    1996: "The \"Hot Jupiter\" rush begins. Five new massive planets are discovered using the Radial Velocity method, including 47 Ursae Majoris b and 70 Virginis b, revealing highly eccentric orbits.",
    1997: "Astronomers discover 16 Cygni Bb, a giant planet in a triple-star system. This discovery highlights the diversity of stellar environments where planets can form.",
    1998: "The first super-Earths and giant planets continue to emerge. Gliese 876 b is discovered, marking one of the first planets found orbiting a red dwarf star close to Earth.",
    1999: "A year of breakthroughs. The first multi-planet system around a main-sequence star (Upsilon Andromedae) is discovered, and astronomers detect the first transiting exoplanet, HD 209458 b.",
    2000: "The transit method is officially established. By observing HD 209458 b passing in front of its star, astronomers calculate a planet's radius and density for the first time.",
    2001: "Using the Hubble Space Telescope, astronomers make the first detection of an exoplanet atmosphere, finding sodium in the atmosphere of the transiting gas giant HD 209458 b.",
    2002: "The first exoplanet discovered using the transit method via a wide-field ground survey (OGLE-TR-56b) is announced, proving the viability of ground-based transit surveys.",
    2003: "Astronomers discover PSR B1620-26 b, nicknamed \"Methuselah.\" At 12.7 billion years old, it is the oldest known exoplanet, forming just 1 billion years after the Big Bang.",
    2004: "A major leap in detection. The first super-Earth orbiting a main-sequence star (55 Cancri e) is found, and the first planet is discovered orbiting a brown dwarf (2M1207b).",
    2005: "The first direct image of an exoplanet (2M1207b) is confirmed. Meanwhile, the Spitzer Space Telescope directly detects infrared light from exoplanets HD 209458 b and TrES-1.",
    2006: "The CoRoT space telescope is launched by CNES/ESA, becoming the first space mission dedicated to searching for exoplanets using the transit method.",
    2007: "Water vapor is detected in the atmosphere of exoplanet HD 189733 b, marking a major step forward in the search for habitable worlds and atmospheric characterization.",
    2008: "A spectacular year for direct imaging. Astronomers capture images of three planets orbiting HR 8799, and the Hubble Space Telescope images a planet candidate inside the dust belt of Fomalhaut.",
    2009: "NASA's Kepler Space Telescope is launched, designed to monitor over 150,000 stars simultaneously. The era of high-precision space-based transit photometry begins.",
    2010: "Kepler announces its first five exoplanet discoveries. Meanwhile, the first multi-planet system detected by radial velocity (HD 10180) reveals up to seven planets.",
    2011: "Kepler-11 is discovered, showing an incredibly packed system of six coplanar planets. Kepler also confirms Kepler-16b, the first planet orbiting two stars (a \"Tatooine\" world).",
    2012: "Kepler discoveries surge, confirming hundreds of candidates. Astronomers also discover Alpha Centauri Bb, a planet candidate orbiting our closest stellar neighbor (later disputed).",
    2013: "Kepler completes its primary mission. Despite mechanical failures, it has revolutionized science by proving that small, rocky planets are more common than gas giants.",
    2014: "Kepler transitions to the K2 mission. A massive release of 715 newly verified planets is announced, validating a new statistical technique called \"multiplicity.\"",
    2015: "Kepler-452b is discovered. Dubbed \"Earth's Older, Bigger Cousin,\" it is the first near-Earth-sized planet orbiting in the habitable zone of a Sun-like star.",
    2016: "A historic year. Astronomers discover Proxima Centauri b, a potentially habitable Earth-mass planet orbiting our closest stellar neighbor, just 4.2 light-years away.",
    2017: "The TRAPPIST-1 system is confirmed, revealing seven Earth-sized temperate rocky planets orbiting an ultra-cool dwarf star, with three planets situated in the habitable zone."
};

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
    
    const narrativeText = yearNarratives[year] || "No narrative available for this year.";
    d3.select('#n-text').text(narrativeText);
}

let lastYear = null;
function updateAll(year, progress) {
    // Position scrubber smoothly
    scrubber
        .attr('opacity', 1)
        .attr('cy', yearYScale(yearScale(progress)));

    // Highlight active year on the timeline
    timeSvg.selectAll('.tl-tick')
        .classed('active', false)
        .filter(d => d === year)
        .classed('active', true);

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

const ssBtn = document.getElementById('ss-zoom-btn');
let ssZoomed = false;
ssBtn.addEventListener('click', () => {
    ssZoomed = !ssZoomed;
    if (ssZoomed) planets.zoomToEarth();
    else          planets.resetZoom();
    ssBtn.textContent = ssZoomed ? 'Back to full sky' : 'Zoom to Earth';
});

const ssToggle = document.getElementById('ss-toggle');
ssToggle.addEventListener('change', () => {
    const visible = ssToggle.checked;
    planets.setSolarSystemVisible(visible);

    ssBtn.disabled = !visible;            // gray out + block clicks when hidden

    if (!visible && ssZoomed) {           // were zoomed into Earth → exit cleanly
        planets.resetZoom();
        ssZoomed = false;
        ssBtn.textContent = 'Zoom to Earth';
    }
});


