import * as d3 from 'd3';

const SS_STYLE = {
  Mercury: ['#b8b0a8', '#6e6660'],
  Venus:   ['#efd9a0', '#b08a45'],
  Earth:   ['#6fb8ec', '#234f86'],
  Mars:    ['#e07a52', '#8f3320'],
  Jupiter: ['#e8d3ad', '#b07d4e'],
  Saturn:  ['#ecdcab', '#b89a59'],
  Uranus:  ['#bfe9e6', '#6cb6b0'],
  Neptune: ['#6b8be0', '#283f86'],
};
const SS_NAMES = Object.keys(SS_STYLE);

export default class PlanetsChart {

    constructor(data, config) {
        this.data = data;
        this.config = {
            parentElement: config?.parentElement ?? '#lens-svg',
            lensArea:      config?.lensArea,        // the clipped group from drawLens
            lensRadius:    config?.lensRadius ?? 182,
            cx:            config?.cx ?? 230,
            cy:            config?.cy ?? 230,
        };

        this.mode = 'cumulative';   // or 'thisYear'
        this.currentYear = null;

        this.initViz();
    }

    initViz() {

        const { lensRadius, cx, cy } = this.config;

        this.xScale = d3.scaleLinear()
            .range([cx - lensRadius, cx + lensRadius]);

        this.yScale = d3.scaleLinear()
            .range([cy + lensRadius, cy - lensRadius]);

        // Pre-calculate static domains based on full dataset
        const fullFiltered = this.data.filter(d => !isNaN(d.rightAscension) && !isNaN(d.declination));
        this.xScale.domain(d3.extent(fullFiltered, d => d.rightAscension));
        this.yScale.domain(d3.extent(fullFiltered, d => d.declination));

        // Solar System reference set (kept out of the normal dot field)
        this.solarSystem = this.data.filter(d => SS_NAMES.includes(d.planetIdentifier));

        // horizontal "mini solar system" layout, spaced by true orbital distance
        this.ssY = cy + 85;
        this.ssXScale = d3.scaleLog()
            .domain([0.3, 31])          // ~Mercury (0.39 AU) → Neptune (30 AU)
            .range([cx - 90, cx + 90]); // kept inside the lens clip circle

        this.sizeScale = d3.scaleSqrt()
            .range([3,10])
            .domain(d3.extent(fullFiltered, d => d.radiusJpt));

        this.colorScale = d3.scaleOrdinal()
            .domain(['transit', 'RV', 'imaging', 'microlensing', 'timing'])
            .range(['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff']);

        this.opacityScale = d3.scaleLinear()
            .range([0.7, 0.05])
            .domain(d3.extent(fullFiltered, d => d.distFromSunParsec));

        this.zoom = d3.zoom()
            .scaleExtent([1, 20])  // raised so the tiny planets can be magnified
            .on('zoom', (event) => {
                this.config.lensArea.attr('transform', event.transform);
            });

        d3.select(this.config.parentElement).call(this.zoom);

        this.drawSolarSystem();     // static layer — drawn once
    }

    drawSolarSystem() {
        // gradient per planet → a lit-sphere look
        const defs = d3.select(this.config.parentElement).append('defs');
        Object.entries(SS_STYLE).forEach(([name, [light, dark]]) => {
            const g = defs.append('radialGradient')
                .attr('id', `ss-${name}`)
                .attr('cx', '35%').attr('cy', '35%').attr('r', '65%');
            g.append('stop').attr('offset', '0%').attr('stop-color', light);
            g.append('stop').attr('offset', '100%').attr('stop-color', dark);
        });

        this.ssGroup = this.config.lensArea.append('g').attr('class', 'solar-system');

        // a small sun at the left end of the row
        this.ssGroup.append('circle')
            .attr('class', 'ss-sun')
            .attr('cx', this.ssXScale.range()[0] - 12)
            .attr('cy', this.ssY)
            .attr('r', 4)
            .attr('fill', '#ffd45e');

        const node = this.ssGroup.selectAll('.ss-planet')
            .data(this.solarSystem, d => d.planetIdentifier)
            .join('g')
            .attr('class', 'ss-planet')
            .attr('transform', d => `translate(${this.ssXScale(d.SemiMajorAxisAU)},${this.ssY})`);

        // Saturn's ring first, so the body paints over it
        node.filter(d => d.planetIdentifier === 'Saturn')
            .append('ellipse')
            .attr('rx', d => this.sizeScale(d.radiusJpt) * 1.9)
            .attr('ry', d => this.sizeScale(d.radiusJpt) * 0.55)
            .attr('fill', 'none')
            .attr('stroke', '#d8c184')
            .attr('stroke-width', 0.7)
            .attr('transform', 'rotate(-18)');

        node.append('circle')
            .attr('r', d => this.sizeScale(d.radiusJpt))
            .attr('fill', d => `url(#ss-${d.planetIdentifier})`);

        // hover tooltip, reusing the exoplanet tip
        node.on('mouseover', (event, d) => {
            const tip = d3.select('#tip');
            tip.classed('show', true);
            d3.select('#tip-name').text(d.planetIdentifier);
            d3.select('#tip-body').html(`
                <div class="t-row"><span class="label">Solar System</span><span class="val">reference</span></div>
                <div class="t-row"><span class="label">Distance</span><span class="val">${isNaN(d.SemiMajorAxisAU) ? '—' : d.SemiMajorAxisAU.toFixed(2)} AU</span></div>
                <div class="t-row"><span class="label">Radius</span><span class="val">${isNaN(d.radiusJpt) ? '—' : d.radiusJpt.toFixed(3)} Rjpt</span></div>
            `);
        });
        node.on('mousemove', (event) => {
            d3.select('#tip')
                .style('left', (event.clientX + 20) + 'px')
                .style('top',  (event.clientY - 20) + 'px');
        });
        node.on('mouseleave', () => d3.select('#tip').classed('show', false));
    }

    zoomToEarth() {
        const { cx, cy } = this.config;
        const earth = this.solarSystem.find(p => p.planetIdentifier === 'Earth');
        if (!earth) return;
        const k = 14;   // strong zoom — Earth is tiny
        const fx = this.ssXScale(earth.SemiMajorAxisAU);  // Earth's x in the row
        const fy = this.ssY;
        const t = d3.zoomIdentity
            .translate(cx - fx * k, cy - fy * k)          // put Earth at lens center
            .scale(k);
        d3.select(this.config.parentElement)
            .transition().duration(750)
            .call(this.zoom.transform, t);
    }

    resetZoom() {
        d3.select(this.config.parentElement)
            .transition().duration(750)
            .call(this.zoom.transform, d3.zoomIdentity);
    }

    setSolarSystemVisible(visible) {
        if (this.ssGroup) this.ssGroup.attr('display', visible ? null : 'none');
    }

    updateViz(year) {

        this.currentYear = year;

        this.filteredData = this.data.filter(d => {
            if (isNaN(d.rightAscension) || isNaN(d.declination)) return false;
            if (!year) return true;
            return this.mode === 'thisYear'
                ? d.discoveryYear === year      // only planets discovered this year
                : d.discoveryYear <= year;      // all planets up to this year
        });

        this.filteredData.forEach(d => {
            // Use the original capitalized keys from the merged dataset
            d.isIncomplete = isNaN(d.PlanetaryMassJpt) ||
                isNaN(d.RadiusJpt) ||
                isNaN(d.PeriodDays) ||
                isNaN(d.SurfaceTempK) ||
                isNaN(d.DistFromSunParsec) ||
                isNaN(d.HostStarTempK) ||
                !d.DiscoveryMethod;
        });

        this.renderViz();

        d3.select('#ll-year').text(year);
        d3.select('#ll-count').text(this.filteredData.length.toLocaleString());
    }

    setMode(mode) {
        this.mode = mode;
        if (this.currentYear != null) this.updateViz(this.currentYear);
    }

    renderViz() {
        const { lensArea } = this.config;
const circles = lensArea.selectAll('.planet')
    .data(this.filteredData, d => d.planetIdentifier)
    .join('circle')
    .attr('class', d => d.isIncomplete ? 'planet glitch' : 'planet')
    .attr('fill', d => this.colorScale(d.discoveryMethod?.toLowerCase()))
    .attr('opacity', d => isNaN(d.distFromSunParsec) ? 0.5 : this.opacityScale(d.distFromSunParsec))
    .attr('cx', d => this.xScale(d.rightAscension))
    .attr('cy', d => this.yScale(d.declination))
    .attr('r', d => isNaN(d.radiusJpt) ? 2 : this.sizeScale(d.radiusJpt));

        if (this.ssGroup) this.ssGroup.raise();

        circles.on('mouseover', (event, d) => {
            const tip = d3.select('#tip');
            tip.classed('show', true);
            d3.select('#tip-name').text(d.planetIdentifier);
            d3.select('#tip-body').html(`
                <div class="t-row"><span class="label">Discovery Year</span><span class="val">${isNaN(d.DiscoveryYear) || d.DiscoveryYear === 0 ? '—' : d.DiscoveryYear}</span></div>
                <div class="t-row"><span class="label">Method</span><span class="val">${d.DiscoveryMethod || '—'}</span></div>
                <div class="t-row"><span class="label">Period</span><span class="val">${isNaN(d.PeriodDays) || d.PeriodDays === 0 ? '—' : d.PeriodDays.toFixed(1)} days</span></div>
                <div class="t-row"><span class="label">Radius</span><span class="val">${isNaN(d.RadiusJpt) || d.RadiusJpt === 0 ? '—' : d.RadiusJpt.toFixed(2)} Rjpt</span></div>
                <div class="t-row"><span class="label">Mass</span><span class="val">${isNaN(d.PlanetaryMassJpt) || d.PlanetaryMassJpt === 0 ? '—' : d.PlanetaryMassJpt.toFixed(2)} Mjpt</span></div>
            `);
        });

        circles.on('mousemove', (event) => {
            d3.select('#tip')
                .style('left', (event.clientX + 20) + 'px')
                .style('top',  (event.clientY - 20) + 'px');
        });

        circles.on('mouseleave', () => {
            d3.select('#tip').classed('show', false);
        });
    }
}
