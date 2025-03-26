async function loadData() {
    return d3.csv("../summaries_ready.csv", d => ({
        id: d.Response,
        value: +d.WeightedNumber
    })).then(data => data.filter(d => d.id !== "Any Disability"));
}


function createBubbleChart(data) {
    const width = 1000;
    const height = width;
    const margin = 1;
    const color = d3.scaleOrdinal(d3.schemeTableau10);
    
    const pack = d3.pack()
        .size([width - margin * 10, height - margin * 10])
        .padding(3);

    const root = pack(d3.hierarchy({children: data})
        .sum(d => d.value));

    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;");

    const node = svg.append("g")
        .selectAll()
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.id))
        .attr("r", d => d.r);

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`);

    text.selectAll()
        .data(d => d.data.id.split(/(?=[A-Z][a-z])|\s+/g))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
        .text(d => d);

    text.append("tspan")
        .attr("x", 0)
        .attr("y", d => `${d.data.id.split(/(?=[A-Z][a-z])|\s+/g).length / 2 + 0.35}em`)
        .attr("fill-opacity", 0.7)
        .text(d => d3.format(",d")(d.value));
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


