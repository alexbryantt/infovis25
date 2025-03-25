let keyframes = [
    {
        activeVerse: 1, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 2, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 3, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 4, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 5, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 6, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 7, 
        activeLines: [1, 2, 3],
    },
    {
        activeVerse: 8, 
        activeLines: [1, 2, 3],
    }
]

// taken from https://observablehq.com/@d3/bubble-chart/2, creates the bubble chart template
chart = function() {
    // Specify the dimensions of the chart.
    const width = 928;
    const height = width;
    const margin = 1; // to avoid clipping the root circle stroke
    const name = d => d.id.split(".").pop(); // "Strings" of "flare.util.Strings"
    const group = d => d.id.split(".")[1]; // "util" of "flare.util.Strings"
    const names = d => name(d).split(/(?=[A-Z][a-z])|\s+/g); // ["Legend", "Item"] of "flare.vis.legend.LegendItems"
  
    // Specify the number format for values.
    const format = d3.format(",d");
  
    // Create a categorical color scale.
    const color = d3.scaleOrdinal(d3.schemeTableau10);
  
    // Create the pack layout.
    const pack = d3.pack()
        .size([width - margin * 2, height - margin * 2])
        .padding(3);
  
    // Compute the hierarchy from the (flat) data; expose the values
    // for each node; lastly apply the pack layout.
    const root = pack(d3.hierarchy({children: data})
        .sum(d => d.value));
  
    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");
  
    // Place each (leaf) node according to the layout’s x and y values.
    const node = svg.append("g")
      .selectAll()
      .data(root.leaves())
      .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);
  
    // Add a title.
    node.append("title")
        .text(d => `${d.data.id}\n${format(d.value)}`);
  
    // Add a filled circle.
    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(group(d.data)))
        .attr("r", d => d.r);
  
    // Add a label.
    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);
  
    // Add a tspan for each CamelCase-separated word.
    text.selectAll()
      .data(d => names(d.data))
      .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
        .text(d => d);
  
    // Add a tspan for the node’s value.
    text.append("tspan")
        .attr("x", 0)
        .attr("y", d => `${names(d.data).length / 2 + 0.35}em`)
        .attr("fill-opacity", 0.7)
        .text(d => format(d.value));
  
    return Object.assign(svg.node(), {scales: {color}});
  }

let bubbleChartData;
// need to first load data before creating the chart
async function loadData(){
    await d3.csv("/Users/benjamindixon/Desktop/InfoVisStaticVis/infovis25/Disability_and_Health_Data_System__DHDS__20250130.csv").then(data=>{
        bubbleChartData = data;
    })
}

