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
                    d.data.examples.map(n => `<span style="color:#aab2c8">${n}</span>`).join(' · ')
                );
            })
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget)
                    .transition().duration(140)
                    .attr('d', arc);
                
                d3.select('#p4-note').text('Hover a wedge · examples appear here');
            });

        // Center caption
        this.g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -8)
            .attr('font-family', 'var(--serif)')
            .attr('font-size', 28)
            .attr('fill', '#fff')
            .text(total.toLocaleString());
        
        this.g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 10)
            .attr('font-family', 'var(--mono)')
            .attr('font-size', 8.5)
            .attr('fill', '#aab2c8')
            .attr('letter-spacing', '0.24em')
            .text('CONFIRMED');

        this.g.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', 22)
            .attr('font-family', 'var(--mono)')
            .attr('font-size', 8.5)
            .attr('fill', '#6a7390')
            .attr('letter-spacing', '0.1em')
            .text('1992–2017');

        // Legend on right (Centered vertically)
        const legendRowHeight = 32;
        const legendTotalHeight = processedData.length * legendRowHeight;
        const lgX = this.cx + this.R + 60;
        const lgY = this.cy - (legendTotalHeight / 2) + 6; // Center relative to cy

        const lg = this.svg.append('g')
            .attr('transform', `translate(${lgX}, ${lgY})`);

        processedData.forEach((d, i) => {
            const row = lg.append('g')
                .attr('transform', `translate(0, ${i * 32})`);
            
            row.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('fill', d.color);
            
            row.append('text')
                .attr('x', 18)
                .attr('y', 9)
                .attr('font-family', 'var(--mono)')
                .attr('font-size', 10)
                .attr('fill', '#e8ecf5')
                .text(d.label.toUpperCase());

            const pct = (d.count / total * 100).toFixed(1);
            row.append('text')
                .attr('x', 18)
                .attr('y', 22)
                .attr('font-family', 'var(--mono)')
                .attr('font-size', 9)
                .attr('fill', '#6a7390')
                .text(`${d.count.toLocaleString()} planets · ${pct}%`);
        });
    }
}
