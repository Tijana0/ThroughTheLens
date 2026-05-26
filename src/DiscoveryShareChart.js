import * as d3 from 'd3';

export const SOURCE_BUCKETS = [
  { key: 'kepler', label: 'Kepler transit batch', color: '#f0a830',
    test: p => p.discoveryMethod?.toLowerCase() === 'transit' && /^Kepler|^KOI/.test(p.planetIdentifier) },
  { key: 'ground', label: 'Ground-based transit', color: '#f9c97f',
    test: p => p.discoveryMethod?.toLowerCase() === 'transit' && !/^Kepler|^KOI/.test(p.planetIdentifier) },
  { key: 'rv',     label: 'Radial velocity', color: '#4a9ef0', test: p => p.discoveryMethod?.toLowerCase() === 'rv' },
  { key: 'image',  label: 'Direct imaging', color: '#c070f8', test: p => p.discoveryMethod?.toLowerCase() === 'imaging' },
  { key: 'micro',  label: 'Microlensing', color: '#9b5dd0', test: p => p.discoveryMethod?.toLowerCase() === 'microlensing' },
  { key: 'timing', label: 'Pulsar / transit timing', color: '#6f43a3', test: p => p.discoveryMethod?.toLowerCase() === 'timing' }
];

export default class DiscoveryShareChart {
    constructor(data, config) {
        this.data = data.filter(d => d.discoveryYear > 0);
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

        this.cx = 200;
        this.cy = this.config.height / 2 - 4;
        this.R = 130;
        this.r = 70;

        const pool = this.data;
        const processedData = SOURCE_BUCKETS.map(b => ({
            ...b,
            count: pool.filter(b.test).length,
            examples: pool.filter(b.test).slice(0, 6).map(p => p.planetIdentifier)
        }));

        const total = d3.sum(processedData, d => d.count);
        const pie = d3.pie().value(d => d.count).sort(null);
        const arc = d3.arc().innerRadius(this.r).outerRadius(this.R).cornerRadius(0).padAngle(0.012);
        const arcHover = d3.arc().innerRadius(this.r - 4).outerRadius(this.R + 8).padAngle(0.012);

        this.g = this.svg.append('g').attr('transform', `translate(${this.cx},${this.cy})`);
        
        const arcs = pie(processedData);
        
        this.g.selectAll('path')
            .data(arcs)
            .join('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('fill-opacity', 0.92)
            .attr('stroke', '#030412')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseenter', (event, d) => {
                d3.select(event.currentTarget)
                    .transition().duration(140)
                    .attr('d', arcHover);
                
                const pct = (d.data.count / total * 100).toFixed(1);
                d3.select('#p4-note').html(
                    `<b style="color:${d.data.color}">${d.data.label.toUpperCase()}</b> · ${d.data.count.toLocaleString()} planets · ${pct}% &nbsp;—&nbsp; e.g. ` +
                    d.data.examples.join(', ')
                );
            })
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget)
                    .transition().duration(140)
                    .attr('d', arc);
                
                d3.select('#p4-note').text('Hover a wedge · examples appear here');
            });
    }
}
