async function loadData() {
    return d3.csv("../summaries_ready.csv", d => ({
        id: d.Response,
        value: +d.WeightedNumber
    })).then(data => data.filter(d => d.id !== "Any Disability"));
}


function orderData(data) {
    for(let i = 0; i < json.length; i++) {
        if (json[i].id === "Any Disability") {
            json.push(json.splice(i, 1)[0]);
            break;
        }
    }    
}



function createBubbleChart(data) {
    const width = 1000;
    const height = width;
    const margin = 1;
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    const pack = d3.pack()
        .size([width - margin * 10, height - margin * 10])
        .padding(4);

    const root = pack(d3.hierarchy({children: data})
        .sum(d => d.value));

    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;")
        .attr("text-anchor", "middle"); 

    const node = svg.append("g")
        .selectAll()
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.id))
        .attr("r", d => d.r);

    let ratio = 0.2;
    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`)
        .style("font-size", d => `${ratio * d.r}px`);

    text.selectAll()
        .data(d => d.data.id.split(/(?=[A-Z][a-z])|\s+/g))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
        .text(d => d);

    text.append("tspan")
        .attr("x", 0)
        .attr("y", d => `${d.data.id.split(/(?=[A-Z][a-z])|\s+/g).length / 2 + 0.35}em`)
        .attr("fill-opacity", 1)
        .text(d => d3.format(",d")(d.value));

    // simulation force modifiable in .strength()
    const simulation = d3.forceSimulation(root.leaves())
        // https://d3js.org/d3-force/center
        .force("center", d3.forceCenter(width / 2, height / 2))
        // the force of collision so that nodes don't clip
        .force("collision", d3.forceCollide().radius(d => d.r + 2))
        .force("x", d3.forceX(width / 2).strength(0.02))
        .force("y", d3.forceY(height / 2).strength(0.02));

    // applies a "special" force
    simulation.force("special", alpha => {
        root.leaves().forEach(d => {
            if (d.data.id === "No Disability") {
                d.x = width / 2;
                d.y = height / 2;
            }
        });
    });

    // https://d3js.org/d3-force/simulation
    simulation.on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

}


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await loadData();
        console.log('Loaded data:', data); // Verify data loading
        createBubbleChart(data);
    } catch (error) {
        console.error('Error loading visualization:', error);
        // Add error message display
        d3.select("#bubble-chart")
            .append("div")
            .text("Error loading visualization data");
    }
});


