function _1(md){return(
md`# Distorted Football Force Graph`
)}

function _2(html){return(
html` Data from this <a href="http://vlado.fmf.uni-lj.si/pub/networks/data/sport/football.htm">link</a>
`
)}

function _chart(data,d3,width,height,drag,color,invalidation)
{
  const links = data[0].links.map(d => Object.create(d));
  const nodes = data[0].nodes.map(d => Object.create(d));

  const fisheye = d3.fisheye.circular()
    .radius(200)
    .distortion(2);
  
  // Force simulation
  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));
  
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .style("background", "#f8f9fa");
  
  // Add arrow markers
  svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
    .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");
  
  // Links
  const link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke", "#adb5bd")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value))
      .attr("marker-end", "url(#arrowhead)");
  
  // Node groups
  const node = svg.append("g")
      .attr("class", "nodes")
    .selectAll(".node")
    .data(nodes)
    .join("g")
      .attr('class', 'node')
      .style("cursor", "pointer")
      .call(drag(simulation))
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("click", handleClick)
      .on("dblclick", handleDblClick);
  
  // Node circles
  const nodeCircle = node.append('circle')
      .attr("r", 8)
      .attr("fill", color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))");
  
  // Node labels
  const nodeText = node.append("text")
      .text(d => d.id)
      .style('fill', '#212529')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('x', 12)
      .attr('y', 4)
      .style("pointer-events", "none")
      .style("user-select", "none");
  
  // Fisheye effect on mousemove
  svg.on("mousemove", function() {
    const mouse = d3.mouse(this);
    fisheye.focus(mouse);
    
    // Apply fisheye to each node
    node.each(function(d) {
      d.fisheye = fisheye({x: d.x, y: d.y});
    })
    .attr("transform", d => `translate(${d.fisheye.x}, ${d.fisheye.y})`)
    .select("circle")
    .attr("r", d => d.fisheye.z * 8);
    
    // Update text position scaling
    node.select("text")
      .attr("x", d => 12 * d.fisheye.z)
      .attr("y", d => 4 * d.fisheye.z)
      .style("font-size", d => (11 * Math.min(d.fisheye.z, 2)) + "px");
    
    // Apply fisheye to links
    link
      .attr("x1", d => d.source.fisheye.x)
      .attr("y1", d => d.source.fisheye.y)
      .attr("x2", d => d.target.fisheye.x)
      .attr("y2", d => d.target.fisheye.y)
      .attr("stroke-width", d => {
        const z = Math.min(d.source.fisheye.z, d.target.fisheye.z);
        return Math.sqrt(d.value) * z;
      });
  });
  
  // Hover highlight effect
  function handleMouseOver(d) {
    link.style("stroke-opacity", l => 
      l.source === d || l.target === d ? 1 : 0.2
    );
    
    node.style("opacity", n => {
      const connected = links.some(l => 
        (l.source === d && l.target === n) || 
        (l.target === d && l.source === n) ||
        n === d
      );
      return connected ? 1 : 0.3;
    });
  }
  
  function handleMouseOut(d) {
    link.style("stroke-opacity", 0.6);
    node.style("opacity", 1);
  }
  
  function handleClick(d) {
    console.log("Node clicked:", d);
    d.fx = d.x;
    d.fy = d.y;
    d.fixed = true;
  }
  
  function handleDblClick(d) {
    d.fx = null;
    d.fy = null;
    d.fixed = false;
  }
  
  // Tick function for force simulation
  simulation.on("tick", () => {
    // Initialize fisheye positions if not exists
    node.each(d => {
      if (!d.fisheye) {
        d.fisheye = {x: d.x, y: d.y, z: 1};
      } else {
        // Update the base positions for fisheye calculation
        d.fisheye.x = d.x;
        d.fisheye.y = d.y;
      }
    });
    
    // Update link positions (using fisheye if available)
    link
        .attr("x1", d => d.source.fisheye.x)
        .attr("y1", d => d.source.fisheye.y)
        .attr("x2", d => d.target.fisheye.x)
        .attr("y2", d => d.target.fisheye.y);
    
    // Update node positions (using fisheye if available)
    node.attr("transform", d => `translate(${d.fisheye.x}, ${d.fisheye.y})`);
  });
  
  invalidation.then(() => simulation.stop());
  
  return svg.node();
}


function _4(d3){return(
d3.fisheye = {
  circular: function() {
    var radius = 200,
        distortion = 2,
        k0,
        k1,
        focus = [0, 0];

    function fisheye(d) {
      var dx = d.x - focus[0],
          dy = d.y - focus[1],
          dd = Math.sqrt(dx * dx + dy * dy);
      if (!dd || dd >= radius) return {x: d.x, y: d.y, z: 1};
      var k = k0 * (1 - Math.exp(-dd * k1)) / dd * .75 + .25;
      return {x: focus[0] + dx * k, y: focus[1] + dy * k, z: Math.min(k, 10)};
    }

    function rescale() {
      k0 = Math.exp(distortion);
      k0 = k0 / (k0 - 1) * radius;
      k1 = distortion / radius;
      return fisheye;
    }

    fisheye.radius = function(_) {
      if (!arguments.length) return radius;
      radius = +_;
      return rescale();
    };

    fisheye.distortion = function(_) {
      if (!arguments.length) return distortion;
      distortion = +_;
      return rescale();
    };

    fisheye.focus = function(_) {
      if (!arguments.length) return focus;
      focus = _;
      return fisheye;
    };

    return rescale();
  }
}
)}

function _drag(d3){return(
simulation => {
  
  function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    d.fixed = true;
    
    // Visual feedback
    d3.select(this).select("circle")
      .transition()
      .duration(100)
      .attr("stroke-width", 3);
    
    // Add fixed class
    d3.select(this).classed("fixed", true);
  }
  
  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }
  
  function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    
    // Reset visual feedback but keep node pinned
    d3.select(this).select("circle")
      .transition()
      .duration(100)
      .attr("stroke-width", 2);
    
    // Node remains fixed/pinned after drag
    // Double-click to unpin
  }
  
  return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}
)}

function _color(d3)
{
  const scale = d3.scaleOrdinal(d3.schemeCategory10);
  return d => scale(d.group);
}


function _height(){return(
800
)}

function _data(){return(
[ {
  "nodes": [
    {"id": "ARG", "group": 1},
     {"id": "AUT", "group": 2},  {"id": "BEL", "group":3}, {"id": "BGR", "group": 4}, {"id": "BRA", "group": 5}, {"id": "CHE", "group": 6}, {"id": "CHL", "group": 7}, {"id": "CMR", "group": 8}, {"id": "COL", "group": 9}, {"id": "DEU", "group": 10}, {"id": "DNK", "group": 11}, {"id": "ESP", "group": 12}, {"id": "FRA", "group": 13}, {"id": "GBR", "group": 14}, {"id": "GRE", "group": 15}, {"id": "HRV", "group": 16}, {"id": "IRN", "group": 17}, {"id": "ITA", "group": 18}, {"id": "JAM", "group": 19}, {"id": "JPN", "group": 20}, {"id": "KOR", "group": 21}, {"id": "MAR", "group": 22}, {"id": "MEX", "group": 23}, {"id": "NGA", "group": 24}, {"id": "NLD", "group": 25}, {"id": "NOR", "group": 26}, {"id": "PRT", "group": 27}, {"id": "PRY", "group": 28}, {"id": "ROM", "group": 29}, {"id": "SCO", "group": 30}, {"id": "TUN", "group": 31}, {"id": "TUR", "group": 32}, {"id": "USA", "group": 33}, {"id": "YUG", "group": 34}, {"id": "ZAF", "group": 35}
  ],
  "links": [
    {"source": "ARG", "target": "ESP", "value": 4},
    {"source": "ARG", "target": "ITA", "value": 9},
    {"source": "AUT", "target": "DEU", "value": 7},
    {"source": "AUT", "target": "ESP", "value": 1},
    {"source": "AUT", "target": "FRA", "value": 1},
    {"source": "AUT", "target": "GBR", "value": 1},
    {"source": "AUT", "target": "ITA", "value": 1},
    {"source": "BEL", "target": "DEU", "value": 2},
     {"source": "BEL", "target": "FRA", "value": 2},
     {"source": "BEL", "target": "ITA", "value": 2},
     {"source": "BEL", "target": "NLD", "value": 2},
    
     {"source": "BGR", "target": "DEU", "value": 4},
     {"source": "BGR", "target": "ESP", "value": 1},
     {"source": "BGR", "target": "PRT", "value": 1},
     {"source": "BGR", "target": "TUR", "value": 4},
    
      {"source": "BRA", "target": "ESP", "value": 4},
    {"source": "BRA", "target": "FRA", "value": 1},
     {"source": "BRA", "target": "ITA", "value": 5},
     {"source": "BRA", "target": "JPN", "value": 1},
     {"source": "BRA", "target": "PRT", "value": 1},
    
     {"source": "CHL", "target": "ARG", "value": 1},
     {"source": "CHL", "target": "ITA", "value": 1},
     {"source": "CHL", "target": "USA", "value": 1},
    
     {"source": "CMR", "target": "AUT", "value": 1},
    {"source": "CMR", "target": "DEU", "value": 1},
    {"source": "CMR", "target": "ESP", "value": 2},
    {"source": "CMR", "target": "FRA", "value": 7},
    {"source": "CMR", "target": "GRE", "value": 1},
    {"source": "CMR", "target": "ITA", "value": 2},
     {"source": "CMR", "target": "JPN", "value": 2},
     {"source": "CMR", "target": "PRT", "value": 2},
     {"source": "CMR", "target": "TUR", "value": 2},
    
     {"source": "COL", "target": "ARG", "value": 3},
    {"source": "COL", "target": "BRA", "value": 2},
     {"source": "COL", "target": "ESP", "value": 1},
     {"source": "COL", "target": "ITA", "value": 1},
     {"source": "COL", "target": "USA", "value": 2},
    
     {"source": "DEU", "target": "ESP", "value": 1},
     {"source": "DEU", "target": "FRA", "value": 1},
     {"source": "DEU", "target": "ITA", "value": 2},
    
     {"source": "DNK", "target": "DEU", "value": 3},
    {"source": "DNK", "target": "ESP", "value": 1},
    {"source": "DNK", "target": "GBR", "value": 6},
    {"source": "DNK", "target": "ITA", "value": 1},
     {"source": "DNK", "target": "NLD", "value": 1},
     {"source": "DNK", "target": "SCO", "value": 3},
     {"source": "DNK", "target": "TUR", "value": 1},
    
    {"source": "HRV", "target": "AUT", "value": 1},
    {"source": "HRV", "target": "DEU", "value": 2},
    {"source": "HRV", "target": "ESP", "value": 4},
     {"source": "HRV", "target": "GBR", "value": 2},
     {"source": "HRV", "target": "ITA", "value": 4},
     {"source": "HRV", "target": "TUR", "value": 1},
    
       {"source": "IRN", "target": "DEU", "value": 3},
    
     {"source": "ITA", "target": "ESP", "value": 2},
     {"source": "ITA", "target": "FRA", "value": 1},
     {"source": "ITA", "target": "GBR", "value": 2},
    
       {"source": "JAM", "target": "GBR", "value": 1},
    
     {"source": "KOR", "target": "FRA", "value": 1},
     {"source": "KOR", "target": "JPN", "value": 4},
    
      {"source": "MAR", "target": "FRA", "value": 3},
    {"source": "MAR", "target": "DEU", "value": 4},
    {"source": "MAR", "target": "ESP", "value": 1},
     {"source": "MAR", "target": "TUN", "value": 1},
     {"source": "MAR", "target": "ITA", "value": 3},
     {"source": "MAR", "target": "PRT", "value": 1},
    
         {"source": "NGA", "target": "BGR", "value": 2},
    {"source": "NGA", "target": "CHE", "value": 1},
    {"source": "NGA", "target": "DEU", "value": 1},
    {"source": "NGA", "target": "FRA", "value": 4},
    {"source": "NGA", "target": "ESP", "value": 3},
    {"source": "NGA", "target": "ITA", "value": 2},
     {"source": "NGA", "target": "NLD", "value": 3},
     {"source": "NGA", "target": "USA", "value": 3},
     {"source": "NGA", "target": "TUR", "value": 1},
      {"source": "NGA", "target": "ZAF", "value": 1},
    
     {"source": "NLD", "target": "DEU", "value": 1},
     {"source": "NLD", "target": "ESP", "value": 5},
     {"source": "NLD", "target": "GRE", "value": 4},
     {"source": "NLD", "target": "ITA", "value": 2},
    
      {"source": "NOR", "target": "DEU", "value": 3},
    {"source": "NOR", "target": "ESP", "value": 1},
     {"source": "NOR", "target": "GBR", "value": 12},
     {"source": "NOR", "target": "GRE", "value": 2},
     {"source": "NOR", "target": "ITA", "value": 1},
      {"source": "NOR", "target": "SCO", "value": 3},
    
    
     {"source": "YUG", "target": "ITA", "value": 7},
      {"source": "YUG", "target": "JPN", "value": 2},
    
      {"source": "PRY", "target": "MEX", "value": 1}
   
    
  ]}]
)}

function _d3(require){return(
require("d3@5")
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["html"], _2);
  main.variable(observer("chart")).define("chart", ["data","d3","width","height","drag","color","invalidation"], _chart);
  main.variable(observer()).define(["d3"], _4);
  main.variable(observer("drag")).define("drag", ["d3"], _drag);
  main.variable(observer("color")).define("color", ["d3"], _color);
  main.variable(observer("height")).define("height", _height);
  main.variable(observer("data")).define("data", _data);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  return main;
}
