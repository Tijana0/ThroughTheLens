import * as d3 from 'd3';

export default class HabitabilityChart {
    constructor(data, config) {
        // Separate Solar System from Exoplanets
        this.allData = data.filter(d => !isNaN(d.radiusJpt) && !isNaN(d.periodDays) && d.radiusJpt > 0 && d.periodDays > 0);
        this.exoData = this.allData.filter(d => !d.planetIdentifier.includes('Earth') && 
                                               !d.planetIdentifier.includes('Jupiter') && 
                                               !d.planetIdentifier.includes('Mars') &&
                                               !d.planetIdentifier.includes('Venus') &&
                                               !d.planetIdentifier.includes('Saturn') &&
                                               !d.planetIdentifier.includes('Uranus') &&
                                               !d.planetIdentifier.includes('Neptune') &&
                                               !d.planetIdentifier.includes('Mercury') &&
                                               !d.planetIdentifier.includes('Pluto'));
        
        this.ssData = this.allData.filter(d => d.planetIdentifier === 'Earth' || 
                                              d.planetIdentifier === 'Jupiter' || 
                                              d.planetIdentifier === 'Mars' ||
                                              d.planetIdentifier === 'Venus' ||
                                              d.planetIdentifier === 'Saturn' ||
                                              d.planetIdentifier === 'Uranus' ||
                                              d.planetIdentifier === 'Neptune' ||
                                              d.planetIdentifier === 'Mercury' ||
                                              d.planetIdentifier === 'Pluto');

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

        this.margin = { top: 20, right: 20, bottom: 40, left: 60 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Scales (Log-Log)
        this.xScale = d3.scaleLog()
            .domain([0.005, 3]) // Radius in Jupiter radii
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLog()
            .domain([0.1, 200000]) // Period in days
            .range([this.innerHeight, 0]);

        // Undetectable Region
        const undetX0 = this.xScale(0.005);
        const undetX1 = this.xScale(0.18);
        const undetY0 = this.yScale(200000);
        const undetY1 = this.yScale(50);

        this.g.append('rect')
            .attr('x', undetX0)
            .attr('y', undetY0)
            .attr('width', undetX1 - undetX0)
            .attr('height', undetY1 - undetY0)
            .attr('fill', '#e0524d')
            .attr('fill-opacity', 0.14)
            .attr('stroke', '#e0524d')
            .attr('stroke-opacity', 0.55)
            .attr('stroke-dasharray', '4 3')
            .attr('stroke-width', 1);

        this.g.append('text')
            .attr('x', undetX0 + 8)
            .attr('y', undetY1 - 25)
            .attr('fill', '#ff8a82')
            .attr('font-size', '9px')
            .attr('letter-spacing', '0.1em')
            .text('UNDETECTABLE WITH');

        this.g.append('text')
            .attr('x', undetX0 + 8)
            .attr('y', undetY1 - 12)
            .attr('fill', '#ff8a82')
            .attr('font-size', '9px')
            .attr('letter-spacing', '0.1em')
            .text('CURRENT TECHNOLOGY');

        // Gridlines & Labels (Exactly like reference)
        [0.01, 0.1, 1].forEach(v => {
            this.g.append('line')
                .attr('class', 'gridline')
                .attr('x1', this.xScale(v)).attr('x2', this.xScale(v))
                .attr('y1', 0).attr('y2', this.innerHeight);
            
            this.g.append('text')
                .attr('x', this.xScale(v))
                .attr('y', this.innerHeight + 14)
                .attr('text-anchor', 'middle')
                .attr('fill', '#6a7390')
                .attr('font-size', '9px')
                .attr('font-family', 'var(--mono)')
                .text(v + ' Rj');
        });

        [1, 10, 100, 1000, 10000, 100000].forEach(v => {
            this.g.append('line')
                .attr('class', 'gridline')
                .attr('y1', this.yScale(v)).attr('y2', this.yScale(v))
                .attr('x1', 0).attr('x2', this.innerWidth);
            
            this.g.append('text')
                .attr('x', -8)
                .attr('y', this.yScale(v) + 3)
                .attr('text-anchor', 'end')
                .attr('fill', '#6a7390')
                .attr('font-size', '9px')
                .attr('font-family', 'var(--mono)')
                .text(v + 'd');
        });

        // Axis Labels
        this.g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .text('PLANET RADIUS (JUPITER RADII)');

        this.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .text('ORBITAL PERIOD (DAYS)');

        this.render();
    }

    render() {
        // Exoplanets
        this.g.append('g').selectAll('.exo-dot')
            .data(this.exoData)
            .join('circle')
            .attr('class', 'exo-dot')
            .attr('cx', d => this.xScale(Math.max(0.005, Math.min(3, d.radiusJpt))))
            .attr('cy', d => this.yScale(Math.max(0.1, Math.min(200000, d.periodDays))))
            .attr('r', 1.8)
            .attr('fill', '#f0a830')
            .attr('opacity', 0.2);

        // Solar System
        this.g.append('g').selectAll('.ss-dot')
            .data(this.ssData)
            .join('circle')
            .attr('class', 'ss-dot')
            .attr('cx', d => this.xScale(d.radiusJpt))
            .attr('cy', d => this.yScale(d.periodDays))
            .attr('r', 4)
            .attr('fill', '#ffffff')
            .attr('stroke', '#000000')
            .attr('stroke-width', 0.5);

        // Solar System Labels
        this.g.append('g').selectAll('.ss-label')
            .data(this.ssData)
            .join('text')
            .attr('class', 'ss-label')
            .attr('x', d => this.xScale(d.radiusJpt) + 6)
            .attr('y', d => this.yScale(d.periodDays) + 3)
            .attr('fill', '#dfe5f3')
            .attr('font-size', '9px')
            .text(d => d.planetIdentifier);

        // Style axes lines
        this.svg.selectAll('.axis line, .axis path').attr('stroke', '#3a425c');
    }
}
