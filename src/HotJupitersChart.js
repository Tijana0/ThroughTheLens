import * as d3 from 'd3';
import { createMethodColorScale, mapMethod } from './methodColors.js';

export default class HotJupitersChart {
    constructor(data, config) {
        this.data = data.filter(d => 
            !isNaN(d.periodDays) && 
            !isNaN(d.hostStarMetallicity) && 
            d.periodDays > 0
        );
        this.config = {
            parentElement: config.parentElement,
            width: 620,
            height: 360,
        };
        this.initViz();
    }

    initViz() {
        this.svg = d3.select(this.config.parentElement)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        this.margin = { top: 20, right: 20, bottom: 40, left: 85 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // X: Metallicity (linear)
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.hostStarMetallicity))
            .range([0, this.innerWidth])
            .nice();

        // Y: Period (log)
        this.yScale = d3.scaleLog()
            .domain(d3.extent(this.data, d => d.periodDays))
            .range([this.innerHeight, 0])
            .nice();

        this.colorScale = createMethodColorScale();

        // Gridlines
        [0.1, 1, 10, 100, 1000, 10000].forEach(v => {
            this.g.append('line')
                .attr('class', 'gridline')
                .attr('y1', this.yScale(v)).attr('y2', this.yScale(v))
                .attr('x1', 0).attr('x2', this.innerWidth);
        });

        // Axes
        this.g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale).ticks(5))
            .attr('class', 'axis');

        this.g.append('g')
            .call(d3.axisLeft(this.yScale).ticks(5, '.1f'))
            .attr('class', 'axis');

        // Labels
        this.g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .attr('font-family', 'var(--mono)')
            .text('HOST STAR METALLICITY ([Fe/H])');

        this.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -70)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .attr('font-family', 'var(--mono)')
            .text('ORBITAL PERIOD (DAYS) · LOG');

        this.render();
    }

    render() {
        const tip = d3.select('#tip');

        this.g.selectAll('.planet-dot')
            .data(this.data)
            .join('circle')
            .attr('class', 'planet-dot')
            .attr('cx', d => this.xScale(d.hostStarMetallicity))
            .attr('cy', d => this.yScale(d.periodDays))
            .attr('r', 3)
            .attr('fill', d => this.colorScale(mapMethod(d.discoveryMethod)))
            .attr('opacity', 0.5)
            .style('pointer-events', 'all')
            .on('mouseenter', (event, d) => {
                const met = d.hostStarMetallicity;
                const ratio = Math.pow(10, met);
                const percent = (ratio * 100).toFixed(0);
                const comparisonText = met >= 0 
                    ? `${percent}% more metal-heavy than our Sun`
                    : `${(100 - (ratio * 100)).toFixed(0)}% less metal-heavy than our Sun`;

                tip.classed('show', true);
                d3.select('#tip-name').text(d.planetIdentifier);
                d3.select('#tip-body').html(`
                    <div class="t-row"><span class="label">Metallicity</span><span class="val">${met > 0 ? '+' : ''}${met} dex</span></div>
                    <div style="font-size:9px; color:var(--ink-4); margin-bottom:8px;">[${comparisonText}]</div>
                    
                    <div class="t-row"><span class="label">Orbital Period</span><span class="val">${d.periodDays.toFixed(1)} days</span></div>
                    <div class="t-row"><span class="label">Method</span><span class="val">${d.discoveryMethod}</span></div>
                    <div class="t-row"><span class="label">Distance</span><span class="val">${isNaN(d.distFromSunParsec) ? '—' : d.distFromSunParsec.toFixed(0) + ' pc'}</span></div>
                    <div class="t-row"><span class="label">Host Star Temp</span><span class="val">${isNaN(d.hostStarTempK) ? '—' : d.hostStarTempK.toFixed(0) + ' K'}</span></div>
                    <div class="t-row"><span class="label">Discovery Year</span><span class="val">${d.discoveryYear}</span></div>
                `);
                
                d3.select(event.currentTarget).attr('r', 6).attr('opacity', 1);
            })
            .on('mousemove', (event) => {
                tip.style('left', (event.clientX + 20) + 'px')
                   .style('top', (event.clientY - 20) + 'px');
            })
            .on('mouseleave', (event) => {
                tip.classed('show', false);
                d3.select(event.currentTarget).attr('r', 3).attr('opacity', 0.5);
            });
            
        // Style axes
        this.svg.selectAll('.axis line, .axis path').attr('stroke', '#3a425c');
        this.svg.selectAll('.axis text').attr('fill', '#6a7390').attr('font-size', '9px');
    }
}
