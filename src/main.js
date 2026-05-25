import * as d3 from 'd3';
import './style.css';
import {drawLens} from "./lens.js";

const data = await d3.dsv(';', '/data/OpenExoplanetCatalogue.csv', row => ({
    planetIdentifier:     row.PlanetIdentifier,      // planet name, e.g. "HD 143761 b"
    typeFlag:            +row.TypeFlag,              // 0=planet, 1=binary orbit, 2=circumbinary, 3=pulsar
    planetaryMassJpt:    +row.PlanetaryMassJpt,      // planet mass in Jupiter masses
    radiusJpt:           +row.RadiusJpt,             // planet radius in Jupiter radii
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
    rightAscension:       row.RightAscension,        // sky position: like longitude (HH MM SS)
    declination:          row.Declination,           // sky position: like latitude (±DD MM SS)
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
drawLens(svg);

const lensArea = drawLens(svg);
