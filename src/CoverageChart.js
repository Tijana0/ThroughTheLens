import * as d3 from 'd3';

export const ATTR_GROUPS = [
  { title: 'Discovery metadata', keys: [
      ['PlanetIdentifier','Identifier'],['LastUpdated','Last updated'],['DiscoveryYear','Discovery year'],
      ['DiscoveryMethod','Method'],['RightAscension','RA'],['Declination','Dec'],['ListsPlanetIsOn','List'],['TypeFlag','Type flag']
  ]},
  { title: 'Host star properties', keys: [
      ['HostStarTempK','Star temp (K)'],['HostStarMassSlrMass','Star mass (M☉)'],
      ['HostStarRadiusSlrRad','Star radius (R☉)'],['HostStarMetallicity','[Fe/H]'],
      ['DistFromSunParsec','Distance (pc)'],['HostStarAgeGyr','Star age (Gyr)']
  ]},
  { title: 'Planet physical properties', keys: [
      ['PeriodDays','Orbital period'],['RadiusJpt','Radius (Rj)'],['SemiMajorAxisAU','Semi-major axis'],
      ['PlanetaryMassJpt','Mass (Mj)'],['Eccentricity','Eccentricity'],['SurfaceTempK','Surface temp'],
      ['InclinationDeg','Inclination'],['PeriastronDeg','Periastron'],
      ['AscendingNodeDeg','Asc. node'],['LongitudeDeg','Longitude'],['AgeGyr','Age (Gyr)']
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
        const groups = ATTR_GROUPS.map(g => ({
            title: g.title,
            rows: g.keys.map(([k, lbl]) => ({
                key: k, lbl,
                fill: this.data.filter(d => d[k] !== '' && d[k] != null && !isNaN(d[k])).length / N
            }))
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
                const c = pct > 0.66 ? '#5fb47c' : pct > 0.33 ? '#f0a830' : '#e0524d';

                this.svg.append('text')
                    .attr('x', this.margin.left - 8)
                    .attr('y', yCur + rowH * 0.62)
                    .attr('text-anchor', 'end')
                    .attr('font-family', 'var(--mono)')
                    .attr('font-size', 10)
                    .attr('fill', r.key === 'AgeGyr' ? '#f0a830' : '#aab2c8')
                    .text(r.lbl + (r.key === 'AgeGyr' ? '  ●' : ''));

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
