import * as d3 from 'd3';

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

        this.sizeScale = d3.scaleSqrt()
            .range([3,10]);

        this.colorScale = d3.scaleOrdinal()
            .domain(['transit', 'RV', 'imaging', 'microlensing', 'timing'])
            .range(['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff']);

        this.opacityScale = d3.scaleLinear()
            .range([0.7, 0.05]);

        const zoom = d3.zoom()
            .scaleExtent([1, 8])  // min zoom 1x, max zoom 8x
            .on('zoom', (event) => {
                this.config.lensArea.attr('transform', event.transform);
            });

        d3.select(this.config.parentElement).call(zoom);
    }

    updateViz(year) {

        this.filteredData = this.data.filter(d =>
            !isNaN(d.rightAscension) &&
            !isNaN(d.declination) &&
            (!year || d.discoveryYear <= year)
        );

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

        this.sizeScale.domain(d3.extent(this.filteredData, d => d.radiusJpt));
        this.opacityScale.domain(d3.extent(this.filteredData, d => d.distFromSunParsec));

        this.renderViz();
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
