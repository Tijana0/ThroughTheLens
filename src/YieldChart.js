import * as d3 from 'd3';

export default class YieldChart {
    constructor(data, config) {
        this.data = data.filter(d => d.discoveryYear >= 1989 && d.discoveryYear <= 2017);
        this.config = {
            parentElement: config.parentElement,
            width: 380,
            height: 110,
        };
        this.initViz();
    }

    initViz() {
        this.svg = d3.select(this.config.parentElement)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .attr('preserveAspectRatio', 'none');

        this.margin = { top: 15, right: 15, bottom: 32, left: 45 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Prepare Cumulative Stacked Data
        const years = d3.range(1989, 2018);
        const methods = ['Transit', 'RV', 'Imaging', 'Microlensing', 'Timing', 'Other'];
        
        const mapMethod = (m) => {
            if (!m) return 'Other';
            const ml = m.toLowerCase();
            if (ml.includes('transit')) return 'Transit';
            if (ml.includes('rv') || ml.includes('radial velocity')) return 'RV';
            if (ml.includes('imaging')) return 'Imaging';
            if (ml.includes('microlensing')) return 'Microlensing';
            if (ml.includes('timing')) return 'Timing';
            return 'Other';
        };

        const cumulativeData = years.map(yr => {
            const entry = { year: yr };
            methods.forEach(m => {
                entry[m] = this.data.filter(d => d.discoveryYear <= yr && mapMethod(d.discoveryMethod) === m).length;
            });
            return entry;
        });

        this.xScale = d3.scaleLinear()
            .domain([1989, 2017])
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(cumulativeData, d => d3.sum(methods, m => d[m]))])
            .range([this.innerHeight, 0]);

        this.colorScale = d3.scaleOrdinal()
            .domain(methods)
            .range(['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff', '#707a9e']);

        this.stack = d3.stack().keys(methods);
        this.stackedData = this.stack(cumulativeData);

        this.area = d3.area()
            .x(d => this.xScale(d.data.year))
            .y0(d => this.yScale(d[0]))
            .y1(d => this.yScale(d[1]))
            .curve(d3.curveMonotoneX);

        // Clip path for scroll-reveal effect
        this.defs = this.svg.append('defs');
        this.clip = this.defs.append('clipPath')
            .attr('id', 'yield-clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 0)
            .attr('height', this.innerHeight);

        // Create a group for the scroll-clipped content
        this.chartContent = this.g.append('g')
            .attr('clip-path', 'url(#yield-clip)');

        this.layers = this.chartContent.selectAll('.layer')
            .data(this.stackedData)
            .join('path')
            .attr('class', 'layer')
            .attr('d', this.area)
            .attr('fill', d => this.colorScale(d.key))
            .attr('opacity', 0.8);

        // X Axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format('d'))
            .ticks(5);

        this.g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis);

        // Y Axis
        const yAxis = d3.axisLeft(this.yScale)
            .ticks(4);

        this.g.append('g')
            .attr('class', 'axis y-axis')
            .call(yAxis);

        // X-axis label
        this.g.append('text')
            .attr('class', 'axis-title')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight + 28)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--ink-3)')
            .attr('font-size', '9px')
            .text('Discovery Year');

        // Y-axis label
        this.g.append('text')
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.innerHeight / 2)
            .attr('y', -34)
            .attr('text-anchor', 'middle')
            .attr('fill', 'var(--ink-3)')
            .attr('font-size', '9px')
            .text('Cumulative Discoveries');
        
        // Vertical highlight line
        this.highlight = this.g.append('line')
            .attr('class', 'highlight-line')
            .attr('y1', 0)
            .attr('y2', this.innerHeight)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '2,2')
            .attr('opacity', 0);
    }

    setYear(year) {
        if (year < 1989) {
            this.clip.attr('width', 0);
            this.highlight.attr('opacity', 0);
            return;
        }

        const xPos = this.xScale(year);
        
        // Instant update (no transition) to match high-frequency scroll events
        this.clip.attr('width', xPos);

        this.highlight
            .attr('opacity', 0.8)
            .attr('x1', xPos)
            .attr('x2', xPos);
    }
}
