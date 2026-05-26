import * as d3 from 'd3';
import './style.css';
import {drawLens} from "./lens.js";
import PlanetsChart from "./PlanetsChart.js";

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
}));

console.log('Data loaded:', data);

const svg = d3.select('#lens-svg');
const lensArea = drawLens(svg);

const planets = new PlanetsChart(data, {
    parentElement: '#lens-svg',
    lensArea: lensArea,   // the group returned from drawLens
});

planets.updateViz();

// ── Discovery Timeline ───────────────────────────────
const METHOD_COLOR = {
  'transit':         '#4a9ef0',
  'radial velocity': '#f0a830',
  'rv':              '#f0a830',
  'imaging':         '#c070f8',
  'direct imaging':  '#c070f8',
  'microlensing':    '#5fb47c',
  'pulsar':          '#e0524d',
  'pulsar timing':   '#e0524d',
  'astrometry':      '#aab2c8',
};
function tlMethodColor(m) {
  if (!m) return '#6a7390';
  const key = m.toLowerCase();
  for (const k of Object.keys(METHOD_COLOR)) {
    if (key.includes(k)) return METHOD_COLOR[k];
  }
  return '#6a7390';
}

function buildTimeline(planets) {
  const byYear = {};
  planets.forEach(p => {
    const yr = p.discoveryYear;
    if (!yr || isNaN(yr)) return;
    if (!byYear[yr]) byYear[yr] = [];
    byYear[yr].push(p);
  });

  const inner = document.getElementById('tl-inner');
  inner.innerHTML = '';
  let total = 0;
  let selectedEl = null;

  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  years.forEach(yr => {
    const group = byYear[yr];
    total += group.length;

    const col = document.createElement('div');
    col.className = 'tl-year-group';

    const label = document.createElement('div');
    label.className = 'tl-year-label';
    label.textContent = yr;
    col.appendChild(label);

    const list = document.createElement('div');
    list.className = 'tl-planet-list';

    group.forEach(p => {
      const row = document.createElement('div');
      row.className = 'tl-planet';

      const dot = document.createElement('div');
      dot.className = 'tl-dot';
      const color = tlMethodColor(p.discoveryMethod);
      dot.style.background = color;
      dot.style.boxShadow = `0 0 5px ${color}88`;

      const name = document.createElement('span');
      name.className = 'tl-planet-name';
      name.textContent = p.planetIdentifier || '—';

      const method = document.createElement('span');
      method.className = 'tl-planet-method';
      method.textContent = p.discoveryMethod || '';

      row.appendChild(dot);
      row.appendChild(name);
      row.appendChild(method);

      row.addEventListener('click', () => {
        if (selectedEl) selectedEl.classList.remove('selected');
        row.classList.add('selected');
        selectedEl = row;
        const info = document.getElementById('tl-selected-info');
        info.textContent = `▸ ${p.planetIdentifier}  ·  ${yr}  ·  ${p.discoveryMethod || 'unknown'}`;
      });

      list.appendChild(row);
    });

    col.appendChild(list);
    inner.appendChild(col);
  });

  document.getElementById('tl-count').textContent = total.toLocaleString() + ' planets';
}

buildTimeline(data);

