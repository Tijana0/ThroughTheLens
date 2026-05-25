import * as d3 from 'd3';

const LR    = 200;       // lens radius
const LCX   = 230;       // center X  (viewBox is 460×460)
const LCY   = 230;       // center Y

export function drawLens(svg) {
    const defs = svg.append('defs');

    // clip path — keeps dots inside the lens circle
    defs.append('clipPath')
        .attr('id', 'lens-clip')
        .append('circle')
        .attr('cx', LCX)
        .attr('cy', LCY)
        .attr('r', LR - 18);

    // outer dial ring
    svg.append('circle')
        .attr('cx', LCX)
        .attr('cy', LCY)
        .attr('r', LR + 12)
        .attr('fill', 'none')
        .attr('stroke', '#1a2140')
        .attr('stroke-width', 1);

    // rim
    svg.append('circle')
        .attr('cx', LCX)
        .attr('cy', LCY)
        .attr('r', LR + 2)
        .attr('fill', 'none')
        .attr('stroke', '#3a425c')
        .attr('stroke-width', 1);

    // 72 tick marks
    const tickG = svg.append('g');

    for (let i = 0; i < 72; i++) {

        const a = (i / 72) * Math.PI * 2;

        const big = i % 6 === 0;

        tickG.append('line')
            .attr('x1', LCX + Math.cos(a) * (LR + 2))
            .attr('y1', LCY + Math.sin(a) * (LR + 2))
            .attr('x2', LCX + Math.cos(a) * (LR + (big ? 11 : 6)))
            .attr('y2', LCY + Math.sin(a) * (LR + (big ? 11 : 6)))
            .attr('stroke', big ? '#aab2c8' : '#3a425c')
            .attr('stroke-width', big ? 1 : 0.7);
    }

    const lensArea = svg.append('g')
        .attr('clip-path', 'url(#lens-clip)');

    return lensArea;
}
