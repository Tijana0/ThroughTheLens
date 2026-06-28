import * as d3 from 'd3';

export default class CompletenessChart {
    constructor(data, config) {
        this.data = data;
        this.config = {
            parentElement: config.parentElement,
            width: 380,
            height: 130,
        };
        this.attributes = [
            { key: 'radiusJpt', label: 'Radius' },
            { key: 'planetaryMassJpt', label: 'Mass' },
            { key: 'periodDays', label: 'Period' },
            { key: 'semiMajorAxisAU', label: 'Orbit' },
            { key: 'surfaceTempK', label: 'Temp' },
            { key: 'distFromSunParsec', label: 'Dist' }
        ];
        this.initViz();
    }

    initViz() {
        this.svg = d3.select(this.config.parentElement)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .attr('preserveAspectRatio', 'none');

        this.margin = { top: 10, right: 10, bottom: 20, left: 50 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        this.g = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.xScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleBand()
            .domain(this.attributes.map(d => d.label))
            .range([0, this.innerHeight])
            .padding(0.3);

        // Background bars
        this.g.selectAll('.bg-bar')
            .data(this.attributes)
            .join('rect')
            .attr('class', 'bg-bar')
            .attr('y', d => this.yScale(d.label))
            .attr('x', 0)
            .attr('width', this.innerWidth)
            .attr('height', this.yScale.bandwidth())
            .attr('fill', '#1a2140')
            .attr('opacity', 0.3);

        // Foreground bars
        this.bars = this.g.selectAll('.fill-bar')
            .data(this.attributes)
            .join('rect')
            .attr('class', 'fill-bar')
            .attr('y', d => this.yScale(d.label))
            .attr('x', 0)
            .attr('height', this.yScale.bandwidth())
            .attr('fill', 'var(--amber)')
            .attr('width', 0);

        // Labels
        this.g.selectAll('.attr-label')
            .data(this.attributes)
            .join('text')
            .attr('class', 'attr-label')
            .attr('y', d => this.yScale(d.label) + this.yScale.bandwidth() / 2)
            .attr('x', -8)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'middle')
            .attr('fill', 'var(--ink-2)')
            .attr('font-size', '11px')
            .text(d => d.label);
    }

    update(year) {
        const batch = this.data.filter(d => d.discoveryYear === year);
        const total = batch.length;

        const completenessData = this.attributes.map(attr => {
            // Treat 0, undefined, null, or NaN as "missing" for completeness
            const filled = batch.filter(d => d[attr.key] !== undefined && d[attr.key] !== null && !isNaN(d[attr.key]) && d[attr.key] !== 0).length;
            return {
                label: attr.label,
                percent: total > 0 ? filled / total : 0
            };
        });

        this.bars
            .data(completenessData)
            .transition()
            .duration(300)
            .attr('width', d => this.xScale(d.percent));
    }
}
