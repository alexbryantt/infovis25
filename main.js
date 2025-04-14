//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Keyframes (Ordered for column-wise, line-by-line progression)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let keyframes = [
    // Left Column - Verse 1
    { disabilityId: "all disability", verseId: "verse1", activeLines: [1] },
    { disabilityId: "all disability", verseId: "verse1", activeLines: [2] },
    { disabilityId: "all disability", verseId: "verse1", activeLines: [3] },

    // Left Column - Verse 4
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [1] },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [2] },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [3] },

    // Left Column - Verse 6
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [1] },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [2] },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [3] },

    // Right Column - Verse 2
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [1] },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [2] },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [3] },

    // Right Column - Verse 3
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [1] },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [2] },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [3] },

    // Right Column - Verse 5
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [1] },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [2] },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [3] },

    // Right Column - Verse 7
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [1] },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [2] },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [3] },
];

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Data loader functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
async function loadData() {
    return d3.csv("../summaries_ready.csv", d => ({
        id: d.Response,
        value: +d.WeightedNumber
    })).then(data => data.filter(d => d.id !== "Any Disability"));
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Creates dynamic bubble chart
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
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

    const svg = d3.select("#bubble-chart-container")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif;")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("text-anchor", "middle");

    const node = svg.append("g")
        .selectAll()
        .data(root.leaves())
        .join("g");

    const circle = node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.id))
        .attr("r", d => d.r)
        .on("click", handleBubbleClick); // Add click event listener

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`)
        .style("font-size", d => `${0.2 * d.r}px`)
        .selectAll("tspan")
        .data(d => d.data.id.split(/(?=[A-Z][a-z])|\s+/g).concat(d3.format(",d")(d.value)))
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
        .text(d => d);

    const simulation = d3.forceSimulation(root.leaves())
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.r + 2))
        .force("x", d3.forceX(width / 2).strength(0.02))
        .force("y", d3.forceY(height / 2).strength(0.02))
        .on("tick", () => {
            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

    simulation.force("special", alpha => {
        root.leaves().forEach(d => {
            if (d.data.id === "No Disability") {
                d.fx = width / 2;
                d.fy = height / 2;
            } else {
                d.fx = null;
                d.fy = null;
            }
        });
    });
}

let activeDisability = null;

function handleBubbleClick(event, d) {
    const disabilityId = d.data.id;
    console.log("Clicked bubble:", disabilityId);

    // Reset previous highlighting
    d3.selectAll(".verse").classed("active-verse", false);
    d3.selectAll(".line").classed("active-line", false);

    // Find the verse associated with the clicked disability
    const verseElement = d3.selectAll(".verse")
        .filter(function() {
            return d3.select(this).attr("data-disability") === disabilityId;
        });

    if (!verseElement.empty()) {
        verseElement.classed("active-verse", true);
        verseElement.select(".line").classed("active-line", true);
        // Find the index of this verse and update visibleVerseIndex
        const allVerses = d3.selectAll(".verse").nodes();
        visibleVerseIndex = allVerses.indexOf(verseElement.node());
        scrollToVerse(visibleVerseIndex); // Scroll to the clicked verse
    }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Clicking behaviors - taken from scrollytell
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let isClicking = false;
let keyframeIndex = 0;
let visibleVerseIndex = 0;
const allVerses = d3.selectAll(".line");

function scrollToVerse(index) {
    if (index >= 0 && index < allVerses.size()) {
        const verse = allVerses.nodes()[index];
        const poetryColumn = verse.parentNode;
        poetryColumn.scrollTop = verse.offsetTop - poetryColumn.offsetTop - (poetryColumn.offsetHeight - verse.offsetHeight) / 2;
        drawKeyframe(index);
        visibleVerseIndex = index;
    }
}

function forwardClicked() {
    if (isClicking) return;
    isClicking = true;
    console.log(allVerses.size() - 1);
    if (visibleVerseIndex < allVerses.size() - 1) {
        visibleVerseIndex++;
        scrollToVerse(visibleVerseIndex);
    } else {
        visibleVerseIndex = 0;
        scrollToVerse(visibleVerseIndex);
    }
    clickTimeout = setTimeout(() => {
        isClicking = false;
        clickTimeout = null;
    }, 200);
}

function backwardClicked() {
    if (isClicking) return;
    isClicking = true;
    if (visibleVerseIndex > 0) {
        visibleVerseIndex--;
        scrollToVerse(visibleVerseIndex);
    } else {
        visibleVerseIndex = allVerses.size() - 1;
        scrollToVerse(visibleVerseIndex);
    }
    clickTimeout = setTimeout(() => {
        isClicking = false;
        clickTimeout = null;
    }, 200);
}

function drawKeyframe(kfi) {
    console.log(kfi);
    let kf = keyframes[Math.min(kfi, keyframes.length - 1)];
    console.log(kf);
    d3.selectAll(".verse").classed("active-verse", false);
    d3.selectAll(".line").classed("active-line", false);
    console.log(kf.verseId);

    const activeVerseElement = d3.select(`#${kf.verseId}`);
    activeVerseElement.classed("active-verse", true);

    kf.activeLines.forEach(lineIndex => {
        activeVerseElement.select(`#line${lineIndex}`).classed("active-line", true);
    });
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Scrolling behaviors
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let scrollTimeout = null;
let isScrolling = false;

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

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Initialize the Event Listener
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await loadData();
        createBubbleChart(data);

        document.getElementById("forward-button").addEventListener("click", forwardClicked);
        document.getElementById("backward-button").addEventListener("click", backwardClicked);

        // Initialize scroll to the first verse
        scrollToVerse(0);

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