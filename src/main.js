import * as d3 from 'd3';
import scrollama from 'scrollama';

d3.csv('/data/OpenExoplanetCatalogue.csv').then(data => {
    console.log("Data loaded:", data);

    const lensSvg = d3.select('#lens-svg');
    const width = 460;
    const height = 460;

    lensSvg.append("text")
        .attr("x", width/2)
        .attr("y", height/2)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--ink-3)")
        .text("D3 Viewport");

    const scroller = scrollama();

    function handleStepEnter(response) {
        console.log("Step entered:", response.index);
        // response.element, response.direction, response.index
        const el = d3.select(response.element);

        d3.select('#n-tag').text(`Scene 0${response.index + 1}`);
        d3.select('#n-text').text(`You are currently on step ${response.index + 1}`);
    }

    scroller
        .setup({
            step: '.step',
            offset: 0.5,
            debug: false
        })
        .onStepEnter(handleStepEnter);

    window.addEventListener('resize', scroller.resize);
});