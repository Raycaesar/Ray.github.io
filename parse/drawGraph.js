
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
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1.5");
    
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