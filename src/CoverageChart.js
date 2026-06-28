import * as d3 from 'd3';

export const ATTR_GROUPS = [
  { title: 'Discovery metadata', keys: [
      ['planetIdentifier','Identifier'],['lastUpdated','Last updated'],['discoveryYear','Discovery year'],
      ['discoveryMethod','Method'],['rightAscension','RA'],['declination','Dec'],['listsPlanetIsOn','List'],['typeFlag','Type flag']
  ]},
  { title: 'Host star properties', keys: [
      ['hostStarTempK','Star temp (K)'],['hostStarMassSlrMass','Star mass (M☉)'],
      ['hostStarRadiusSlrRad','Star radius (R☉)'],['hostStarMetallicity','[Fe/H]'],
      ['distFromSunParsec','Distance (pc)'],['hostStarAgeGyr','Star age (Gyr)']
  ]},
  { title: 'Planet physical properties', keys: [
      ['periodDays','Orbital period'],['radiusJpt','Radius (Rj)'],['semiMajorAxisAU','Semi-major axis'],
      ['planetaryMassJpt','Mass (Mj)'],['eccentricity','Eccentricity'],['surfaceTempK','Surface temp'],
      ['inclinationDeg','Inclination'],['periastronDeg','Periastron'],
      ['ascendingNodeDeg','Asc. node'],['longitudeDeg','Longitude'],['ageGyr','Age (Gyr)']
  ]}
];

export default class CoverageChart {
    constructor(data, config) {
        this.data = data;
        this.config = {
            parentElement: config.parentElement,
            width: 620,
            height: 500,
        };
        this.initViz();
    }

    initViz() {
        this.svg = d3.select(this.config.parentElement)
            .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');

        this.margin = { left: 168, right: 80, top: 16, bottom: 12 };
        this.innerWidth = this.config.width - this.margin.left - this.margin.right;
        this.innerHeight = this.config.height - this.margin.top - this.margin.bottom;

        const N = this.data.length;
        const allowedZeroKeys = new Set([
            'eccentricity',
            'inclinationDeg',
            'periastronDeg',
            'ascendingNodeDeg',
            'longitudeDeg',
            'typeFlag'
        ]);

        const groups = ATTR_GROUPS.map(g => ({
            title: g.title,
            rows: g.keys.map(([k, lbl]) => {
                const fillCount = this.data.filter(d => {
                    const val = d[k];
                    if (val === undefined || val === null || val === '') return false;
                    if (typeof val === 'number') {
                        return !isNaN(val) && (val !== 0 || allowedZeroKeys.has(k));
                    }
                    return String(val).trim() !== '';
                }).length;
                return { key: k, lbl, fill: fillCount / N };
            })
        }));

        let totalRows = 0;
        groups.forEach(g => totalRows += g.rows.length + 1);
        totalRows += groups.length - 1;
        const rowH = this.innerHeight / totalRows;

        let yCur = this.margin.top;
        groups.forEach((g, gi) => {
            if (gi > 0) yCur += rowH * 0.5;

            this.svg.append('text')
                .attr('x', this.margin.left)
                .attr('y', yCur + rowH * 0.7)
                .attr('font-family', 'var(--mono)')
                .attr('font-size', 9.5)
                .attr('fill', '#6a7390')
                .attr('letter-spacing', '0.22em')
                .text(g.title.toUpperCase());

            yCur += rowH * 1.1;

            g.rows.forEach(r => {
                const pct = r.fill;
                const c = '#8a92a8'; // single neutral fill — no fill-rate color coding

                this.svg.append('text')
                    .attr('x', this.margin.left - 8)
                    .attr('y', yCur + rowH * 0.62)
                    .attr('text-anchor', 'end')
                    .attr('font-family', 'var(--mono)')
                    .attr('font-size', 10)
                    .attr('fill', '#aab2c8')
                    .text(r.lbl + (r.key === 'ageGyr' ? '  ●' : ''));

                this.svg.append('rect')
                    .attr('x', this.margin.left)
                    .attr('y', yCur + rowH * 0.15)
                    .attr('width', this.innerWidth)
                    .attr('height', rowH * 0.65)
                    .attr('fill', '#0e1530');

                this.svg.append('rect')
                    .attr('x', this.margin.left)
                    .attr('y', yCur + rowH * 0.15)
                    .attr('width', 0)
                    .attr('height', rowH * 0.65)
                    .attr('fill', c)
                    .transition().duration(700).delay(100)
                    .attr('width', this.innerWidth * pct);

                this.svg.append('text')
                    .attr('x', this.config.width - this.margin.right + 6)
                    .attr('y', yCur + rowH * 0.62)
                    .attr('font-family', 'var(--mono)')
                    .attr('font-size', 10)
                    .attr('fill', '#aab2c8')
                    .text((pct * 100).toFixed(pct < 0.05 ? 1 : 0) + '%');

                yCur += rowH;
            });
        });
    }
}
