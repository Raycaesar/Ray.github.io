let agentFollowers = {};
let agentBeliefs =  {'a':{
    messages: [],
    denotation: '{}'
},
'b':{
    messages: [],
    denotation: '{}'
},
'c':{
    messages: [],
    denotation: '{}'
},
'd':{
    messages: [],
    denotation: '{}'
},
'e':{
    messages: [],
    denotation: '{}'
}
};



let Agt = ['a', 'b', 'c', 'd', 'e']; // Global agents array
let Prop = ['p', 'q', 'r', 's', 't'];

document.addEventListener('DOMContentLoaded', function() {
    initializeAgents();
});

const agentColors = {}; // We use in graph Drawing
const colors = ['#D67293', '#73DEFA', '#5DB117', '#5A8CD7', '#CCCC00', '#9A5FD7', '#FA1CA8', '#A300A3', '#00A3A3', '#F5DAD2', '#DFD0B8', '#BACD92', '#75A47F']; // An array of colors for agents

Agt.forEach((agent, index) => {
    agentColors[agent] = colors[index % colors.length];
});

// Initialize agent buttons
function initializeAgents() {
    const followeeSelector = document.getElementById('followeeSelector');
    const followerSelector = document.getElementById('followerSelector');

    Agt.forEach(agent => {
    
        // Create buttons for selecting agents
        const agentButton = document.createElement('button');
        agentButton.innerText = agent;
        agentButton.style.backgroundColor = agentColors[agent];
        agentButton.onclick = () => selectAgent(agent);
        followeeSelector.appendChild(agentButton);

        // Create buttons for selecting followers
        const followerButton = document.createElement('button');
        followerButton.innerText = agent;
        followerButton.style.backgroundColor = agentColors[agent];
        followerButton.onclick = () => toggleFollower(agent);
        followerSelector.appendChild(followerButton);
    });
}

let selectedAgent = null;
let selectedFollowers = new Set();

function selectAgent(agent) {
    selectedAgent = agent;
    document.querySelectorAll('#followeeSelector button').forEach(button => {
        button.style.backgroundColor = button.innerText === agent ? '#2c5282' : agentColors[button.innerText];
    });
    // Reset follower selection
    selectedFollowers.clear();
    document.querySelectorAll('#followerSelector button').forEach(button => {
        button.style.backgroundColor = agentColors[button.innerText];
    });
}

function toggleFollower(agent) {
    if (selectedFollowers.has(agent)) {
        selectedFollowers.delete(agent);
    } else {
        selectedFollowers.add(agent);
    }
    document.querySelectorAll('#followerSelector button').forEach(button => {
        button.style.backgroundColor = selectedFollowers.has(button.innerText) ? '#2c5282' : agentColors[button.innerText];
    });
}

function setAgentFollowers() {
    if (selectedAgent) {
        agentFollowers[selectedAgent] = Array.from(selectedFollowers);
       
        //console.log(`${selectedAgent}'s followers`, agentFollowers[selectedAgent]);
    } else {
        alert("Please select an agent first.");
    }
    console.log("agentFollowers", agentFollowers);
}

// Display Followers


function drawNetwork() {
    setAgentFollowers();
    const svg = d3.select("#networkCanvas");
    svg.selectAll("*").remove();

    svg.append("defs").selectAll("marker")
        .data(["end"])
        .enter().append("marker")
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 30)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 30)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .style("fill", "#999");

    const nodes = Agt.map(agent => ({ id: agent }));
    const links = [];
    //console.log("agentFollowers inside drawNetwork:", agentFollowers);
    for (let agent in agentFollowers) {
        for (let follower of agentFollowers[agent]) {
            links.push({ source: follower, target: agent });
        }
    }

    //console.log("Nodes:", nodes);
    //console.log("Links:", links);

    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const nodeRadius = 20;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(220))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(30))
        .force("radial", d3.forceRadial(width / 3.5, width / 3, height / 3));
    simulation.alphaDecay(0.05);

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.7).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("marker-end", d => d.source.id !== d.target.id ? "url(#end)" : null)
        .style("stroke", "#999")
        .attr("fill", "none");

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", nodeRadius)
        .attr("fill", d => agentColors[d.id])
        .call(drag);

    const nodeText = svg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("font-size", 14)
        .attr("fill", "#dcf5f4")
        .attr("font-family", "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .text(d => d.id)
        .call(drag);

    function linkArc(d) {
        if (d.source.id === d.target.id) {
            const dr = 20;
            return `M${d.source.x},${d.source.y - nodeRadius}A${dr},${dr} 0 1,0 ${d.source.x},${d.source.y - (1.5 * nodeRadius)}Z`;
        } else {
            return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        }
    }

    function constrainPosition(val, max, radius) {
        return Math.max(radius, Math.min(max - radius, val));
    }

    simulation.on("tick", () => {
        link.attr("d", linkArc);

        node.attr("cx", d => constrainPosition(d.x, width, nodeRadius))
            .attr("cy", d => constrainPosition(d.y, height, nodeRadius));

        nodeText.attr("x", d => constrainPosition(d.x, width, 0))
                .attr("y", d => constrainPosition(d.y, height, 4));
    });
}


















function propSize() {
    size = 5;
}


// Modified drawBackground function to update the global Prop variable
function drawBackground() {

    displayBackground();
}

// Add event listener to the button
document.getElementById('drawBackgound').addEventListener('click', drawBackground);



function powerSet(set) {
    const powerSet = [];
    const total = Math.pow(2, set.length);
    for (let i = 0; i < total; i++) {
        const subset = [];
        for (let j = 0; j < set.length; j++) {
            // If the j-th position in the binary representation of i is 1, include the j-th element
            if (i & (1 << j)) {
                subset.push(set[j]);
            }
        }
        powerSet.push(subset);
    }
    return powerSet;
}

function getDenotationResult(agent) {
    if (agentBeliefs[agent] && typeof agentBeliefs[agent].denotation === 'string') {
       // console.log("agentBeliefs[agent].denotation:", agentBeliefs[agent].denotation);

        // Remove the outermost curly braces
        const denotationCore = agentBeliefs[agent].denotation.slice(2, -2);

        // Split the string by `}, {`
        const subsets = denotationCore.split(/},\s*{/);

        console.log("subsets:", subsets);

        // Further process each subset
        return subsets.map(subset => 
            subset.split(',').map(element => element.trim()).filter(Boolean)
        ); // Split each subset into individual elements, trim whitespace, and filter out any empty strings.
    }
    return []; // If the conditions are not met, return an empty array.
}




function drawcoherence() {
    //console.log("Displaying power set...");
    const powerSetOfProp = powerSet(Prop);
    //console.log("Displaying power set of Prop:", powerSetOfProp);
    const svgContainer = document.getElementById("beliefCanvas");
    svgContainer.innerHTML = '';

    // Increase the size of the SVG container
    svgContainer.setAttribute("width", "900");
    svgContainer.setAttribute("height", "600");

    powerSetOfProp.sort((a, b) => a.length - b.length);

    const maxWidth = powerSetOfProp.length;
    const maxHeight = Prop.length + 1;

    const verticalGap = svgContainer.height.baseVal.value / (maxHeight + 1);
    const circleRadius = 30;

    const scalingFactor = 1; // Adjust this value to control the horizontal spacing
   
    

    for (let i = 0; i <= Prop.length; i++) {
        const subsetsOfSizeI = powerSetOfProp.filter(subset => subset.length === i);
        //console.log("subsetsOfSizeI", subsetsOfSizeI);

        let beliefsForSubset = {};

        Agt.forEach(agent => {
            //console.log(`Agent ${agent} beliefs:`, agentBeliefs[agent].denotation);
            const denotationResult = getDenotationResult(agent);
            subsetsOfSizeI.forEach(subset => {
                //console.log(`Comparing subset [${subset.join(", ")}] with agent ${agent} beliefs [${agentBeliefs[agent].denotation}]`);
                const subsetStr = subset.sort().join(',');
                //console.log("subsetStr", subsetStr);
                //console.log("denotationResult", denotationResult);
                const isSubsetInDenotation = denotationResult.some(denotedSubset => 
                    denotedSubset.length === subset.length && 
                    denotedSubset.every(element => subset.includes(element))
                   
                );
                //console.log("isSubsetInDenotation", isSubsetInDenotation);
                if (isSubsetInDenotation) {
                    if (!beliefsForSubset[subsetStr]) beliefsForSubset[subsetStr] = [];
                    if (!beliefsForSubset[subsetStr].includes(agent)) { // Avoid double counting agents.
                        beliefsForSubset[subsetStr].push(agent);
                        //console.log("beliefsForSubset", beliefsForSubset);
                    }
                    
                }
            });
        });

        subsetsOfSizeI.forEach((subset, j) => {
            const subsetStr = subset.sort().join(',');
            const yOffset = (Prop.length - i + 1) * verticalGap;
            const horizontalGap = (svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1)) * scalingFactor;
            const xOffset = (j + 1) * horizontalGap;
            createCircle(xOffset, yOffset, subsetStr, svgContainer, circleRadius, beliefsForSubset[subsetStr] || []);
            
        });
    }
}






function createCircle(x, y, label, svgContainer, radius, believingAgents) {
    // Create an SVG circle element.
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", radius);
    circle.setAttribute("stroke", "#686673");
    circle.setAttribute("stroke-width", "0.5");

    // Filter out agents with an empty denotation.
    const agentsWithBeliefs = believingAgents.filter(agent => agentBeliefs[agent] && agentBeliefs[agent].denotation !== '{}');

    //console.log("agentsWithBeliefs:", agentsWithBeliefs);

    // Determine the fill color based on the believing agents.
    let fillColor = "white"; // Default to white (no belief).
     // Add a class to the circle for identification
     circle.classList.add("belief-node");

     // Add an event listener to the circle
     circle.addEventListener("click", function(event) {
         handleNodeClick(event, label);
     });

    if (agentsWithBeliefs.length === 1) {
        //console.log(`Assigning color for single agent belief: ${agentsWithBeliefs[0]}`);
        // If there is exactly one believing agent with non-empty denotation.
        const agent = agentsWithBeliefs[0];
        fillColor = agentColors[agent];
    } else if (agentsWithBeliefs.length > 1) {
        //console.log(`Assigning color for multiple agents: ${agentsWithBeliefs.join(", ")}`);
        // If there are multiple believing agents with non-empty denotation, we will create arcs later.
        fillColor = "none";
    }

    circle.setAttribute("fill", fillColor);

    // If there are multiple believing agents with non-empty denotation, create arcs for each agent's belief.
    if (agentsWithBeliefs.length > 1) {
        
        let startAngle = 0;
        const angleIncrement = 360 / agentsWithBeliefs.length;

        agentsWithBeliefs.forEach(agent => {
            const endAngle = startAngle + angleIncrement;
            createArc(svgContainer, x, y, startAngle, endAngle, radius, agentColors[agent]);
            startAngle = endAngle;
        });
    }
    


    // Add a label to the circle.
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dy", "0.3em");
    text.setAttribute("fill", "#40120a");
    text.setAttribute("font-family", "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif");
    text.textContent = label;
     // Add a class to the text for identification
     text.classList.add("belief-label");

     text.classList.add('draggable');
    // Append the circle and text to the SVG container.
    svgContainer.appendChild(circle);
    svgContainer.appendChild(text);
}






 // This function is responsible for visualizing the power set of propositions on an SVG canvas.
 function displayBackground() {
   // console.log("Displaying power set...");
    const powerSetOfProp = powerSet(Prop);
   // console.log("Displaying power set of Prop:", powerSetOfProp);
    const svgContainer = document.getElementById("beliefCanvas");
    svgContainer.innerHTML = '';

    // Increase the size of the SVG container
    svgContainer.setAttribute("width", "900");
    svgContainer.setAttribute("height", "600");

    powerSetOfProp.sort((a, b) => a.length - b.length);

    const maxWidth = powerSetOfProp.length;
    const maxHeight = Prop.length + 1;

    const verticalGap = svgContainer.height.baseVal.value / (maxHeight + 1);
    const circleRadius = 30;

    const scalingFactor = 1; // Adjust this value to control the horizontal spacing
   
    

    for (let i = 0; i <= Prop.length; i++) {
        const subsetsOfSizeI = powerSetOfProp.filter(subset => subset.length === i);
        //console.log("subsetsOfSizeI", subsetsOfSizeI);
        let beliefsForSubset = {};

    

        subsetsOfSizeI.forEach((subset, j) => {
            const subsetStr = subset.sort().join(',');
            const yOffset = (Prop.length - i + 1) * verticalGap;
            const horizontalGap = (svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1)) * scalingFactor;
            const xOffset = (j + 1) * horizontalGap;
            createNode(xOffset, yOffset, subsetStr, svgContainer, circleRadius, beliefsForSubset[subsetStr] || []);
        });
    }
}


function createNode(x, y, label, svgContainer, radius, believingAgents) {
    // Create an SVG circle element (node)
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", radius);
    circle.setAttribute("stroke", "#686673");
    circle.setAttribute("stroke-width", "0.5");
    circle.setAttribute("fill", "white"); // Default fill
    svgContainer.appendChild(circle);
    circle.setAttribute("data-label", label);
    // Assign a color based on the believing agents
    const color = assignColorsToNode(circle, selectedAgents);  // Modify this line
    circle.setAttribute("fill", color); // Set the color for the node
    //console.log(`Node created for label ${label} with color ${color}`); // Log the color assignme
    
    // Attach the click handler
    attachNodeClickHandler(circle, svgContainer);
    

    // Create and append the text element
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dy", "0.3em");
    text.textContent = label;
    text.setAttribute("data-label", label);
    svgContainer.appendChild(text);
}

let selectedAgents = []; // Define this outside to maintain scope

function attachNodeClickHandler(node, svgContainer) {
    node.addEventListener('click', function(event) {
        const existingDropdown = document.getElementById('agentSelector');
        if (existingDropdown) {
            existingDropdown.parentNode.removeChild(existingDropdown);
        }

        const dropdown = document.createElement('select');
        dropdown.setAttribute('id', 'agentSelector');
        dropdown.setAttribute('multiple', 'true');
        Agt.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent;
            option.text = agent;
            dropdown.appendChild(option);
        });

        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        dropdown.style.position = 'absolute';
        dropdown.style.left = (event.clientX + scrollLeft) + 'px';
        dropdown.style.top = (event.clientY + scrollTop) + 'px';

        document.body.appendChild(dropdown);

        

        dropdown.addEventListener('change', function() {
            selectedAgents = Array.from(dropdown.selectedOptions).map(option => option.value);
            //console.log("selectedAgents:", selectedAgents);
        });

        dropdown.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                if (selectedAgents.length > 0) {
                    assignColorsToNode(node, selectedAgents);
                    bringTextToFront(node);
        
                    // Ensure you are getting the right text element
                    const label = node.getAttribute('data-label'); // Assuming you set this in createNode
                    const textElement = svgContainer.querySelector(`text[data-label='${label}']`);
                    const nodeText = textElement ? textElement.textContent.trim() : '';
        
                    if (nodeText) {
                        selectedAgents.forEach(agent => {
                            updateAgentBeliefFromNode(agent, nodeText);
                        });
                    } else {
                        // Handle empty or missing text (like the empty set in a powerset)
                        selectedAgents.forEach(agent => {
                            updateAgentBeliefFromNode(agent, ""); // Pass an empty string for nodeText
                        });
                    }
                    
                    if (dropdown.parentNode) {
                        dropdown.parentNode.removeChild(dropdown);
                    }
                    window.removeEventListener('click', handleClickOutsideBound);
                }
            }
        });
        

        // Use a bound function to correctly remove the event listener later
        const handleClickOutsideBound = (event) => handleClickOutside(event, dropdown);
        setTimeout(() => {
            window.addEventListener('click', handleClickOutsideBound);
        }, 0);
    });
}


function handleClickOutside(event, dropdown) {
    if (dropdown && dropdown.parentNode && !dropdown.contains(event.target)) {
        dropdown.parentNode.removeChild(dropdown);
        // Remove this specific listener to prevent memory leaks or unintended behavior
        window.removeEventListener('click', handleClickOutsideBound);
    }
}

function assignColorsToNode(node, selectedAgents) {
    // Clear existing colors/arcs
    clearNodeColors(node);

    if (!selectedAgents || selectedAgents.length === 0) {
        // If no agents are selected, return default color
        return 'white';
    }

    if (selectedAgents.length === 1) {
        // Directly change the fill color of the node for a single agent
        const fillColor = agentColors[selectedAgents[0]] || colors[colorCounter++ % colors.length];
        node.setAttribute("fill", fillColor);
        return fillColor;
    } else {
        // Draw arcs for multiple agents
        const cx = parseInt(node.getAttribute('cx'));
        const cy = parseInt(node.getAttribute('cy'));
        const radius = parseInt(node.getAttribute('r'));
        const angleIncrement = 360 / selectedAgents.length;
        let startAngle = 0;

        selectedAgents.forEach(agent => {
            const endAngle = startAngle + angleIncrement;
            const fillColor = agentColors[agent] || colors[colorCounter++ % colors.length];
            createArc(document.getElementById('beliefCanvas'), cx, cy, startAngle, endAngle, radius, fillColor);
            startAngle = endAngle;
        });

        // Return the color of the first agent for consistency
        return agentColors[selectedAgents[0]] || colors[0];
    }

    // Move the text element to the front
    bringTextToFront(node);
}

// This function creates an arc in the SVG container to represent an agent's belief.
function createArc(svgContainer, cx, cy, startAngle, endAngle, radius, fillColor) {
    // Convert polar coordinates to Cartesian for the SVG path.
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);

    // Determine if the arc should be drawn as a large arc or not.
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    // Construct the path data for the arc.
    const d = [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", cx, cy,
        "Z"
    ].join(" ");

    // Create an SVG path element for the arc.
    const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arc.setAttribute("d", d); // Set the path data.
    arc.setAttribute("fill", fillColor); // Set the fill color.
    svgContainer.appendChild(arc); // Append the arc to the SVG container.
}

// This function converts polar coordinates to Cartesian coordinates.
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}


function bringTextToFront(node) {
    // Assuming the next sibling is the text element
    const textElement = node.nextSibling;
    if (textElement && textElement.tagName === 'text') {
        node.parentNode.appendChild(textElement);
    }
}



function clearNodeColors(node) {
    // Assuming each node has a unique ID
    const nodeId = node.getAttribute('id');

    // Select all color elements associated with this node
    const svgContainer = document.getElementById("beliefCanvas");
    const colorElements = svgContainer.querySelectorAll(`[data-node-id='${nodeId}']`);

    // Remove each color element
    colorElements.forEach(element => {
        svgContainer.removeChild(element);
    });
}


function updateAgentBeliefFromNode(agent, nodeText) {
    // Removed the check for empty nodeText

    // Check if 'agent' is defined and a valid key in 'agentBeliefs'
    if (typeof agent === 'undefined' || !Agt.includes(agent)) {
        console.error(`Agent '${agent}' is not defined or not in the list of agents.`);
        return;
    }

    // Ensure the agent's belief entry is initialized
    if (!agentBeliefs[agent]) {
        agentBeliefs[agent] = {
            messages: [],
            denotation: '{}'
        };
    }

    // Update the messages array
    if (nodeText && !agentBeliefs[agent].messages.includes(nodeText)) {
        agentBeliefs[agent].messages.push(nodeText);
    }

    // Update the denotation string
    updateDenotationString(agent, nodeText);
}


// Helper function to update the denotation string
function updateDenotationString(agent, nodeText) {
    let currentSets = agentBeliefs[agent].denotation === '{}' ? [] : 
        agentBeliefs[agent].denotation.slice(2, -2).split('}, {').map(set => set.split(', ').map(s => s.trim()));

    if (!currentSets.some(set => set.join(', ') === nodeText)) {
        // Split the nodeText to ensure that each element is separated and trimmed
        let newNodeTextArray = nodeText.split(',').map(s => s.trim());
        currentSets.push(newNodeTextArray);
    }

    // Ensure that the sets are joined with ', ' for consistent formatting
    agentBeliefs[agent].denotation = `{${currentSets.map(set => `{${set.join(', ')}}`).join(', ')}}`;
    console.log(`agentBeliefs ${agent}'s denotation:`, agentBeliefs[agent].denotation);
}


const coherences = ['gc', 'lc', 'wc', 'cc', 'fc'];

document.addEventListener('DOMContentLoaded', function() {
    initializeCoherence();
});

function initializeCoherence() {
    const coherenceSelector = document.getElementById('coherenceSelector');
    coherences.forEach((coherent, index) => {
        const coherenceButton = document.createElement('button');
        // Add coherenceButton.className = 'coherence-button'; 
        coherenceButton.style.backgroundColor = colors[8 + index];
        coherenceButton.innerText = coherent;
        coherenceButton.onclick = () => coherenceGenerate(coherent);
        coherenceSelector.appendChild(coherenceButton);
    });
}







function coherenceGenerate(coherent) {

    
    Agt.forEach(agent => {
        agentBeliefs[agent] = { messages: [], denotation: '{}' };
    });
    switch (coherent) {
        case 'gc':
            agentFollowers['a'] = ['b'];
            agentFollowers['b'] = ['c', 'd'];
            agentFollowers['c'] = ['b', 'c'];
            agentFollowers['d'] = ['a', 'c'];
            agentFollowers['e'] = ['b', 'e'];
            
            agentBeliefs['a'].denotation = '{{p}, {p,r}, {p,s}}';
           
            agentBeliefs['b'].denotation = '{{q,r}, {p,r}}';
           
            agentBeliefs['c'].denotation = '{{p,r,t}, {p,r}, {p,s}}';
       
            agentBeliefs['d'].denotation = '{{s}, {p,q}, {p,r}, {p,r,t}}';
            
            agentBeliefs['e'].denotation = '{{t}, {p,r}, {p,s}, {p,q,r,s}}';
           
            drawNetwork();
            drawcoherence();
            break;

        case 'lc':
            agentFollowers['a'] = ['d', 'b', 'c'];
            agentFollowers['b'] = ['c'];
            agentFollowers['c'] = ['b', 'c'];
            agentFollowers['d'] = ['e', 'd'];
            agentFollowers['e'] = ['d', 'e'];
            
            agentBeliefs['a'].denotation = '{{p}, {p,r}, {p,s}}';
            
            agentBeliefs['b'].denotation = '{{q,r}, {p,r}}';
            
            agentBeliefs['c'].denotation = '{{p,r}, {p,r,t}, {p,s}}';
        
            agentBeliefs['d'].denotation = '{{s}, {p,q}, {p,s}, {p,r,t}}';

            agentBeliefs['e'].denotation = '{{t}, {p,s}, {p,q,r,s}}';
            
            drawNetwork();
            drawcoherence();
            break;

        case 'wc':
            agentFollowers['a'] = ['d'];
            agentFollowers['b'] = ['c'];
            agentFollowers['c'] = ['b', 'c'];
            agentFollowers['d'] = ['a', 'd'];
            agentFollowers['e'] = ['d', 'e'];
            
            agentBeliefs['a'].denotation = '{{p}}';
            
            agentBeliefs['b'].denotation = '{{q,r}, {p,r}}';
            
            agentBeliefs['c'].denotation = '{{p,r}, {p,r,t}}';
        
            agentBeliefs['d'].denotation = '{{s}}';

            agentBeliefs['e'].denotation = '{{t}}';
            
            drawNetwork();
            drawcoherence();
            break;
        case 'cc':
            agentFollowers['a'] = [];
            agentFollowers['b'] = ['c'];
            agentFollowers['c'] = ['a','b', 'c'];
            agentFollowers['d'] = ['a', 'd'];
            agentFollowers['e'] = [];
            
            agentBeliefs['a'].denotation = '{{p,r}, {s}}';
            
            agentBeliefs['b'].denotation = '{{q,r}, {p,r}}';
            
            agentBeliefs['c'].denotation = '{{p,r}, {p,r,t}}';
        
            agentBeliefs['d'].denotation = '{{p,r},{s}}';

            agentBeliefs['e'].denotation = '{}';
            
            drawNetwork();
            drawcoherence();
            break;
        case 'fc':
            agentFollowers['a'] = [];
            agentFollowers['b'] = ['c'];
            agentFollowers['c'] = ['a','b', 'c'];
            agentFollowers['d'] = ['a', 'd'];
            agentFollowers['e'] = [];
            
            agentBeliefs['a'].denotation = '{{p}, {s}}';
            
            agentBeliefs['b'].denotation = '{{q,r}, {p,r}}';
            
            agentBeliefs['c'].denotation = '{{p,r}, {p,r,t}}';
        
            agentBeliefs['d'].denotation = '{{p,r},{s}}';

            agentBeliefs['e'].denotation = '{}';
            
            drawNetwork();
            drawcoherence();
            break;
    default:
            throw new Error("Invalid or non-well-formed formula.");
    }
}



function followingChain() {
    let chains = [];

    function buildChain(agent, currentChain) {
        const followers = agentFollowers[agent];
        if (followers) {
            followers.forEach(follower => {
                if (!currentChain.includes(follower)) {
                    buildChain(follower, [...currentChain, follower]);
                }
            });
        } else {
            chains.push(currentChain);
        }
    }

    Object.keys(agentFollowers).forEach(agent => {
        buildChain(agent, [agent]);
    });

    // Remove subchains by keeping only maximal chains
    chains = chains.filter((chain, index, self) =>
        self.every((otherChain, otherIndex) => 
            otherIndex === index || !chain.every((val, i) => val === otherChain[i])
        )
    );

    console.log("chains", chains);
    return chains;
}

function checkCoherence() {
    let output = new Set();
    const chains = followingChain();
    const allAgents = Object.keys(agentBeliefs);

    function getIntersection(sets) {
        if (!sets.length) return new Set();
        return sets.reduce((acc, set) => {
            return new Set([...acc].filter(x => set.has(x)));
        });
    }

    function parseDenotation(agent) {
        return getDenotationResult2(agent).map(set => new Set(set));
    }

    function isIntersectionNotEmpty(agent) {
        const sets = parseDenotation(agent);
        return getIntersection(sets).size > 0;
    }

    function isDenotationEmpty(agent) {
        console.log("parseDenotation(agent).length", parseDenotation(agent).length);
        return parseDenotation(agent).length === 0;
    }

    let globalCondition = allAgents.every(isIntersectionNotEmpty);
    let chainCondition = chains.every(chain => chain.every(isIntersectionNotEmpty));

    if (globalCondition) {
        output.add('gc');
    }
    if (globalCondition || chainCondition) {
        output.add('lc');
    }

    let weakCoherence = false;
    let chainCoherence = false;
    let followerCoherence = false;

    

    if (Agt.every(agent => !isDenotationEmpty(agent))) {
            weakCoherence = true;
        }   

    chains.forEach(chain => {
        if (chain.some(agent => isIntersectionNotEmpty(agent)) &&
                   chain.every(agent => isDenotationEmpty(agent) || isIntersectionNotEmpty(agent))) {
            chainCoherence = true;
            followerCoherence = true;
        } else if (chain.some(agent => isIntersectionNotEmpty(agent))) {
            followerCoherence = true;
        }
    });

    if (weakCoherence) {
        output.add('wc');
    }
    if (chainCoherence) {
        output.add('cc');
    }
    if (followerCoherence) {
        output.add('fc');
    }

    if (output.size === 0) output.add('No coherence');
    document.getElementById('coherenceCheck').innerHTML = Array.from(output).join(', ').trim();
    console.log("output", Array.from(output).join(', '));
}

document.getElementById('checkCoherence').addEventListener('click', checkCoherence);

function getDenotationResult2(agent) {
    if (agentBeliefs[agent] && typeof agentBeliefs[agent].denotation === 'string') {
        const denotationCore = agentBeliefs[agent].denotation.slice(2, -2);
        console.log(`agentBeliefs${agent}.denotation`, agentBeliefs[agent].denotation);
        console.log("denotationCore", denotationCore);
        const subsets = denotationCore.split(/},\s*{/).map(subset => {
            return subset.replace('{', '').replace('}', '').split(',').map(element => element.trim()).filter(Boolean);
        });
        console.log("subsets", subsets);
        return subsets.filter(subset => subset.length > 0);
    }
    return [];
}





function isInMessageDenotation(set, messageDenotationStr) {
    // Parse the message denotation string into an array of sets
    const messageDenotation = parseSet(messageDenotationStr);

    // Convert the set to a string for comparison
    const setString = set.sort().join(', ');

    // Check if setString is included in any of the sets in messageDenotation
    return messageDenotation.some(denotationSet => setString === denotationSet.join(', '));
}


function calculateDenotation(){
    const message = document.getElementById("messageInput").value;

        if (!isWellFormedSimpleCheck(message)) {
            throw new Error("The message is not well-formed!");
        }

        const parsed = parse(tokenize(message));
        
        let result = replaceWithDenotation(parsed);
    return result;
}


// Tokenizer
function tokenize(formula) {
    return formula.match(/~|\+|&|>|[a-z]_[0-9]+|[a-z]|[\(\)]/g);
}


// Recursive parser
function parse(tokens) {
    if (tokens.length === 0) throw new Error("Unexpected end of input");

    let token = tokens.shift();
    
    if (token === '~') {
        return {
            type: 'negation',
            subformula: parse(tokens)
        };
    } else if (token === '(') {
        let left = parse(tokens);
        
        if (tokens.length === 0 || ['&', '+', '>'].indexOf(tokens[0]) === -1) {
            throw new Error("Expected an operator");
        }
        
        let operator = tokens.shift(); 
        
        let right = parse(tokens);
        
        if (tokens[0] !== ')') {
            throw new Error("Expected a closing bracket");
        }
        
        tokens.shift();  
        return {
            type: operator,
            left: left,
            right: right
        };
    } else if (Prop.includes(token)) {  // atom
        return {
            type: 'atom',
            value: token
        };
    } else {
        throw new Error(`Unexpected token: ${token}`);
    }
}


//message Check
function isWellFormedSimpleCheck(message) {
    const binaryOperators = ['&', '+', '>'];

    let operatorCount = 0;
    for (const operator of binaryOperators) {
        operatorCount += (message.match(new RegExp(`\\${operator}`, 'g')) || []).length;
    }

    const bracketPairsCount = (message.match(/\(/g) || []).length;

    return operatorCount === bracketPairsCount;
}




function replaceWithDenotation(parsedFormula) {
    if (!parsedFormula) throw new Error("Invalid or non-well-formed formula.");

    switch (parsedFormula.type) {
        case 'atom':
            return formatDenotation(atomDenotation(parsedFormula.value));
            
        case 'negation':
            return handleNegation(parsedFormula.subformula);

        case '&':
        case '+':
            return handleBinaryOperator(parsedFormula);

        case '>':
            return handleImplication(parsedFormula);

        default:
            throw new Error("Invalid or non-well-formed formula.");
    }
}

function handleNegation(subformula) {
    const innerDenotation = replaceWithDenotation(subformula);

    // If the inner denotation is the full set, the negation is the empty set.
    if (innerDenotation === formatDenotation(powerSet(Prop))) {
        return '{}';
    } else {
        // Calculate the complement set and return it formatted
        let complementSet = complementOfSet(parseSet(innerDenotation));
        return formatDenotation(complementSet);
    }
    
}

function handleBinaryOperator(parsedFormula) {
    const leftDenotation = parseSet(replaceWithDenotation(parsedFormula.left));
    const rightDenotation = parseSet(replaceWithDenotation(parsedFormula.right));

    let resultSet = parsedFormula.type === '&'
        ? setIntersection(leftDenotation, rightDenotation)
        : setUnion(leftDenotation, rightDenotation);

    return formatDenotation(resultSet);
}

function handleImplication(parsedFormula) {
    const notLeft = {
        type: 'negation',
        subformula: parsedFormula.left
    };
    const orRight = {
        type: '+',
        left: notLeft,
        right: parsedFormula.right
    };
    return replaceWithDenotation(orRight);
}



// Helper function to format a set into a denotation string
function formatDenotation(set) {
    if (set.length === 0) return '{}';
    return `{{${set.map(subset => subset.join(', ')).join('}, {')}}}`;
}

function atomDenotation(atom) {
    return powerSet(Prop).filter(subset => subset.includes(atom));
}



function parseSet(denotation) {
    if (denotation === '{}' || denotation === '') return [];
    return denotation.slice(2, -2).split('}, {')
                     .map(str => str.split(',').map(element => element.trim()).filter(Boolean));
}

function setIntersection(setA, setB) {
    function areSetsEqual(set1, set2) {
        const sortedSet1 = cleanSet(set1).sort();
        const sortedSet2 = cleanSet(set2).sort();
        return sortedSet1.length === sortedSet2.length && sortedSet1.every((element, index) => element === sortedSet2[index]);
    }

    return setA.filter(subsetA => 
        setB.some(subsetB => areSetsEqual(subsetA, subsetB))
    );
}

function setUnion(setA, setB) {
    const union = [...setA];
    for (const subset of setB) {
        if (!union.some(item => arraysAreEqual(item, subset))) {
            union.push(subset);
        }
    }
    return union;
}

function complementOfSet(set) {
    // Generate the power set of Prop
    let fullSet = powerSet(Prop);
    // Remove the elements that are in the input set from the full set
    return fullSet.filter(subset => !set.some(setSubset => 
        setSubset.length === subset.length && setSubset.every((element, index) => element === subset[index])
    ));
}
function cleanSet(set) {
    return set.map(element => element.replace(/[{}]/g, '').trim());
}

function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

function denotationToString(denotation) {
    if (denotation.length === 0) return '{}';
    return `{{${denotation.map(set => set.join(', ')).join('}, {')}}}`;
}

function stringToDenotation(denotationStr) {
    if (denotationStr === '{}' || denotationStr === '') return [];
    return denotationStr.slice(2, -2).split('}, {')
        .map(str => str.split(',').map(element => element.trim()).filter(Boolean));
}


function tokenizeFormula(formula) {
    if (typeof formula !== 'string') {
        throw new TypeError('Formula must be a string.');
    }

    const pattern = /\[[a-z]:[^[\]]+\]|B[a-z]|~|&|\+|>|\(|\)|[a-z]_[0-9]+|[a-z]|T|F/g;
    return formula.match(pattern);
}

function parseFormula(tokens) {
    if (!tokens.length) {
        throw new Error('No tokens to parse');
    }

    const token = tokens.shift(); 

    if (token === '~') {
        // Negation case
        return {
            type: 'negation',
            subformula: parseFormula(tokens)
        };
    } else if (token.startsWith('[')) {
        // Free announcement case
        const agent = token[1];
        const content = token.slice(3, -1); // Extracts (p>q) from [a:(p>q)]
        const announcement = token; // The full token [a:(p>q)]
        return {
            type: 'free announcement',
            agent: agent,
            content: content,
            announcement: announcement,
            subformula: parseFormula(tokens)
        };
    
    } else if (token.startsWith('B')) {
        const agent = token[1];
        let message = '';

        // Handle consecutive negations
        while (tokens.length > 0 && tokens[0] === '~') {
            message += tokens.shift();
        }

        // Handle complex expression or single propositional variable
        if (tokens[0] === '(') {
            // Belief with a complex expression inside parentheses
            message += tokens.shift(); // Include '('
            while (tokens.length > 0 && tokens[0] !== ')') {
                message += tokens.shift();
            }
            if (tokens[0] === ')') {
                message += tokens.shift(); // Include ')'
            }
        } else {
            // Belief with a single propositional variable (or followed by negations)
            message += tokens.shift();
        }

        return {
            type: 'belief',
            agent: agent,
            message: message
        };
    }
 else if (token === '(') {
        // Binary operation case
        const left = parseFormula(tokens); // Parse left subformula
        const operator = tokens.shift(); // Get the operator (&, +, or >)
        const right = parseFormula(tokens); // Parse right subformula

        if (tokens.shift() !== ')') {
            throw new Error('Expected closing parenthesis');
        }

        return {
            type: operator,
            left: left,
            right: right
        };
    } else {
        throw new Error('Unexpected token: ' + token);
    }
}

function parseAnnouncement(announcementString) {
    if (typeof announcementString !== 'string' || announcementString.trim() === '') {
        throw new Error('Announcement must be a non-empty string');
    }

    // Tokenize the announcement string
    const tokens = tokenizeFormula(announcementString);

    if (!tokens.length) {
        throw new Error('No tokens to parse');
    }

    // Extract the first token, which should be the announcement
    const token = tokens.shift();

    // Assuming the token is a well-formed announcement
    const agent = token[1];
    const content = token.slice(3, -1); // Extracts the content (e.g., 'p>q' from '[a:(p>q)]')
    const announcement = token; // The full token (e.g., '[a:(p>q)]')

    return {
        agent: agent,
        content: content,
        announcement: announcement
    };
}

function updatedmodels(announcement) {

    

    const parsedAnnouncement = parseAnnouncement(announcement);

    const announcementAgent = parsedAnnouncement.agent;
    const announcementProposition = parsedAnnouncement.content;
    const announcementDenotation = replaceWithDenotation(parse(tokenize(announcementProposition)));
 
    const announcementWorlds = stringToDenotation(announcementDenotation);
    

    for (let agt of agentFollowers[announcementAgent]) { 
     

   
        let agentBeliefWorlds = stringToDenotation(agentBeliefs[agt].denotation);
   

        agentBeliefWorlds = setIntersection(agentBeliefWorlds, announcementWorlds);
      

        agentBeliefs[agt].denotation = denotationToString(agentBeliefWorlds);
    }
    

}


function extractLiterals(formula) {
    let literals = formula.match(/B[a-z](~+)?\([^)]+\)|B[a-z](~+)?[a-z]/g) || [];
    return literals;
}


function isSubsetOf(subsetWorlds, supersetWorlds) {
    // Convert the arrays of worlds to strings for easier comparison
    const supersetStrings = supersetWorlds.map(set => JSON.stringify(set.sort()));
    const subsetStrings = subsetWorlds.map(set => JSON.stringify(set.sort()));

    // Check if every world in subsetWorlds is included in supersetWorlds
    return subsetStrings.every(subset => supersetStrings.includes(subset));
}


function evaluateLiteral(message, agent) {
    //console.log("agent:", agent);
    //console.log("message:", message);
    

    // Assuming replaceWithDenotation returns a set of worlds where the message is true.
    const parsedMessage = parse(tokenize(message));
   

    const messageDenotation = replaceWithDenotation(parsedMessage);
    

    // Convert the denotation string into a set of worlds.
    let messageWorlds = parseSet(messageDenotation);
  
    // Start with the agent's belief worlds.
    let agentBeliefWorlds = parseSet(agentBeliefs[agent].denotation);
   
     
    // Check if the proposition is true in all of the agent's belief worlds.
    const result = isSubsetOf(agentBeliefWorlds, messageWorlds);
   
    return result;
}

  

function evaluateFormula(formula) {

    switch (formula.type) {
        case 'belief':
            // Pass the message part of the belief formula to evaluateLiteral
            return evaluateLiteral(formula.message, formula.agent);
        case 'negation':
            return !evaluateFormula(formula.subformula);
        case '&':
            return evaluateFormula(formula.left) && evaluateFormula(formula.right);
        case '+':
            return evaluateFormula(formula.left) || evaluateFormula(formula.right);
        case '>':
            return !evaluateFormula(formula.left) || evaluateFormula(formula.right);

        case 'free announcement':
                    //console.log("Evaluating free announcement:", formula.announcement);
        
                    // Temporarily store the current belief states
                    const originalBeliefs = JSON.parse(JSON.stringify(agentBeliefs));
        
                    // Update models based on the announcement
                    updatedmodels(formula.announcement);
        
                    // Evaluate the subformula in the context of the updated models
                    const result = evaluateFormula(formula.subformula);
        
                    // Restore the original belief states
                    agentBeliefs = originalBeliefs;
        
                    return result;

    }
}



function satisfiability() {
    const formulaInput = document.getElementById("formulaInput").value.trim();
    console.log("formula:", formulaInput);
    
    const parsedFormula = parseFormula(tokenizeFormula(formulaInput));
    console.log("parsedFormula:", parsedFormula);
    
    const satResult = evaluateFormula(parsedFormula, []);
    
    document.getElementById("satisfaction").innerText = satResult ? "Satisfied" : "Unsatisfied";
}