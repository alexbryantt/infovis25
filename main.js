//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Data: Keyframe Definitions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let keyframes = [
    { disabilityId: "all disability", verseId: "verse1", activeLines: [1], svgUpdate: bob },
    { disabilityId: "all disability", verseId: "verse1", activeLines: [2] },
    { disabilityId: "all disability", verseId: "verse1", activeLines: [3] },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [1] },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [2] },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [3] },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [1] },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [2] },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [3] },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [1] },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [2] },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [3] },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [1] },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [2] },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [3] },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [1] },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [2] },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [3] },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [1] },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [2] },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [3] },
];

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Data Loading Function
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function loadData() {
    return d3.csv("../summaries_ready.csv", d => ({
        id: d.Response,
        value: +d.WeightedNumber
    })).then(data => data.filter(d => d.id !== "Any Disability"));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Chart Creation Function
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let simulation;
let bubbleData;
let previousCenterNodeId = "No Disability"; // Track the previous center node
let previousVerseIndex = 0;
let isFirstClick = true;
let svg; // Make svg a global variable
const width = 1000;
const height = width;

function createBubbleChart(data) {
    const margin = 1;
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const pack = d3.pack()
        .size([width - margin * 10, height - margin * 10])
        .padding(4);

    const root = pack(d3.hierarchy({ children: data })
        .sum(d => d.value));

    //Select or Create the SVG
    svg = d3.select("#bubble-chart-container")
        .selectAll("svg")
        .data([null]) //ensure only one svg
        .join("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("text-anchor", "middle");

    const node = svg.selectAll("g")
        .data(root.leaves())
        .join("g");

    const circle = node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.id))
        .attr("r", d => d.r / 1)
        .on("click", handleBubbleClick);

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`)
        .style("font-size", d => `${0.2 * d.r}px`)
        .selectAll("tspan")
        .data(d => d.data.id.split(/(?=[A-Z][a-z])|\s+/g).concat(d3.format(",d")(d.value)))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .text(d => d);

    bubbleData = data;
}

function createSimulation(clickedData = null, countsForFirst = true) { //changed
    const width = 1000;
    const height = width;
    const margin = 1;
    const collisionRadius = 5;

    const root = d3.pack().size([width - margin * 10, height - margin * 10]).padding(4)(d3.hierarchy({ children: bubbleData }).sum(d => d.value));

    simulation = d3.forceSimulation(root.leaves())
        .force("collision", d3.forceCollide().radius(d => d.r + collisionRadius).strength(1));

    if (isFirstClick && countsForFirst) {
        simulation.force("center", d3.forceCenter(width / 2, height / 2));
        isFirstClick = false;
    }

    simulation.force("special", alpha => { // Changed to use alpha
        const heightFactor = 2;
        simulation.nodes().forEach(node => {
            if (clickedData && node.data.id === clickedData.id) { //use clickedData
                node.fx = width / 2;
                node.fy = height / heightFactor;
            } else if (isFirstClick && node.data.id === "No Disability") {
                node.fx = width / 2;
                node.fy = height / heightFactor;
            }
            else {
                node.fx = null;
                const targetY = node.y + 10;
                const bottomBoundary = height - node.r;
                node.fy = targetY > bottomBoundary ? bottomBoundary : targetY;
            }

            // Enforce horizontal boundaries.  Important:  Use node.x and node.y
            if (node.x < node.r) node.x = node.r;
            if (node.x > width - node.r) node.x = width - node.r;
        });
    });

    simulation.on("tick", () => {
        const node = svg.selectAll("g").data(root.leaves());
        node.attr("transform", d => `translate(${d.x},${d.y})`);
        node.data().forEach((d) => {
            let dId = d.data.id;
            let pie = svg.select("#" + dId.replaceAll(" ","_") + "_pie");
            pie.attr("transform", () => `translate(${d.x},${d.y})`);
        });
    });

    simulation.alphaTarget(0.3).restart(); // Add this line to start the simulation
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Data: Disability Mapping
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
const disabilityMapping = {
    "Any Disability": "all disability",
    "Mobility Disability": "mobility disability",
    "Self-care Disability": "self-care disability",
    "Cognitive Disability": "cognitive disability",
    "Hearing Disability": "auditory disability",
    "Vision Disability": "visual disability",
    "Independent Living Disability": "independent disability",
    "No Disability": "all disability"
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Module Globals
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let activeDisability = null;
let visibleVerseIndex = -1;
const allVerses = d3.selectAll(".line");
let isClicking = false;
let clickTimeout = null;
let scrollTimeout = null;
let isScrolling = false;
let pieChart; // Declare pieChart globally

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Keyframe Lookup Function
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function findFirstKeyframeByDisability(disabilityId) {
    const mappedDisability = disabilityMapping[disabilityId];
    if (mappedDisability) {
        for (let i = 0; i < keyframes.length; i++) {
            if (keyframes[i].disabilityId === mappedDisability) {
                return i;
            }
        }
    }
    return null;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Keyframe Transition Function
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function scrollToKeyframe(index) {
    if (index !== null && index >= 0 && index < keyframes.length) {
        console.log("moving to")
        console.log(index)

        const kf = keyframes[index];
        d3.selectAll(".verse").classed("active-verse", false);
        d3.selectAll(".line").classed("active-line", false);

        const activeVerseElement = d3.select(`#${kf.verseId}`);
        const firstLineOfVerse = 3 * Math.floor(index / 3);
        if (!activeVerseElement.empty()) {
            activeVerseElement.classed("active-verse", true);
            console.log("FLO")
            console.log(activeVerseElement.select(`.line:nth-child(${kf.activeLines[0] + 1})`));
            activeVerseElement.select(`.line:nth-child(${kf.activeLines[0] + 1})`).classed("active-line", true);

            // Find the index of the *first line* of this verse.  This is crucial.
            if (firstLineOfVerse !== -1) {
                console.log("SHUT UP");
                const verse = activeVerseElement.select(".line").node();
                const poetryColumn = verse.parentNode;
                poetryColumn.scrollTop = verse.offsetTop - poetryColumn.offsetTop - (poetryColumn.offsetHeight - verse.offsetHeight) / 2;
            }
        }
        console.log("COMPARE OLD TO NEW");
        console.log(previousVerseIndex);
        console.log(firstLineOfVerse);
        console.log(firstLineOfVerse == previousVerseIndex);
        if (firstLineOfVerse !== previousVerseIndex) {
            const currentDisabilityId = kf.disabilityId;
            const targetData = bubbleData.find(d => disabilityMapping[d.id] === currentDisabilityId);
            simulation?.stop();
            createSimulation(targetData); // Pass targetData

            simulation.alphaTarget(0.3).restart();
            simulation.transitionDuration = 250;
            previousVerseIndex = firstLineOfVerse;
        }
        if (kf['svgUpdate']) kf['svgUpdate']();
    }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// bob
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function bob() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 50)  // Set the y-coordinate
        .text("HELP")
        .attr("font-size", "50px") // make the text visible
        .attr("fill", "black");
    let percentiles = await loadPercentileData("JOB");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let percentData = percentiles[dId].map((r) => [r.Response_Value, r.Percentage]);
            displayPieCharts(d, d.data.id, percentData);

        }
    });
    return bob;
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// load a df
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function loadPercentileData(response) {
    let filestr = "percentages/" + response + "_df.csv";
    let percentileData = await d3.csv(filestr);
    dict_obj = Object.keys(disabilityMapping).map((disability) => (percentileData.filter((d) => d.Disability_Type == disability)));
    return dict_obj;
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Bubble Click Handler
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function handleBubbleClick(event, d) {
    const disabilityId = d.data.id;
    const firstKeyframeIndex = findFirstKeyframeByDisability(disabilityId);
    if (firstKeyframeIndex !== null) {
        visibleVerseIndex = firstKeyframeIndex;
        scrollToKeyframe(firstKeyframeIndex);
    }
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Button Click Handlers
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function forwardClicked() {
    if (isClicking) return;
    isClicking = true;
    if (visibleVerseIndex < allVerses.size() - 1) {
        visibleVerseIndex++;
        scrollToKeyframe(visibleVerseIndex);
    } else {
        visibleVerseIndex = 0;
        scrollToKeyframe(0);
    }
    clickTimeout = setTimeout(() => {
        isClicking = false;
        clickTimeout = null;
    }, 750);
}

function backwardClicked() {
    if (isClicking) return;
    isClicking = true;
    if (visibleVerseIndex > 0) {
        visibleVerseIndex--;
        scrollToKeyframe(visibleVerseIndex);
    } else {
        visibleVerseIndex = allVerses.size() - 1;
        scrollToKeyframe(visibleVerseIndex);
    }
    clickTimeout = setTimeout(() => {
        isClicking = false;
        clickTimeout = null;
    }, 750);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Keyframe Drawer
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function drawKeyframe(kfi) {
    let kf = keyframes[Math.min(kfi, keyframes.length - 1)];

    d3.selectAll(".verse").classed("active-verse", false);
    d3.selectAll(".line").classed("active-line", false);

    const activeVerseElement = d3.select(`#${kf.verseId}`);
    activeVerseElement.classed("active-verse", true);
    activeVerseElement.select(`.line:nth-child(${kf.activeLines[0] + 1})`).classed("active-line", true);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Pie Chart Functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function displayPieCharts(data, disabilityId, pieData) { // Changed 'node' to 'data'
    const radius = data.r;
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create one pie generator
    const pie = d3.pie().value(d => d[1]);
    let data_ready = pie(pieData);
    var arcGenerator = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    console.log( d3.select(data.parent));
    // Append a new g element to this node group to hold the pie chart
    const pieGroup = svg.append("g")
        .attr("id", disabilityId.replaceAll(" ","_") + "_pie")
        .attr("transform", `translate(${data.x}, ${data.y})`); // Initially center at the node's center

    // Create the pie slices within this group
    pieGroup
        .selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arcGenerator)
        .attr('fill', function(d){ return(color(d.data[0])) }) // Use d.data[0] as key
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0)
        .transition(500)
        .style("opacity", 0.7);
    
    pieGroup
        .selectAll('text')
        .data(data_ready)
        .enter()
        .append('text')
        .text(function(d){
            let init = parseFloat(d.data[1]);
            console.log(typeof(init));
            if (init < 10) {
                return '';
            } else return `${init.toFixed(2)}%`;
        })
        .attr("transform", function(d) { return "translate(" + arcGenerator.centroid(d) + ")";  })
        .style("text-anchor", "middle")
        .style("font-size", radius * 0.15)
    

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Event Listeners
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
window.addEventListener('wheel', (event) => {
    if (isScrolling) {
        return;
    }

    isScrolling = true;

    if (event.deltaY > 0) {
        forwardClicked();
    } else if (event.deltaY < 0) {
        backwardClicked();
    }

    scrollTimeout = setTimeout(() => {
        isScrolling = false;
        scrollTimeout = null;
    }, 500);
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await loadData();
        bubbleData = data;
        createBubbleChart(data); //initial call
        createSimulation(); // call is made in createBubbleChart
        document.getElementById("forward-button").addEventListener("click", forwardClicked);
        document.getElementById("backward-button").addEventListener("click", backwardClicked);


    } catch (error) {
        console.error('Error loading visualization:', error);
        const bubbleChartContainer = document.getElementById("bubble-chart-container");
        if (bubbleChartContainer) {
            d3.select("#bubble-chart-container")
                .append("div")
                .text("Error loading visualization data");
        }
    }
});
