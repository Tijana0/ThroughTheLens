import * as d3 from 'd3';
import './style.css';



// Scrollable Timeline
const tlScroll = document.getElementById('tl-scroll');
let tlDown = false, tlStartX, tlLeft;
tlScroll.addEventListener('mousedown', e => {
  tlDown = true;
  tlStartX = e.pageX - tlScroll.offsetLeft;
  tlLeft = tlScroll.scrollLeft;
});
tlScroll.addEventListener('mouseleave', () => { tlDown = false; });
tlScroll.addEventListener('mouseup',    () => { tlDown = false; });
tlScroll.addEventListener('mousemove',  e => {
  if (!tlDown) return;
  e.preventDefault();
  const x = e.pageX - tlScroll.offsetLeft;
  tlScroll.scrollLeft = tlLeft - (x - tlStartX) * 1.2;
});
