import * as d3 from 'd3';


export const METHOD_DOMAIN = ['transit', 'rv', 'imaging', 'microlensing', 'timing', 'other'];
export const METHOD_RANGE  = ['#f0a830', '#4a9ef0', '#c070f8', '#5fb47c', '#ffffff', '#707a9e'];

// Returns a fresh ordinal scale mapping a normalized method key to its color.
export function createMethodColorScale() {
    return d3.scaleOrdinal()
        .domain(METHOD_DOMAIN)
        .range(METHOD_RANGE);
}

// Normalizes a raw discoveryMethod string into one of METHOD_DOMAIN.
export function mapMethod(m) {
    if (!m) return 'other';
    const ml = m.toLowerCase();
    if (ml.includes('transit')) return 'transit';
    if (ml.includes('rv') || ml.includes('radial velocity')) return 'rv';
    if (ml.includes('imaging')) return 'imaging';
    if (ml.includes('microlensing')) return 'microlensing';
    if (ml.includes('timing')) return 'timing';
    return 'other';
}
