import * as d3 from 'd3';

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

        this.margin = { top: 20, right: 20, bottom: 40, left: 50 };
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

        this.colorScale = d3.scaleOrdinal()
            .domain(['transit', 'RV', 'imaging', 'microlensing', 'timing'])
            .range(['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff']);

        // Gridlines
        this.g.append('g')
            .attr('class', 'gridline')
            .call(d3.axisLeft(this.yScale)
                .tickSize(-this.innerWidth)
                .tickFormat('')
            )
            .attr('opacity', 0.1);

        // Axes
        this.xAxis = this.g.append('g')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale).ticks(5))
            .attr('class', 'axis');

        this.yAxis = this.g.append('g')
            .call(d3.axisLeft(this.yScale).ticks(5, '.1f'))
            .attr('class', 'axis');

        // Labels
        this.g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .text('HOST STAR METALLICITY (IRON ABUNDANCE)');

        this.g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -38)
            .attr('text-anchor', 'middle')
            .attr('fill', '#6a7390')
            .attr('font-size', '10px')
            .text('ORBITAL PERIOD (DAYS)');

        this.render();
    }

    render() {
        this.g.selectAll('.planet-dot')
            .data(this.data)
            .join('circle')
            .attr('class', 'planet-dot')
            .attr('cx', d => this.xScale(d.hostStarMetallicity))
            .attr('cy', d => this.yScale(d.periodDays))
            .attr('r', 2)
            .attr('fill', d => this.colorScale(d.discoveryMethod?.toLowerCase()))
            .attr('opacity', 0.4);
            
        // Style axes
        this.svg.selectAll('.axis line, .axis path').attr('stroke', '#3a425c');
        this.svg.selectAll('.axis text').attr('fill', '#6a7390').attr('font-size', '9px');
    }
}
