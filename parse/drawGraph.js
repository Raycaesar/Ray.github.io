function drawNetwork() {
    const svg = d3.select("#networkCanvas");
    svg.selectAll("*").remove();

    // Define arrowheads
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
    for (let agent in agentFollowers) {
        for (let follower of agentFollowers[agent]) {
            links.push({ source: follower, target: agent });
        }
    }
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    const nodeRadius = 20;

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(150))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide(30)) 
        .force("radial", d3.forceRadial(width / 2.5, width / 2, height / 2));
    simulation.alphaDecay(0.05);

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.7).restart(); // Increase alpha target for more immediate response
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
        .attr("marker-end", d => d.source.id !== d.target.id ? "url(#end)" : null) // Check if the link is reflexive
        .style("stroke", "#999")
        .attr("fill", "none");
    

    const node = svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("fill", d => agentColors[d.id])
        .call(drag);

    const nodeText = svg.append("g").selectAll("text")
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
            const dr = 20;  // Increased arc size a bit
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

        // For text, adding an offset to ensure it doesn't sit exactly on the node's edge.
        nodeText.attr("x", d => constrainPosition(d.x, width, 0))
                .attr("y", d => constrainPosition(d.y, height, 4));  // Offset added here
    });
}

const social = document.getElementById('networkCanvas');


function downloadsocial() {
    const svgData = new XMLSerializer().serializeToString(social);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "socialgraph.svg";
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
}





const svg = document.getElementById('beliefCanvas');


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


function getDenotationResult(agent) {
    if (agentBeliefs[agent] && typeof agentBeliefs[agent].denotation === 'string') {
        // Split the string denotation into subsets
        const subsets = agentBeliefs[agent].denotation.slice(2, -2).split('}, {');
        return subsets.map(subset => subset.split(', ').filter(Boolean));
    }
    return [];
}


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












/*


document.getElementById("drawGraph").addEventListener("click", function() {
    const selectedAgent = document.getElementById("beliefAgent").value;
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
            const denotationResult = getDenotationResult(selectedAgent);
            console.log("Denotation for agent 'a':", denotationResult);
            
            subsetsOfSizeI.forEach((subset, j) => {
                const subsetStr = subset.sort().join(',');  // Sort and then join for consistent representation
                console.log("Subset:", subsetStr);
            
                // Check if subset is in the denotation
                const isSubsetInDenotation = denotationResult.some(denotedSubset => 
                    denotedSubset.length === subset.length && 
                    denotedSubset.every(element => subset.includes(element))
                );
                console.log(`Comparison for ${subsetStr}:`, isSubsetInDenotation);
            
                // Adjust yOffset to reverse the diagram
                const yOffset = (Prop.length - i + 1) * verticalGap;
            
                const horizontalGap = svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1);
                const xOffset = (j + 1) * horizontalGap;
                createCircle(xOffset, yOffset, subsetStr, svgContainer, circleRadius, isSubsetInDenotation, selectedAgent);
            });
        }
    }
            

    
    
    function createCircle(x, y, label, svgContainer, radius, isInDenotation, agent) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1.5");
        circle.setAttribute("fill", isInDenotation ? agentColors[agent] : "white");
        console.log("isInDenotation for", label, ":", isInDenotation);

        svgContainer.appendChild(circle);
        
        // Adding label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dy", "0.3em"); // small offset to center the text vertically in the circle
        text.textContent = label;
        svgContainer.appendChild(text);
    }
    
    

  
});

*/