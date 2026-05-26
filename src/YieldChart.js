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

        this.margin = { top: 10, right: 0, bottom: 20, left: 0 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // Prepare Cumulative Stacked Data
        const years = d3.range(1989, 2018);
        const methods = ['Transit', 'RV', 'Imaging', 'Microlensing', 'Timing'];
        
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
            .range(['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff']);

        this.stack = d3.stack().keys(methods);
        this.stackedData = this.stack(cumulativeData);

        this.area = d3.area()
            .x(d => this.xScale(d.data.year))
            .y0(d => this.yScale(d[0]))
            .y1(d => this.yScale(d[1]))
            .curve(d3.curveMonotoneX);

        this.layers = this.g.selectAll('.layer')
            .data(this.stackedData)
            .join('path')
            .attr('class', 'layer')
            .attr('d', this.area)
            .attr('fill', d => this.colorScale(d.key))
            .attr('opacity', 0.8);

        // Year labels
        this.g.append('text')
            .attr('x', 0)
            .attr('y', this.innerHeight + 14)
            .attr('fill', '#3a425c')
            .attr('font-size', '8px')
            .text('1989');

        this.g.append('text')
            .attr('x', this.innerWidth)
            .attr('y', this.innerHeight + 14)
            .attr('text-anchor', 'end')
            .attr('fill', '#3a425c')
            .attr('font-size', '8px')
            .text('2017');

        // Clip path for scroll-reveal effect
        this.defs = this.svg.append('defs');
        this.clip = this.defs.append('clipPath')
            .attr('id', 'yield-clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 0)
            .attr('height', this.innerHeight);

        this.g.attr('clip-path', 'url(#yield-clip)');
        
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
        if (year < 1989 || year > 2017) {
            this.clip.attr('width', 0);
            this.highlight.attr('opacity', 0);
            return;
        }

        const xPos = this.xScale(year);
        
        this.clip
            .transition()
            .duration(300)
            .attr('width', xPos);

        this.highlight
            .attr('opacity', 0.8)
            .attr('x1', xPos)
            .attr('x2', xPos);
    }
}
