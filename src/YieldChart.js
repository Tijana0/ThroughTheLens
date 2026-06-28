import * as d3 from 'd3';

export default class YieldChart {
    constructor(data, config) {
        this.data = data.filter(d => d.discoveryYear >= 1992 && d.discoveryYear <= 2017);
        this.config = {
            parentElement: config.parentElement,
            width: 380,
            height: 130,
        };
        this.initViz();
    }

    initViz() {
        this.svg = d3.select(this.config.parentElement)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .attr('preserveAspectRatio', 'none');

        this.margin = { top: 12, right: 10, bottom: 28, left: 50 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Prepare Cumulative Stacked Data
        const years = d3.range(1992, 2018);
        const methods = ['Transit', 'RV', 'Other'];
        
        const mapMethod = (m) => {
            if (!m) return 'Other';
            const ml = m.toLowerCase();
            if (ml.includes('transit')) return 'Transit';
            if (ml.includes('rv') || ml.includes('radial velocity')) return 'RV';
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
            .domain([1992, 2017])
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleLinear()
            .domain([0, d3.max(cumulativeData, d => d3.sum(methods, m => d[m]))])
            .range([this.innerHeight, 0]);

        this.colorScale = d3.scaleOrdinal()
            .domain(methods)
            .range(['#f0a830', '#4a9ef0', '#e84393']);

        this.stack = d3.stack().keys(methods);
        this.stackedData = this.stack(cumulativeData);

        this.area = d3.area()
            .x(d => this.xScale(d.data.year))
            .y0(d => this.yScale(d[0]))
            .y1(d => this.yScale(d[1]))
            .curve(d3.curveMonotoneX);

        // Background (grey) layers - NOT clipped
        this.g.append('g')
            .selectAll('.bg-layer')
            .data(this.stackedData)
            .join('path')
            .attr('class', 'bg-layer')
            .attr('d', this.area)
            .attr('fill', '#38436e')
            .attr('stroke', '#060a1f')
            .attr('stroke-width', 0.5)
            .attr('opacity', (d, i) => 0.3 + i * 0.08);

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
            .ticks(5)
            .tickPadding(8);

        this.g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${this.innerHeight})`)
            .call(xAxis);

        // Y Axis
        const yAxis = d3.axisLeft(this.yScale)
            .ticks(4)
            .tickPadding(8);

        this.g.append('g')
            .attr('class', 'axis y-axis')
            .call(yAxis);


        // Y-axis label (horizontal at the top left of the chart)
        this.g.append('text')
            .attr('class', 'axis-title')
            .attr('x', -this.margin.left)
            .attr('y', -4)
            .attr('text-anchor', 'start')
            .attr('fill', 'var(--ink-2)')
            .attr('font-size', '11px')
            .text('Confirmed Exoplanets');
        
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
        if (year < 1992) {
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
