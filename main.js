//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Data: Keyframe Definitions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let keyframes = [
    { disabilityId: "all disability", verseId: "verse1", activeLines: [1], svgUpdate: bob },
    { disabilityId: "all disability", verseId: "verse1", activeLines: [2], svgUpdate: steve},
    { disabilityId: "all disability", verseId: "verse1", activeLines: [3], svgUpdate: sophia },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [1], svgUpdate: bob },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [2], svgUpdate: steve },
    { disabilityId: "mobility disability", verseId: "verse2", activeLines: [3], svgUpdate: sophia },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [1], svgUpdate: bob },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [2], svgUpdate: steve },
    { disabilityId: "self-care disability", verseId: "verse3", activeLines: [3], svgUpdate: sophia },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [1], svgUpdate: bob },
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [2], svgUpdate: steve},
    { disabilityId: "cognitive disability", verseId: "verse4", activeLines: [3], svgUpdate: sophia},
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [1], svgUpdate: bob },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [2], svgUpdate: steve },
    { disabilityId: "auditory disability", verseId: "verse5", activeLines: [3], svgUpdate: sophia },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [1], svgUpdate: bob },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [2], svgUpdate: steve },
    { disabilityId: "visual disability", verseId: "verse6", activeLines: [3], svgUpdate: sophia },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [1], svgUpdate: bob },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [2], svgUpdate: steve },
    { disabilityId: "independent disability", verseId: "verse7", activeLines: [3], svgUpdate: sophia },
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
        .text(d => d)
        .attr("font-family", "Montserrat");

    bubbleData = data;
}

function createSimulation(clickedData = null, countsForFirst = true) { //changed
    const width = 1000;
    const height = width;
    const margin = 1;
    const collisionRadius = 5;

    const root = d3.pack().size([width - margin * 10, height - margin * 10]).padding(4)(d3.hierarchy({ children: bubbleData }).sum(d => d.value));

    // Only create the simulation if it doesn't exist or if we're in the first verse
    if (!simulation || isFirstClick) {
        simulation = d3.forceSimulation(root.leaves())
            .force("collision", d3.forceCollide().radius(d => d.r + collisionRadius).strength(1));

        if (isFirstClick && countsForFirst) {
            simulation.force("center", d3.forceCenter(width / 2, height / 2));
            isFirstClick = false;
        }

        simulation.force("special", alpha => { // Changed to use alpha
            const heightFactor = 1.5; // Changed from 2 to 1.5 to position bubbles lower
            const verticalOffset = 100; // Additional offset to move bubbles down
            
            simulation.nodes().forEach(node => {
                if (clickedData && node.data.id === clickedData.id) { //use clickedData
                    node.fx = width / 2;
                    node.fy = (height / heightFactor) + verticalOffset;
                } else if (isFirstClick && node.data.id === "No Disability") {
                    node.fx = width / 2;
                    node.fy = (height / heightFactor) + verticalOffset;
                }
                else {
                    node.fx = null;
                    const targetY = node.y + 10 + verticalOffset;
                    const bottomBoundary = height - node.r - 20; // Keep a margin at the bottom
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
    } else {
        // For non-first verses, just update the pie charts without changing positions
        const node = svg.selectAll("g").data(root.leaves());
        node.data().forEach((d) => {
            let dId = d.data.id;
            let pie = svg.select("#" + dId.replaceAll(" ","_") + "_pie");
            pie.attr("transform", () => `translate(${d.x},${d.y})`);
        });
    }
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
// Scroll variables removed to allow free scrolling
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
        
        // Apply smooth transitions
        d3.selectAll(".verse")
            .classed("active-verse", false);
            
        d3.selectAll(".line")
            .classed("active-line", false);

        const activeVerseElement = d3.select(`#${kf.verseId}`);
        const firstLineOfVerse = 3 * Math.floor(index / 3);
        if (!activeVerseElement.empty()) {
            // Apply classes with transitions
            activeVerseElement
                .classed("active-verse", true);
            
            // Get the correct line based on the activeLines array in the keyframe
            // The line elements start at index 2 (after the title), so we add 1 to the activeLines value
            const lineIndex = kf.activeLines[0] + 1;
            const lineSelector = `#${kf.verseId} .line:nth-of-type(${lineIndex})`;
            d3.select(lineSelector)
                .classed("active-line", true);
            
            // Find the index of the *first line* of this verse.  This is crucial.
            if (firstLineOfVerse !== -1) {
                const verse = activeVerseElement.select(".line").node();
                const poetryColumn = verse.parentNode;
                
                // Smooth scroll instead of jump
                d3.select(poetryColumn)
                    .transition()
                    .duration(400)
                    .tween("scrollTop", function() {
                        const targetScrollTop = verse.offsetTop - poetryColumn.offsetTop - (poetryColumn.offsetHeight - verse.offsetHeight) / 2;
                        const i = d3.interpolateNumber(poetryColumn.scrollTop, targetScrollTop);
                        return function(t) {
                            poetryColumn.scrollTop = i(t);
                        };
                    });
            }
        }
        
        // Only run simulation for first verse (which is verse1)
        if (kf.verseId === "verse1" && previousVerseIndex !== 0) {
            const currentDisabilityId = kf.disabilityId;
            const targetData = bubbleData.find(d => disabilityMapping[d.id] === currentDisabilityId);
            simulation?.stop();
            createSimulation(targetData, true); // Pass targetData and force simulation

            simulation.alphaTarget(0.3).restart();
            simulation.transitionDuration = 250;
        }
        
        previousVerseIndex = firstLineOfVerse;
        
        // Update node opacities based on disability type and verse
        updateNodeOpacities(kf.disabilityId);
        
        // Update bar chart to reflect current disability, but only if not "all disability"
        if (kf.disabilityId !== "all disability") {
            if (visibleVerseIndex % 3 === 0) {
                loadPercentileData("JOB").then(percentiles => {
                    updateBarChart("JOB", percentiles);
                });
            } else if (visibleVerseIndex % 3 === 1) {
                loadPercentileData("INCOMEN").then(percentiles => {
                    updateBarChart("INCOMEN", percentiles);
                });
            } else if (visibleVerseIndex % 3 === 2) {
                loadPercentileData("EDUCATE").then(percentiles => {
                    updateBarChart("EDUCATE", percentiles);
                });
            }
        } else {
            // Clear bar chart for "all disability"
            d3.select("#bar-chart-container svg").remove();
        }
        
        clearAnimations();
        if (kf['svgUpdate']) kf['svgUpdate']();
    }
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Clearing stuff
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let currentAnimations = new Set();
function clearAnimations(){
    // Clear all animations
    console.log("currentAnimations");
    console.log(currentAnimations);
    // Loop through the currentAnimations set and call each function
    currentAnimations.forEach(key =>  {
        console.log(key);
        if (key) {
            key();
        }
    });
    currentAnimations = new Set();
}
function clearPieCharts(){
    // Remove all pie charts
    console.log("Clear pie charts");
    svg.selectAll("g[id$='_pie']")
    .transition(150)
    .style("opacity", 0)
    .remove();

    // Remove the legend
    svg.selectAll(".legend")
        .transition(150)
        .style("opacity", 0)
        .remove();

    // Remove all labels
    svg.selectAll("#label, #label-line2")
        .transition(150)
        .style("opacity", 0)
        .remove();
        
    // Clear bar chart
    d3.select("#bar-chart-container svg").remove();
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// bob, steve, and jerry (all disability pie charts)
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

async function bob() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 25)  // Set the y-coordinate
        .text("Employment status among \n adults 18 years of age or older")
        .attr("font-size", "35px") // make the text visible
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    let percentiles = await loadPercentileData("JOB");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let pDataExists = percentiles[dId]
            if(pDataExists) {
                percentData = pDataExists.map((r) => [r.Response_Value, r.Percentage, r.Disability_Type]);
                displayPieCharts(d, d.data.id, percentData, "JOB");
            }

        }
    });
    
    // Update the horizontal bar chart
    updateBarChart("JOB", percentiles);
    
    console.log("adding to be cleared");
    currentAnimations.add(clearPieCharts);
    return bob;
}

async function steve() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 25)  // Set the y-coordinate
        .text("Income level among adults 18 years of age or older")
        .attr("font-size", "35px") // make the text visible
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    
    let percentiles = await loadPercentileData("INCOMEN");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let pDataExists = percentiles[dId]
            if(pDataExists) {
                percentData = pDataExists.map((r) => [r.Response_Value, r.Percentage, r.Disability_Type]);
                displayPieCharts(d, d.data.id, percentData, "INCOMEN");
            }

        }
    });
    
    // Update the horizontal bar chart
    updateBarChart("INCOMEN", percentiles);
    
    console.log("adding to be cleared");
    
    currentAnimations.add(clearPieCharts);
    return bob;
}

async function jerry() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 25)  // Set the y-coordinate
        .text("Education levels among adults")
        .attr("font-size", "35px") // make the text visible
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    
    // Add a second line of text for long titles
    bobGroup.append("text")
        .attr("id", "label-line2")
        .attr("x", width / 2)
        .attr("y", 65)  // Position below the first line
        .text("18 years of age or older")
        .attr("font-size", "35px")
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    
    let percentiles = await loadPercentileData("EDUCATE");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let pDataExists = percentiles[dId]
            if(pDataExists) {
                percentData = pDataExists.map((r) => [r.Response_Value, r.Percentage, r.Disability_Type]);
                displayPieCharts(d, d.data.id, percentData, "EDUCATE");
            }

        }
    });
    
    // Update the horizontal bar chart
    updateBarChart("EDUCATE", percentiles);
    
    console.log("adding to be cleared");
    
    currentAnimations.add(clearPieCharts);
    return bob;
}

async function sophia() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 25)  // Set the y-coordinate
        .text("Education levels among adults 18 years of age or older")
        .attr("font-size", "35px") // make the text visible
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    
    let percentiles = await loadPercentileData("EDUCATE");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let pDataExists = percentiles[dId]
            if(pDataExists) {
                percentData = pDataExists.map((r) => [r.Response_Value, r.Percentage, r.Disability_Type]);
                displayPieCharts(d, d.data.id, percentData);
            }

        }
    });
    
    // Update the horizontal bar chart
    updateBarChart("EDUCATE", percentiles);
    
    console.log("adding to be cleared");
    
    currentAnimations.add(clearPieCharts);
    return bob;
}

async function claude() {
    // Add a g element, and add a text element within that.
    const bobGroup = svg.append("g").attr('id', 'bob-group');
    bobGroup.append("text")
        .attr("id", "label")
        .attr("x", width / 2)  // Set the x-coordinate
        .attr("y", 25)  // Set the y-coordinate
        .text("Mental health days taken among adults")
        .attr("font-size", "35px") // make the text visible
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
        
    // Add a second line of text for long titles
    bobGroup.append("text")
        .attr("id", "label-line2")
        .attr("x", width / 2)
        .attr("y", 65)  // Position below the first line
        .text("18 years of age or older")
        .attr("font-size", "35px")
        .attr('text-anchor', 'middle')
        .attr("fill", "black")
        .attr("font-family", "Montserrat");
    
    let percentiles = await loadPercentileData("MHDAYS");
    console.log(svg.selectAll("g"))
    svg.selectAll("g").each((d) => { //changed from forEach to each
        if (d) {
            let dId = Object.keys(disabilityMapping).indexOf(d.data.id);
            let pDataExists = percentiles[dId]
            if(pDataExists) {
                percentData = pDataExists.map((r) => [r.Response_Value, r.Percentage, r.Disability_Type]);
                displayPieCharts(d, d.data.id, percentData);
            }

        }
    });
    
    // Update the horizontal bar chart - using education data for consistency
    let educationPercentiles = await loadPercentileData("EDUCATE");
    updateBarChart("EDUCATE", educationPercentiles);
    
    console.log("adding to be cleared");
    
    currentAnimations.add(clearPieCharts);
    return bob;
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// staging mobility arrangements
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
let mobilityOneRepositioned = false;
let income_percentiles = {}
async function mobilityOne() {
    let percentiles = await loadPercentileData("INCOMEN");
    console.log("percentiles");
    console.log(percentiles);
    console.log("nodes");
    let dTypes = d3.selectAll("g")
        .filter((d) => (d && d.data.id))
        .data().map((d) => {return d.data.id});
    let dDict = {}
    percentiles.forEach((d) => {
        if (d.length > 0){
            dDict[d[4].Disability_Type] = parseFloat(d[4].Percentage);
            console.log(d[4].Disability_Type, d[4].Percentage)
        }
    });
    let ranking = dTypes.sort((a, b) => - dDict[a] + dDict[b]);
    console.log(ranking);
    setTimeout(() => {
        simulation.stop();
        d3.selectAll("g").each(function(d) {
            if(d && d.data.id){
                let pos = ranking.indexOf(d.data.id);
                let newX = pos * width / ranking.length;
                console.log(newX);
                d3.select(this)
                .transition(750)
                .attr("transform", `translate(${newX}, ${d.y})`);
                console.log("done");
            }
        });
     }, 1500);
    
     
    mobilityOneRepositioned=true;
    console.log("End");
    income_percentiles = dDict;
}

function mobilityTwo(){
    setTimeout(() => {
        d3.selectAll("g").filter((d) => (d && d.data.id))
        .transition(500)
        .attr("translate", (d) => {
            console.log(width - income_percentiles[d.data.id]);
            return `(${d.x},${0.000005*(width - income_percentiles[d.data.id])})`;
        });
    }, 15);

    // Optionally, you might want to re-apply a specific y-positioning force
    // instead of relying on the default gravity/centering.
    // For example, to keep them roughly in the middle:
    // simulation.force("y", d3.forceY(height / 2).strength(0.1));
    // simulation.alpha(0.3).restart();
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
// Bar Chart Functions
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function updateBarChart(dataType, percentiles) {
    // Clear any existing bar chart
    d3.select("#bar-chart-container svg").remove();
    
    // Get currently selected disability 
    const currentKeyframe = keyframes[visibleVerseIndex] || { disabilityId: "all disability" };
    const currentDisabilityId = currentKeyframe.disabilityId;
    
    // Don't show bar chart for "all disability"
    if (currentDisabilityId === "all disability") {
        return;
    }
    
    // Set up SVG dimensions
    const margin = { top: 30, right: 30, bottom: 50, left: 150 };
    const barChartWidth = document.getElementById('bar-chart-container').offsetWidth - margin.left - margin.right;
    const barChartHeight = document.getElementById('bar-chart-container').offsetHeight - margin.top - margin.bottom;
    
    // Create SVG element
    const barSvg = d3.select("#bar-chart-container")
        .append("svg")
        .attr("width", barChartWidth + margin.left + margin.right)
        .attr("height", barChartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const mappedDisability = Object.keys(disabilityMapping).find(key => disabilityMapping[key] === currentDisabilityId);
    
    // Only show "No Disability" and the current disability
    const noDisabilityIndex = Object.keys(disabilityMapping).indexOf("No Disability");
    const currentDisabilityIndex = Object.keys(disabilityMapping).indexOf(mappedDisability);
    
    let chartData = [];
    let title = "";
    
    // Extract the relevant data based on the dataType
    if (dataType === "JOB") {
        // Employment data (employed vs not)
        title = "Employment status comparison";
        const employed = "Employed";
        
        // No Disability data
        if (percentiles[noDisabilityIndex]) {
            const noDisabilityEmployed = percentiles[noDisabilityIndex].find(d => d.Response_Value === employed);
            if (noDisabilityEmployed) {
                chartData.push({
                    category: "No Disability",
                    value: parseFloat(noDisabilityEmployed.Percentage),
                    label: "Employed"
                });
            }
        }
        
        // Current disability data
        if (percentiles[currentDisabilityIndex]) {
            const disabilityEmployed = percentiles[currentDisabilityIndex].find(d => d.Response_Value === employed);
            if (disabilityEmployed) {
                chartData.push({
                    category: mappedDisability,
                    value: parseFloat(disabilityEmployed.Percentage),
                    label: "Employed"
                });
            }
        }
    } 
    else if (dataType === "INCOMEN") {
        // Income data (>50k vs <50k)
        title = "Income above $50,000 comparison";
        const highIncome = "$50,000 to less than $75,000"; // Using this as threshold
        
        // No Disability data
        if (percentiles[noDisabilityIndex]) {
            const aboveThreshold = percentiles[noDisabilityIndex]
                .filter(d => {
                    const respValue = d.Response_Value;
                    return respValue.includes("$75,000") || respValue.includes("$100,000") || respValue.includes("$150,000") || respValue.includes("$50,000");
                })
                .reduce((sum, item) => sum + parseFloat(item.Percentage), 0);
            
            chartData.push({
                category: "No Disability",
                value: aboveThreshold,
                label: "Income ≥ $50k"
            });
        }
        
        // Current disability data
        if (percentiles[currentDisabilityIndex]) {
            const aboveThreshold = percentiles[currentDisabilityIndex]
                .filter(d => {
                    const respValue = d.Response_Value;
                    return respValue.includes("$75,000") || respValue.includes("$100,000") || respValue.includes("$150,000") || respValue.includes("$50,000");
                })
                .reduce((sum, item) => sum + parseFloat(item.Percentage), 0);
            
            chartData.push({
                category: mappedDisability,
                value: aboveThreshold,
                label: "Income ≥ $50k"
            });
        }
    }
    else if (dataType === "EDUCATE") {
        // Education data (college educated vs not)
        title = "College education comparison";
        
        // No Disability data
        if (percentiles[noDisabilityIndex]) {
            const collegeEducated = percentiles[noDisabilityIndex]
                .filter(d => {
                    const respValue = d.Response_Value;
                    return respValue.includes("College") || respValue.includes("college") || respValue.includes("Bachelor");
                })
                .reduce((sum, item) => sum + parseFloat(item.Percentage), 0);
            
            chartData.push({
                category: "No Disability",
                value: collegeEducated,
                label: "College Educated"
            });
        }
        
        // Current disability data
        if (percentiles[currentDisabilityIndex]) {
            const collegeEducated = percentiles[currentDisabilityIndex]
                .filter(d => {
                    const respValue = d.Response_Value;
                    return respValue.includes("College") || respValue.includes("college") || respValue.includes("Bachelor");
                })
                .reduce((sum, item) => sum + parseFloat(item.Percentage), 0);
            
            chartData.push({
                category: mappedDisability,
                value: collegeEducated,
                label: "College Educated"
            });
        }
    }
    
    // Add title
    barSvg.append("text")
        .attr("x", barChartWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-family", "Montserrat")
        .style("fill", "white")
        .text(title);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, barChartWidth]);
    
    const yScale = d3.scaleBand()
        .domain(chartData.map(d => d.category))
        .range([0, barChartHeight])
        .padding(0.3);
    
    // Add X axis
    barSvg.append("g")
        .attr("transform", `translate(0,${barChartHeight})`)
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d => d + "%"))
        .selectAll("text")
        .style("font-family", "Montserrat")
        .style("fill", "white");
    
    // Style X axis
    barSvg.selectAll(".domain, .tick line")
        .style("stroke", "white");
    
    // Add Y axis
    barSvg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-family", "Montserrat")
        .style("fill", "white")
        .style("font-size", "14px");
    
    // Style Y axis
    barSvg.selectAll(".domain, .tick line")
        .style("stroke", "white");
    
    // Add bars
    const bars = barSvg.selectAll(".bar")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.category))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("fill", (d, i) => i === 0 ? "#69b3a2" : "#e15759")
        .attr("width", 0) // Start at width 0 for animation
        .transition()
        .duration(800)
        .attr("width", d => xScale(d.value));
    
    // Add value labels
    barSvg.selectAll(".label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => xScale(d.value) + 5)
        .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => d.value.toFixed(1) + "%")
        .style("font-family", "Montserrat")
        .style("fill", "white")
        .style("font-size", "14px")
        .style("opacity", 0) // Start transparent
        .transition()
        .duration(800)
        .style("opacity", 1); // Fade in
    
    // Add data label text
    barSvg.selectAll(".bar-label")
        .data(chartData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", 5)
        .attr("y", d => yScale(d.category) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")
        .text(d => d.label)
        .style("font-family", "Montserrat")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("text-anchor", "start");
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
function handlePieClick(event, d) {
    const disabilityId = d.data[2];
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

function displayPieCharts(data, disabilityId, pieData, flag = null) { 
    const radius = data.r;
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    console.log(pieData);
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

    // gets current disability
    const currentKeyframe = keyframes[visibleVerseIndex] || { disabilityId: "all disability" };
    const currentDisabilityId = currentKeyframe.disabilityId;
    
    // change opacity based on disability
    const pieOpacity = currentDisabilityId === "all disability" || 
                      disabilityMapping[disabilityId] === currentDisabilityId || 
                      disabilityId === "No Disability" ? 0.7 : 0.1;

    // Create the pie slices within this group
    pieGroup
        .selectAll('path')
        .data(data_ready)
        .enter()
        .append('path')
        .on("click", handlePieClick)
        .attr('d', arcGenerator)
        .attr('fill', function(d){ return(color(d.data[0])) }) // Use d.data[0] as key
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0)
        .transition(500)
        .style("opacity", pieOpacity);
    
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
        .attr("text-anchor", "middle")
        .style("font-size", radius * 0.15)
        .attr("font-family", "Montserrat")
        .style("opacity", pieOpacity); // sets proper pie opacity
        

    const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${200}, 100)`) // Moved down to avoid overlapping with the title
    .attr("font-family", "Montserrat");

    const legendRectSize = 23; 
    const legendSpacing = 12;
    const legendTextPadding = 10; 
    if (flag == "INCOMEN"){
        console.log("INCOME");
        console.log(pieData.map((d) => d[0]));
        let customOrder = [4, 0, 1, 2, 3, 5];
        data_ready = customOrder.map(i => data_ready[i]);
    }
    const legendItems = legend.selectAll(".legend-item")
        .data(data_ready)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * (legendRectSize + legendSpacing)})`);

    legendItems.append("rect")
        .attr("width", legendRectSize)
        .attr("height", legendRectSize)
        .style("fill", (d) => color(d.data[0])) // Use d.data[0]
        .style("stroke", "black")
        .style("stroke-width", 2); // Increased stroke width

    legendItems.append("text")
        .attr("x", legendRectSize + legendTextPadding) // Added padding
        .attr("y", legendRectSize - legendSpacing / 2)
        .style("font-size", "18px") // Larger font size
        .style("fill", "#333")       // Darker text color
        .style("font-weight", "bold")
        .style("text-anchor", "start")
        .text((d) => d.data[0]); // Use d.data[0]

}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Event Listeners
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Wheel event listener removed to allow free scrolling

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Node Opacity Control Function
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function updateNodeOpacities(currentDisabilityId) {
    const circles = svg.selectAll("circle");
    
    // "all disability" verse highlights all nodes
    if (currentDisabilityId === "all disability") {
        circles.transition().duration(300).attr("fill-opacity", 0.7);
        return;
    }
    
    // only keep the current disability type and "No Disability" at high opacity
    circles.each(function(d) {
        const nodeId = d.data.id;
        const nodeDisabilityType = disabilityMapping[nodeId];
        const isNoDisability = (nodeId === "No Disability");
        const isCurrentDisability = (nodeDisabilityType === currentDisabilityId);
        
        d3.select(this)
            .transition()
            .duration(300)
            .attr("fill-opacity", isCurrentDisability || isNoDisability ? 0.7 : 0.1);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await loadData();
        bubbleData = data;
        createBubbleChart(data); //initial call
        createSimulation(); // call is made in createBubbleChart
        
        // init opacity
        visibleVerseIndex = -1;
        updateNodeOpacities("all disability");
        
        // Don't initialize bar chart initially (since we start with all disability)
        
        document.getElementById("forward-button").addEventListener("click", forwardClicked);
        document.getElementById("backward-button").addEventListener("click", backwardClicked);
        document.getElementById("reset-button").addEventListener("click", async function(d) {
            //reset everything
            activeDisability = null;
            isFirstClick = true;
            previousVerseIndex = 0;
            
            // Clear any existing charts
            clearAnimations();
            clearPieCharts();
            
            // Reset simulation
            simulation?.stop();
            simulation = null;
            
            // Recreate the visualization
            svg.selectAll("*").remove();
            d3.select("#bubble-chart-container").selectAll("svg").remove();
            d3.select("#bar-chart-container svg").remove();
            
            // Redraw everything
            const data = await loadData();
            bubbleData = data;
            createBubbleChart(data);
            createSimulation(null, true);
            
            // Don't initialize bar chart after reset (since we reset to all disability)
            
            // Go to first verse and line
            visibleVerseIndex = 0;
            scrollToKeyframe(0);
        });


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
