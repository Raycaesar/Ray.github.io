function drawNetwork() {
    const svg = d3.select("#networkCanvas"); // Select the SVG element with the id 'networkCanvas'.
    svg.selectAll("*").remove(); // Remove all child elements of the SVG to reset the canvas.

    // Define arrowheads for the links in the network
    svg.append("defs").selectAll("marker") // Append 'defs' for definitions and select all 'marker' elements.
        .data(["end"]) // Bind data to the markers, in this case a single item array ['end'].
        .enter().append("marker") // Enter the data join and append a 'marker' element for each data item.
        .attr("id", String) // Set the 'id' attribute of the marker to the string representation of the data item.
        .attr("viewBox", "0 -5 10 10") // Define the coordinate system for the marker.
        .attr("refX", 30) // Set the x-coordinate for the reference point of the marker.
        .attr("refY", 0) // Set the y-coordinate for the reference point of the marker.
        .attr("markerWidth", 10) // Define the width of the marker.
        .attr("markerHeight", 30) // Define the height of the marker.
        .attr("orient", "auto") // Set the orientation of the marker to be automatic.
        .append("path") // Append a 'path' element to the marker to define its shape.
        .attr("d", "M0,-5L10,0L0,5") // Define the path data for an arrow shape.
        .style("fill", "#999"); // Set the fill color of the arrow.

    // Create nodes and links for the network
    const nodes = Agt.map(agent => ({ id: agent })); // Map each 'agent' to an object with an 'id' property.
    const links = []; // Initialize an array to hold the links between nodes.
    for (let agent in agentFollowers) { // Iterate over the 'agentFollowers' object.
        for (let follower of agentFollowers[agent]) { // Iterate over each follower of the agent.
            links.push({ source: follower, target: agent }); // Create a link from the follower to the agent.
        }
    }

    // Set up the dimensions for the simulation
    const width = svg.node().getBoundingClientRect().width; // Get the width of the SVG element.
    const height = svg.node().getBoundingClientRect().height; // Get the height of the SVG element.
    const nodeRadius = 20; // Define the radius for the nodes.

    // Define the force simulation for the nodes and links
    const simulation = d3.forceSimulation(nodes) // Create a new force simulation with the nodes.
        .force("link", d3.forceLink(links).id(d => d.id).distance(150)) // Add a link force with the links array and set the id accessor and distance.
        .force("charge", d3.forceManyBody().strength(-500)) // Add a charge force to repel nodes from each other.
        .force("center", d3.forceCenter(width / 2, height / 2)) // Add a centering force to center the nodes in the SVG.
        .force("collide", d3.forceCollide(30)) // Add a collision force to prevent nodes from overlapping.
        .force("radial", d3.forceRadial(width / 2.5, width / 2, height / 2)); // Add a radial force to position nodes in a radial layout.
    simulation.alphaDecay(0.05); // Set the alpha decay rate, which controls the cooling of the simulation.

    // Define drag behaviors for the nodes
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.7).restart(); // If the drag event is not active, increase the simulation's alpha target to restart it.
        d.fx = d.x; // Fix the node's position in x.
        d.fy = d.y; // Fix the node's position in y.
    }

    function dragged(event, d) {
        d.fx = event.x; // Update the node's fixed position in x to the current event's x position.
        d.fy = event.y; // Update the node's fixed position in y to the current event's y position.
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0); // If the drag event is not active, set the alpha target back to 0.
        d.fx = null; // Unfix the node's position in x.
        d.fy = null; // Unfix the node's position in y.
    }

    const drag = d3.drag() // Create a new drag behavior.
        .on("start", dragstarted) // Assign the 'dragstarted' function to the 'start' event.
        .on("drag", dragged) // Assign the 'dragged' function to the 'drag' event.
        .on("end", dragended); // Assign the 'dragended' function to the 'end' event.

    // Create and style the links (paths) between nodes
    const link = svg.append("g") // Append a 'g' element to group the links.
        .selectAll("path") // Select all 'path' elements within the group.
        .data(links) // Bind the links data to the 'path' elements.
        .enter().append("path") // Enter the data join and append a 'path' element for each link.
        .attr("marker-end", d => d.source.id !== d.target.id ? "url(#end)" : null) // Set the 'marker-end' attribute to the defined arrowhead unless the source and target are the same.
        .style("stroke", "#999") // Set the stroke color of the path.
        .attr("fill", "none"); // Ensure the path has no fill color.

    // Create and style the nodes (circles)
    const node = svg.append("g") // Append a 'g' element to group the nodes.
        .selectAll("circle") // Select all 'circle' elements within the group.
        .data(nodes) // Bind the nodes data to the 'circle' elements.
        .enter().append("circle") // Enter the data join and append a 'circle' element for each node.
        .attr("r", 20) // Set the radius of the circle.
        .attr("fill", d => agentColors[d.id]) // Set the fill color of the circle based on the 'agentColors' mapping.
        .call(drag); // Apply the drag behavior to the circles.



// This block of code is responsible for creating and styling the text labels for each node in the network graph.
const nodeText = svg.append("g") // Append a 'g' element to group the text elements.
    .selectAll("text") // Select all 'text' elements within the group.
    .data(nodes) // Bind the nodes data to the 'text' elements.
    .enter().append("text") // Enter the data join and append a 'text' element for each node.
    .attr("font-size", 14) // Set the font size of the text.
    .attr("fill", "#dcf5f4") // Set the fill color of the text.
    .attr("font-family", "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif") // Set the font family of the text.
    .attr("text-anchor", "middle") // Set the text-anchor attribute to 'middle' to center the text.
    .attr("dy", ".35em") // Adjust the y-position of the text slightly for better alignment.
    .text(d => d.id) // Set the text content to the 'id' of the node.
    .call(drag); // Apply the drag behavior to the text elements.

// This function defines the path for the links between nodes, creating an arc for self-links.
function linkArc(d) {
    if (d.source.id === d.target.id) { // Check if the link is a self-link.
        const dr = 20; // Define the arc radius.
        // Return the SVG path data for a self-link (loop).
        return `M${d.source.x},${d.source.y - nodeRadius}A${dr},${dr} 0 1,0 ${d.source.x},${d.source.y - (1.5 * nodeRadius)}Z`;
    } else {
        // Return the SVG path data for a straight line link.
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
    }
}

// This function ensures that node positions are constrained within the bounds of the SVG canvas.
function constrainPosition(val, max, radius) {
    return Math.max(radius, Math.min(max - radius, val)); // Constrain the value between the radius and the maximum minus the radius.
}

// This 'tick' function is called for every update of the force simulation.
simulation.on("tick", () => {
    link.attr("d", linkArc); // Update the 'd' attribute of the links with the new path data.

    // Update the position of the nodes, ensuring they are within the bounds of the SVG.
    node.attr("cx", d => constrainPosition(d.x, width, nodeRadius))
        .attr("cy", d => constrainPosition(d.y, height, nodeRadius));

    // Update the position of the text labels, with a slight offset for y-position.
    nodeText.attr("x", d => constrainPosition(d.x, width, 0))
            .attr("y", d => constrainPosition(d.y, height, 4)); // Offset added here for y-position.
});

}
// The following functions are for downloading the SVG content as files.
const social = document.getElementById('networkCanvas'); // Select the SVG element for the social network.

function downloadsocial() {
    const svgData = new XMLSerializer().serializeToString(social); // Serialize the SVG to a string.
    const blob = new Blob([svgData], { type: "image/svg+xml" }); // Create a new Blob object with the SVG data.
    const url = URL.createObjectURL(blob); // Create a URL for the Blob object.

    const a = document.createElement("a"); // Create a new 'a' element.
    a.href = url; // Set the href of the 'a' element to the Blob URL.
    a.download = "socialgraph.svg"; // Set the download attribute to the desired file name.
    a.click(); // Programmatically click the 'a' element to trigger the download.

    URL.revokeObjectURL(url); // Cleanup by revoking the Blob URL.
}
function downloadSVG() {
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "beliefgraph.svg";
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
}


const svg = document.getElementById('beliefCanvas'); // Select the SVG element for the belief network.


    
function getDenotationResult(agent) {
    if (agentBeliefs[agent] && typeof agentBeliefs[agent].denotation === 'string') {
        // Check if the agent has beliefs and the denotation is a string.
        const subsets = agentBeliefs[agent].denotation.slice(2, -2).split('}, {'); // Split the string into subsets.
        return subsets.map(subset => subset.split(', ').filter(Boolean)); // Split each subset into individual elements and filter out any empty strings.
    }
    return []; // If the conditions are not met, return an empty array.
}

document.getElementById('propSize').addEventListener('change', function() {
    var size = parseInt(this.value, 10); // Make sure to parse the input value as an integer
    var svgContainer = document.getElementById('cy');
    var svgCanvas = document.getElementById('beliefCanvas');

    // Base width and height
    var baseWidth = 3600;
    var baseHeight = 800;

    if (size >= 7) {
        // Calculate new width as per the given formula
        var newWidth = baseWidth * Math.pow(1.5, size - 7);
        var newHeight = baseHeight * Math.pow(1.5, size - 7);
        // Set the new width and keep the height constant
        svgContainer.style.width = newWidth + 'px';
        svgContainer.style.height = newHeight + 'px';

        // Adjust the SVG canvas size as well
        svgCanvas.setAttribute('width', newWidth);
        svgCanvas.setAttribute('height', newHeight);
    } else {
        // Reset to default size
        svgContainer.style.width = '1800px';
        svgContainer.style.height = '800px';

        // Reset the SVG canvas size as well
        svgCanvas.setAttribute('width', '1800');
        svgCanvas.setAttribute('height', '800');
    }
});




// This code snippet is an event listener attached to an HTML element with the id "drawGraph".
// When the element is clicked, it triggers the displayPowerSet function to visualize a power set.
document.getElementById("drawGraph").addEventListener("click", function() {
    displayPowerSet(); // Call the function to display the power set.

    // This function is responsible for visualizing the power set of propositions on an SVG canvas.
    function displayPowerSet() {
        const powerSetOfProp = powerSet(Prop); // Generate the power set of the propositions.
        const svgContainer = document.getElementById("beliefCanvas"); // Select the SVG container element.
        svgContainer.innerHTML = '';  // Clear any previous content in the SVG container.

        // Sort the subsets by size to organize them visually.
        powerSetOfProp.sort((a, b) => a.length - b.length);

        // Determine the maximum width and height for the layout of the subsets.
        const maxWidth = powerSetOfProp.length;
        const maxHeight = Prop.length + 1;

        // Calculate the vertical gap between the levels of subsets.
        const verticalGap = svgContainer.height.baseVal.value / (maxHeight + 1);
        const circleRadius = 30; // Define the radius for the circles representing subsets.
        
        // Loop through each level of subset based on size.
        for (let i = 0; i <= Prop.length; i++) {
            // Filter subsets of size i.
            const subsetsOfSizeI = powerSetOfProp.filter(subset => subset.length === i);
            let beliefsForSubset = {};

            // Calculate which agents believe in each subset.
            Agt.forEach(agent => {
                const denotationResult = getDenotationResult(agent);
                subsetsOfSizeI.forEach(subset => {
                    const subsetStr = subset.sort().join(',');
                    const isSubsetInDenotation = denotationResult.some(denotedSubset => 
                        denotedSubset.length === subset.length && 
                        denotedSubset.every(element => subset.includes(element))
                    );
                    if (isSubsetInDenotation) {
                        if (!beliefsForSubset[subsetStr]) beliefsForSubset[subsetStr] = [];
                        if (!beliefsForSubset[subsetStr].includes(agent)) { // Avoid double counting agents.
                            beliefsForSubset[subsetStr].push(agent);
                        }
                    }
                });
            });

            // Create circles for each subset with the corresponding beliefs.
            subsetsOfSizeI.forEach((subset, j) => {
                const subsetStr = subset.sort().join(',');
                const yOffset = (Prop.length - i + 1) * verticalGap;
                const horizontalGap = svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1);
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
    
        // Determine the fill color based on the believing agents.
        let fillColor = "white"; // Default to white (no belief).
         // Add a class to the circle for identification
         circle.classList.add("belief-node");
    
         // Add an event listener to the circle
         circle.addEventListener("click", function(event) {
             handleNodeClick(event, label);
         });

        if (agentsWithBeliefs.length === 1) {
            // If there is exactly one believing agent with non-empty denotation.
            const agent = agentsWithBeliefs[0];
            fillColor = agentColors[agent];
        } else if (agentsWithBeliefs.length > 1) {
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
    
    
    

    function makeDraggable(svg) {
        let selectedElements = [];
        let offset;
        let isCtrlPressed = false;
    
        function startDrag(evt) {
            if (evt.target.classList.contains('draggable')) {
                if (evt.ctrlKey && !selectedElements.includes(evt.target)) {
                    selectedElements.push(evt.target);
                } else if (!evt.ctrlKey) {
                    selectedElements = [evt.target];
                }
                selectedElements.forEach(element => {
                    element.classList.add('selected'); // Add class for highlighting
                });
                offset = getMousePosition(evt);
                offset.x -= parseFloat(evt.target.getAttributeNS(null, "x"));
                offset.y -= parseFloat(evt.target.getAttributeNS(null, "y"));
                isCtrlPressed = evt.ctrlKey;
            }
        }
    
        function drag(evt) {
            if (selectedElements.length > 0) {
                evt.preventDefault();
                const coord = getMousePosition(evt);
                selectedElements.forEach(element => {
                    element.setAttributeNS(null, "x", coord.x - offset.x);
                    element.setAttributeNS(null, "y", coord.y - offset.y);
                });
            }
        }
    
        function endDrag(evt) {
            selectedElements.forEach(element => {
                element.classList.remove('selected'); // Remove class for highlighting
            });
            selectedElements = [];
            isCtrlPressed = false;
        }
    
        function getMousePosition(evt) {
            const CTM = svg.getScreenCTM();
            return {
                x: (evt.clientX - CTM.e) / CTM.a,
                y: (evt.clientY - CTM.f) / CTM.d
            };
        }
    
        svg.addEventListener('mousedown', startDrag);
        svg.addEventListener('mousemove', drag);
        svg.addEventListener('mouseup', endDrag);
        svg.addEventListener('mouseleave', endDrag);
    
        // Optional: Add event listener for Ctrl key press and release
        window.addEventListener('keydown', function(evt) {
            if (evt.key === 'Control') {
                isCtrlPressed = true;
            }
        });
        window.addEventListener('keyup', function(evt) {
            if (evt.key === 'Control') {
                isCtrlPressed = false;
                endDrag(evt); // Deselect all when Ctrl is released
            }
        });
    }
    
    // Call this function after the SVG is loaded
    makeDraggable(document.getElementById('beliefCanvas'));
    
    
    
    
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
});


/*

document.getElementById("drawGraph").addEventListener("click", function() {
    displayPowerSet();

    function displayPowerSet() {
        const powerSetOfProp = powerSet(Prop);
        const svgContainer = document.getElementById("beliefCanvas");
        svgContainer.innerHTML = '';  // Clear previous diagram
    
    
        powerSetOfProp.sort((a, b) => a.length - b.length);  // Sort subsets by size
    
        const maxWidth = powerSetOfProp.length;
        const maxHeight = Prop.length + 1; 
    
        const verticalGap = svgContainer.height.baseVal.value / (maxHeight + 1);
        const circleRadius = 30;
        
        for (let i = 0; i <= Prop.length; i++) {
            const subsetsOfSizeI = powerSetOfProp.filter(subset => subset.length === i);
            let beliefsForSubset = {};

            // Calculate which agents believe in each subset
           // Calculate which agents believe in each subset
        Agt.forEach(agent => {
            const denotationResult = getDenotationResult(agent);
            subsetsOfSizeI.forEach(subset => {
        const subsetStr = subset.sort().join(',');
        const isSubsetInDenotation = denotationResult.some(denotedSubset => 
            denotedSubset.length === subset.length && 
            denotedSubset.every(element => subset.includes(element))
        );
        if (isSubsetInDenotation) {
            if (!beliefsForSubset[subsetStr]) beliefsForSubset[subsetStr] = [];
            if (!beliefsForSubset[subsetStr].includes(agent)) { // make sure we don't double count agents
                beliefsForSubset[subsetStr].push(agent);
            }
        }
    });
});


            // Now create the circle with the beliefs of all agents
            subsetsOfSizeI.forEach((subset, j) => {
                const subsetStr = subset.sort().join(',');
                const yOffset = (Prop.length - i + 1) * verticalGap;
                const horizontalGap = svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1);
                const xOffset = (j + 1) * horizontalGap;
                createCircle(xOffset, yOffset, subsetStr, svgContainer, circleRadius, beliefsForSubset[subsetStr] || []);
            });
        }
    }
    
    function createCircle(x, y, label, svgContainer, radius, believingAgents) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("stroke", "#686673");
        circle.setAttribute("stroke-width", "0.5");
    
        if (believingAgents.length === 0) {
            circle.setAttribute("fill", "white");
        } else if (believingAgents.length === 1) {
            circle.setAttribute("fill", agentColors[believingAgents[0]]);
        } else {
            circle.setAttribute("fill", "none"); // Make sure the circle is transparent
    
            // Create arcs for multiple agents' beliefs
            let startAngle = 0;
            believingAgents.forEach(agent => {
                const endAngle = startAngle + (360 / believingAgents.length);
                createArc(svgContainer, x, y, startAngle, endAngle, radius, agentColors[agent]);
                startAngle = endAngle;
            });
        }
    
        // Adding label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "0.3em");
        text.setAttribute("fill", "#40120a")
        text.setAttribute("font-family", "Franklin Gothic Medium, Arial Narrow, Arial, sans-serif")
        text.textContent = label;
    
        svgContainer.appendChild(circle); // Ensure the circle is appended too
        svgContainer.appendChild(text);
    }
    
    

    function createArc(svgContainer, cx, cy, startAngle, endAngle, radius, fillColor) {
        const start = polarToCartesian(cx, cy, radius, endAngle);
        const end = polarToCartesian(cx, cy, radius, startAngle);
    
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
        const d = [
            "M", start.x, start.y, 
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            "L", cx, cy,
            "Z"
        ].join(" ");
    
        const arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arc.setAttribute("d", d);
        arc.setAttribute("fill", fillColor);
        svgContainer.appendChild(arc);
    }
    

    function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }
});



*/






