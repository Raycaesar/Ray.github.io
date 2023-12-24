const agentFollowers = {};
let agentBeliefs = {};
let Agt = [];  // This makes it global

document.addEventListener('DOMContentLoaded', function() {
    // Call setAgentSize or other initialization functions here
    setAgentSize();
});

const agentColors = {}; // We use in graph Drawing
let colorCounter = 0;
const colors = ['#D67293', ' #73DEFA', '#5DB117', '#5A8CD7', '#CCCC00', '#9A5FD7', '#FA1CA8', '#A300A3', '#00A3A3']; // An array of colors for agents
// Set Agent Size and Update Dropdowns
function setAgentSize() {
    const size = parseInt(document.getElementById("agentSize").value);
    Agt = Array.from({length: size}, (_, i) => i < 4 ? ['a', 'b', 'c', 'd'][i] : `a_${i + 1}`);

    Agt.forEach((agent, index) => {
        agentColors[agent] = colors[index % colors.length];
    });
    
    updateDropdown("selectedAgent");
    updateDropdown("agentFollowers");
    
}


// Helper function to update dropdowns
function updateDropdown(elementId) {
    let dropdown = document.getElementById(elementId);
    dropdown.innerHTML = '';

    for (let agent of Agt) {
        let option = document.createElement('option');
        option.value = agent;
        option.text = agent;
        dropdown.appendChild(option);
    }
}

// Set Agent Followers
function setAgentFollowers() {
    let selectedAgent = document.getElementById("selectedAgent").value;
    let followerOptions = document.getElementById("agentFollowers").options;
    let selectedFollowers = Array.from(followerOptions).filter(opt => opt.selected).map(opt => opt.value);

    // Ensure agentFollowers[selectedAgent] is an array
    agentFollowers[selectedAgent] = agentFollowers[selectedAgent] || [];
    agentFollowers[selectedAgent] = selectedFollowers;
    displayFollowers();
    console.log("a's followers", agentFollowers['a'])
}


// Display Followers
function displayFollowers() {
    let outputfollower = '';
    for (let agent in agentFollowers) {
        outputfollower += `f(${agent}) = {${agentFollowers[agent].join(', ')}}\n`;
    }
    document.getElementById("followerOutput").innerText = outputfollower;
}

// Declare Prop as a global variable
let Prop = [];

// Other existing global variables
const baseExplicitProp = ['p', 'q', 'r', 's', 't'];
let explicitProp = []; // This was already in your code
const implicitProp = ['w', 'x', 'y'];
const augmentProp = ['z'];

function propSize() {
    let size = parseInt(document.getElementById("propSize").value);

    // Validate and adjust the size to be within the allowed range (3 to 5)
    size = Math.max(3, Math.min(size, 5));

    // Modify the global explicitProp array
    explicitProp.length = 0; // Clear the array
    explicitProp.push(...baseExplicitProp.slice(0, size)); // Push the new elements

    // Display the sets
    document.getElementById("explicitPropOutput").innerText = `Explicit Prop = {${explicitProp.join(', ')}}`;
    document.getElementById("implicitPropOutput").innerText = `Implicit Prop = {${implicitProp.join(', ')}}`;
    document.getElementById("augmentPropOutput").innerText = `Augment = {${augmentProp.join(', ')}}`;
}

// Modified drawBackground function to update the global Prop variable
function drawBackground() {
    // Update the global Prop variable with the union of explicitProp and implicitProp
    Prop = [...explicitProp, ...implicitProp];
    console.log("Prop:", Prop);

    // Since displayPowerSet uses the global Prop variable, it can now be called without passing Prop
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


 // This function is responsible for visualizing the power set of propositions on an SVG canvas.
 function displayBackground() {
    console.log("Displaying power set...");
    const powerSetOfProp = powerSet(Prop); // Generate the power set of the propositions.
    console.log("Displaying power set of Prop:", powerSetOfProp);
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


        // Create circles for each subset with the corresponding beliefs.
        subsetsOfSizeI.forEach((subset, j) => {
            const subsetStr = subset.sort().join(',');
            const yOffset = (Prop.length - i + 1) * verticalGap;
            const horizontalGap = svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1);
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
            console.log("selectedAgents:", selectedAgents);
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
    console.log(`Agent '${agent}'s belief:`, agentBeliefs[agent].denotation);
}







document.getElementById("ExpandGraph").addEventListener("click", function() {
    //console.log("Initial agentBeliefs:", JSON.stringify(agentBeliefs, null, 2));
    //console.log("Initial subsets:", powerSet(Prop).map(subset => subset.join(",")));
    expandGraph();     // Expand Prop
    displayPowerSet(); 
    //console.log("Expanded Prop:", Prop);
//console.log("Expanded subsets:", powerSet(Prop).map(subset => subset.join(",")));
});



function expandGraph() {
    // Combine Prop with augmentProp
    Prop = [...new Set([...Prop, ...augmentProp])];
    console.log("Expanding graph with new Prop set:", Prop); // Log the new Prop set
    //displayPowerSet(); // Redraw the diagram with the updated Prop
}


document.getElementById("dispel").addEventListener("click", function() {
    for (let agent in agentBeliefs) {
        if (agentBeliefs.hasOwnProperty(agent)) {
            const denotationSets = agentBeliefs[agent].denotation.slice(2, -2).split('}, {').map(set => set.split(', '));

            for (let i = 0; i < denotationSets.length; i++) {
                denotationSets[i] = denotationSets[i].map(element => {
                    if (element === 'w') return 'x';
                    if (element === 'x') return 'y';
                    if (element === 'y') return 'z';
                    return element;
                });
            }

            agentBeliefs[agent].denotation = `{${denotationSets.map(set => `{${set.join(', ')}}`).join(', ')}}`;
            console.log(`Agent ${agent} beliefs: ${agentBeliefs[agent].denotation}`);
        }
    }

    displayPowerSet();
});

function preservation() {
    const inputMessage = document.getElementById('messageInput').value;
    const messageDenotation = calculateDenotation(inputMessage); // Your function to calculate denotation

    for (let agent in agentBeliefs) {
        if (agentBeliefs.hasOwnProperty(agent)) {
            const denotationSets = agentBeliefs[agent].denotation.slice(2, -2).split('}, {').map(set => set.split(', '));

            for (let i = 0; i < denotationSets.length; i++) {
                if (isInMessageDenotation(denotationSets[i], messageDenotation)) {
                    if (!denotationSets[i].includes('w')) {
                        denotationSets[i].push('w');
                    }
                }
            }

            agentBeliefs[agent].denotation = `{${denotationSets.map(set => `{${set.join(', ')}}`).join(', ')}}`;
            console.log(`Agent ${agent} beliefs: ${agentBeliefs[agent].denotation}`);
        }
    }
    displayPowerSet(); 
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
    console.log("agent:", agent);
    console.log("message:", message);
    

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
                    console.log("Evaluating free announcement:", formula.announcement);
        
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