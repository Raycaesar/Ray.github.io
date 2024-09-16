// ===============================================
// =============== AGENT FUNCTIONS ===============
// ===============================================
const agentFollowers = {};
let agentBeliefs = {};
let Agt = [];  // This makes it global


const agentColors = {}; // We use in graph Drawing
let colorCounter = 0;
const colors = ['#D67293', ' #73DEFA', '#5DB117', '#5A8CD7', '#CCCC00', '#9A5FD7', '#FA1CA8', '#A300A3', '#00A3A3']; // An array of colors for agents


// Set Agent Size and Update Dropdowns
function setAgentSize() {
    const size = parseInt(document.getElementById("agentSize").value);
    Agt = Array.from({length: size}, (_, i) => i < 10 ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'][i] : `a_${i + 1}`);

    Agt.forEach((agent, index) => {
        agentColors[agent] = colors[index % colors.length];
    });

      if (window.effect) {
        window.effect.setNumberOfParticles(Agt);
        window.effect.resetParticles();
    } else {
        console.error("Effect object is not initialized");
    }
    
    updateDropdown("selectedAgent");
    updateDropdown("agentFollowers");
    updateDropdown("beliefAgent");
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
    //console.log("a's followers", agentFollowers['a'])
}


function drawNetworkdy() {
    if (window.effect) {
        window.effect.drawNetwork(agentFollowers);
    } else {
        console.error("Effect object is not initialized");
    }
}

// Display Followers
function displayFollowers() {
    let outputfollower = '';
    for (let agent in agentFollowers) {
        outputfollower += `f(${agent}) = {${agentFollowers[agent].join(', ')}}\n`;
    }
    document.getElementById("followerOutput").innerText = outputfollower;
}

// ================================================
// =============== PROP FUNCTIONS =================
// ================================================

function setPropSize() {
    const baseProp = ['p', 'q', 'r', 's', 't'];
    const size = parseInt(document.getElementById("propSize").value);
    
    if (size <= baseProp.length) {
        Prop = baseProp.slice(0, size);
    } else {
        const additionalProps = Array.from({ length: size - baseProp.length }, (_, i) => `p_${i + 2}`);
        Prop = [...baseProp, ...additionalProps];
    }
    const numRows = Prop.length < 4 ? 2 : 4;
    const numCols = 4;
    matrix = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    //console.log("matrix", matrix);

    document.getElementById("propOutput").innerText = `Prop = {${Prop.join(', ')}}`;
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
    } else if (Prop.includes(token)) {  // Check if token is a valid propositional variable
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



// ===============================================
// ============== Denotation Compute==============
// ===============================================


//We obtain denotation by substiting messages from atomic with sets.

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
    //console.log("innerDenotation:", innerDenotation);

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


// Display Denotation
function displayDenotation() {
    try {
        const message = document.getElementById("messageInput").value;

        if (!isWellFormedSimpleCheck(message)) {
            throw new Error("The message is not well-formed!");
        }

        const parsed = parse(tokenize(message));
        
        let result = replaceWithDenotation(parsed);
       
        document.getElementById("resultOutput").innerText = result;
    } catch (error) {
        alert(error.message);
    }
}

// ===============================================
// =============== BELIEF FUNCTIONS ==============
// ===============================================

function assignBelief() {
    try {
        const message = document.getElementById("beliefmessage").value;

        if (!isWellFormedSimpleCheck(message)) {
            throw new Error("The message is not well-formed!");
        }

        const selectedAgent = document.getElementById("beliefAgent").value;
        //console.log("selectedAgent", selectedAgent)
        const parsed = parse(tokenize(message));
        //console.log("parsedmessage", parsed)
        const denotationResult = replaceWithDenotation(parsed);
        //console.log("denotationResult", denotationResult)


        // Check if the agent already has beliefs
        if (agentBeliefs[selectedAgent]) {
            // Append new message to the beliefs
            agentBeliefs[selectedAgent].messages.push(message);
            
            // If the new denotation is an empty set, it should remain as an empty set after intersection
            if (denotationResult === '{}') {
                agentBeliefs[selectedAgent].denotation = '{}';
            } else {
                // Intersect the new denotation with the previous one
                let oldDenotation = agentBeliefs[selectedAgent].denotation === '{}' ? [] : 
                    agentBeliefs[selectedAgent].denotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                let newDenotation = denotationResult.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                let intersection = setIntersection(oldDenotation, newDenotation);

                // Update the denotation to the intersection result
                agentBeliefs[selectedAgent].denotation = intersection.length === 0 ? '{}' : 
                    `{{${intersection.map(set => set.join(', ')).join('}, {')}}}`;
            }
        } else {
            // If no prior beliefs, initialize with the current one
            agentBeliefs[selectedAgent] = {
                messages: [message],
                denotation: denotationResult
            };
        }
        //console.log("agent a's belief:", agentBeliefs['a'].denotation);
        //console.log("agent b's belief:", agentBeliefs['b'].denotation);
        //console.log("agent c's belief:", agentBeliefs['c'].denotation);
        // Update the displayed beliefs for all agents
        displayAgentBeliefs();
        calculateStrong();
    } catch (error) {
        alert(error.message);
    }
}



function displayAgentBeliefs() {
    let outputText = '';
    for (let agent in agentBeliefs) {
        // Wrap agent's name in a span, color it, and make it bold using inline CSS
        const coloredAgentName = `<span style="color: ${agentColors[agent]}; font-weight: bold;">${agent}</span>`;
        outputText += `${coloredAgentName} believes ${agentBeliefs[agent].messages.join(' and ')} and k(${agent}) = ${agentBeliefs[agent].denotation}<br>`;
    }
    // Using innerHTML instead of innerText since we are adding HTML tags
    document.getElementById("beliefOutput").innerHTML = outputText;
}


/*for verification  


(p+(~q&((r+~p)>~(p>~r)))) ===> {{p}, {q, p}, {r, p}, {r, q, p}}

((p > q) & (q > r)) ===>  {{}, {r}, {r, q}, {r, q, p}}

both ===> {{r, q, p}}
*/


// ================================================
// =============== AUXILIARY FUNCTIONS ============
// ================================================

// Global arraysAreEqual function
function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
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


function denotationToString(denotation) {
    if (denotation.length === 0) return '{}';
    return `{{${denotation.map(set => set.join(', ')).join('}, {')}}}`;
}

function stringToDenotation(denotationStr) {
    if (denotationStr === '{}' || denotationStr === '') return [];
    return denotationStr.slice(2, -2).split('}, {')
        .map(str => str.split(',').map(element => element.trim()).filter(Boolean));
}


// Helper function to calculate the complement of a set
function complementOfSet(set) {
    // Generate the power set of Prop
    let fullSet = powerSet(Prop);
    // Remove the elements that are in the input set from the full set
    return fullSet.filter(subset => !set.some(setSubset => 
        setSubset.length === subset.length && setSubset.every((element, index) => element === subset[index])
    ));
}

function atomDenotation(atom) {
    return powerSet(Prop).filter(subset => subset.includes(atom));
}

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


function parseSet(denotation) {
    if (denotation === '{}' || denotation === '') return [];
    return denotation.slice(2, -2).split('}, {')
                     .map(str => str.split(',').map(element => element.trim()).filter(Boolean));
}


function cleanSet(set) {
    return set.map(element => element.replace(/[{}]/g, '').trim());
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

    //console.log("updatedmodels called with announcement:", announcement);

    const parsedAnnouncement = parseAnnouncement(announcement);
    //console.log("Parsed Announcement:", parsedAnnouncement);

    const announcementAgent = parsedAnnouncement.agent;
    const announcementProposition = parsedAnnouncement.content;
    const announcementDenotation = replaceWithDenotation(parse(tokenize(announcementProposition)));
    //console.log("Announcement Denotation:", announcementDenotation);
    const announcementWorlds = stringToDenotation(announcementDenotation);
    //console.log("Announcement Worlds:", announcementWorlds);

    //console.log("a's followers:", agentFollowers[announcementAgent]);

    for (let agt of agentFollowers[announcementAgent]) { // Use 'of' instead of 'in'
        //console.log("Processing agent:", agt);

        //console.log(`Agent ${agt} is a follower of ${announcementAgent}`);
        let agentBeliefWorlds = stringToDenotation(agentBeliefs[agt].denotation);
        //console.log(`Agent ${agt} Belief Worlds Before Intersection:`, agentBeliefWorlds);

        agentBeliefWorlds = setIntersection(agentBeliefWorlds, announcementWorlds);
       //console.log(`Agent ${agt} Belief Worlds After Intersection:`, agentBeliefWorlds);

        agentBeliefs[agt].denotation = denotationToString(agentBeliefWorlds);
    }
    
    //console.log("a's belief:", agentBeliefs["a"]);
    //console.log("b's belief:", agentBeliefs["b"]);
    //console.log("c's belief:", agentBeliefs["c"]);
}


function handleUpdateModelClick() {
    const inputElement = document.getElementById("beliefupdate");
    if (!inputElement) {
        console.error("Input element not found.");
        return;
    }

    const announcement = inputElement.value;
   // console.log("Retrieved announcement:", announcement); // Check the retrieved value

    if (typeof announcement !== 'string' || announcement.trim() === '') {
        console.error("Invalid input: Announcement must be a string and cannot be empty.");
        return;
    }

    updatedmodels(announcement);
    calculateStrong();

}


let matrix = [];
let Prop = [];


//make an objrect strongAnnounce = {Agt[i]:strong } for i in size of Agt
let strongAnnounce = {};

function calculateStrong() {
    // Loop over all agents in Agt
    for (const agent of Agt) {
        generateExpressions(agent);
        const handleParseFunction = window.effect.handleParseFunction();
        handleParseFunction.strongestAnnounces(agent);
        //console.log('handleParseFunction', handleParseFunction);
    }
}

window.exportedStrongAnnounce = strongAnnounce;

function powerSet2(nums) {
    const result = [[]]; // Initialize with empty set

    for (const num of nums) {
        const subsets = [];
        for (const subset of result) {
            subsets.push([...subset, num]); // Add current number to existing subsets
        }
        result.push(...subsets); // Add new subsets to result
    }

    return result;
}


function deepArrayContains(haystack, needle) {
    return haystack.some(set => 
        set.length === needle.length &&
        set.every(item => needle.includes(item.trim()))
    );
}



function updateMatrix(agt) {
    //console.log("All agent beliefs:", JSON.stringify(agentBeliefs));
    //console.log("Current agent:", agt);
    // Ensure the agent has been initialized in agentBeliefs
    if (!agentBeliefs[agt] || !agentBeliefs[agt].denotation) {
       // console.log(`No beliefs found for agent ${agt}, returning default matrix.`);
        return Array.from({ length: 2 }, () => Array(4).fill('0')); // Adjust dimensions as needed
    }

    const inputSetString = agentBeliefs[agt].denotation;

    if (inputSetString.trim() === "{}") {
       // console.log("Input string is empty, returning zero matrix.");
        matrix = [['0','0','0','0'],['0','0','0','0']];
        return matrix;
    }

    const inputArray = inputSetString.match(/\{[^{}]*\}/g);
    const inputResult = inputArray.map(item =>
        item === "{}" ? [] : item.replace(/[{}]/g, "").split(",").map(x => x.trim())
    );

    const powers = powerSet(Prop);

    matrix.forEach((row, rowIndex) => {
        row.forEach((_, colIndex) => {
            const index = rowIndex * row.length + colIndex; // Calculate flat index
            const power = powers[index];
            matrix[rowIndex][colIndex] = deepArrayContains(inputResult, power) ? '1' : '0';
        });
    });

   // console.log("matrix", matrix);
    return matrix;
}


function extractMatrix() {
    
    const extractedMatrix = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === '1') {
                extractedMatrix.push(`${i}${j}`);
            }
        }
    }
   // console.log("extractedMatrix", extractedMatrix);
    return extractedMatrix;
}


function generateExpressions(agt) {
   updateMatrix(agt);
    const valuedMatrix = extractMatrix();
   // console.log("valuedMatrix ", valuedMatrix);
    const selectedParts = findMGTE(valuedMatrix);
   // console.log("selectedParts", selectedParts);
    const sop = generateSOP(selectedParts);
   // console.log('sop', sop);
    strongAnnounce[agt] = sop; // Store the strong announcement using the agent name as the key
   // console.log(`Agent ${agt}'s strong announcement: ${strongAnnounce[agt]}`);
    document.getElementById('sop-expression').textContent = sop;
}


function findMGTE(array) {
    const fullMatrix = ['00', '01', '02', '03', '10', '11', '12', '13'];
    const groups = [
        ['00', '01', '02', '03'],
        ['10', '11', '12', '13'],
        ['00', '01', '10', '11'],
        ['01', '03', '11', '13'],
        ['00', '02', '10', '12'],
        ['02', '03', '12', '13']
    ];
    const tuples = [
        ['00', '01'], ['02', '03'],
        ['00', '02'], ['01', '03'],
        ['10', '11'], ['12', '13'],
        ['10', '12'], ['11', '13'],
        ['00', '10'], ['01', '11'],
        ['02', '12'], ['03', '13']
    ];

    let selectedParts = {
        fullMatrix: false,
        groups: [],
        tuples: [],
        elements: []
    };

  // Check if the input array is equal to the full matrix
  const arrayEqualFullMatrix = array.length === fullMatrix.length && array.every((elem, idx) => elem === fullMatrix[idx]);
 // console.log("arrayEqualFullMatrix ", arrayEqualFullMatrix);
  if (arrayEqualFullMatrix) {
      selectedParts.fullMatrix = true;
  } else {
      // Check if the input array is a subset of any group
      for (const group of groups) {
          if (group.every(elem => array.includes(elem))) {
              selectedParts.groups.push(group);
          }
      }

      // Check if the input array contains any tuples not covered by the groups
      const uncoveredTuples = tuples.filter(tuple => {
          const isTupleCovered = selectedParts.groups.some(group => tuple.every(elem => group.includes(elem)));
          return tuple.every(elem => array.includes(elem)) && !isTupleCovered;
      });
      selectedParts.tuples = uncoveredTuples;

      // Check if the input array contains any elements not covered by groups or tuples
      const uncoveredElements = array.filter(elem => {
          const isElementCovered = selectedParts.groups.some(group => group.includes(elem)) ||
              selectedParts.tuples.some(tuple => tuple.includes(elem));
          return !isElementCovered;
      });
      selectedParts.elements = uncoveredElements.map(elem => [elem]);
  }

  return selectedParts;
}


function generateSOP(object) {
    const fullMatrix = ['00', '01', '02', '03', '10', '11', '12', '13'];
    const groups = [
        ['00', '01', '02', '03'],
        ['10', '11', '12', '13'],
        ['00', '01', '10', '11'],
        ['01', '03', '11', '13'],
        ['00', '02', '10', '12'],
        ['02', '03', '12', '13']
    ];
    const tuples = [
        ['00', '01'], ['02', '03'],
        ['00', '02'], ['01', '03'],
        ['10', '11'], ['12', '13'],
        ['10', '12'], ['11', '13'],
        ['00', '10'], ['01', '11'],
        ['02', '12'], ['03', '13']
    ];
    const elements = [
        ['00'], ['01'], ['02'], ['03'],
        ['10'], ['11'], ['12'], ['13']
    ];

    if (object.groups.length === 0 && object.tuples.length === 0 && object.elements.length === 0) {
        // If there are no groups, tuples, or elements, return p+~p or (p&~p) if fullMatrix is not empty
        return (object.fullMatrix) ?  'p+~p' :'(p&~p)';
    }

    const groupsInterpretation = ['~r', 'r', '~q', 'p', '~p', 'q'];
    const tuplesInterpretation = ['(~r&~q)', '(~r&q)', '(~r&~p)', '(~r&p)', '(r&~q)', '(r&q)', '(r&~p)', '(r&p)', '(~p&~q)', '(p&~q)', '(q&~p)', '(q&p)'];
    const elementInterpretation = ['(~p&~q&~r)', '(p&~q&~r)', '(~p&q&~r)', '(p&q&~r)', '(~p&~q&r)', '(p&~q&r)', '(~p&q&r)', '(p&q&r)'];

    let sop = "";

    // Translate groups into expressions
    object.groups.forEach(group => {
        const index = groups.findIndex(item => item.every(elem => group.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + groupsInterpretation[index] : groupsInterpretation[index];
        }
    });

    // Translate tuples into expressions
    object.tuples.forEach(tuple => {
        const index = tuples.findIndex(item => item.every(elem => tuple.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + tuplesInterpretation[index] : tuplesInterpretation[index];
        }
    });

    // Translate elements into expressions
    object.elements.forEach(element => {
        const index = elements.findIndex(item => item.every(elem => element.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + elementInterpretation[index] : elementInterpretation[index];
        }
    });

    return sop;
}


function getIndexAndBinaryTransform(element) {
    // Transform index to binary with 3 digits
    const binary = element.toString(2).padStart(3, '0');

    // Separate binary into row and col parts
    const row = parseInt(binary[0], 2);
    const col = parseInt(binary.substring(1), 2); 
    return { row, col };
}

// Agents' beliefs initialized as booleans



const guess_agentFollowers = {};
let guess_agentBeliefs = {};
const guess_baseProp = ['p', 'q', 'r'];
let guess_Agt = ['a', 'b', 'c'];
const possibleMessage = ['(~r+~q)', '(~r+q)', '(~r+~p)', '(~r+p)', '(r+~q)', '(r+q)', '(r+~p)', '(r+p)', '(~p+~q)', '(p+~q)', '(q+~p)', '(q+p)'];

// Function to generate a random follower for agent 'a'
function generateRandomFollower() {
    const possibleFollowers = ['b', 'c'];
    const randomIndex = Math.floor(Math.random() * possibleFollowers.length);
    const follower = possibleFollowers[randomIndex];
    
    guess_agentFollowers['a'] = [follower];
}

// Generate random beliefs for each agent and populate the guess_agentBeliefs object
function guess_assignBelief() {
    const agents = ['a', 'b', 'c'];
    
    agents.forEach(agent => {
        if (!guess_agentBeliefs[agent]) {
            guess_agentBeliefs[agent] = {
                messages: [],
                denotation: '{}'
            };
        }
        
        // Randomly select a message from possibleMessage
        const randomIndex = Math.floor(Math.random() * possibleMessage.length);
        const randomMessage = possibleMessage[randomIndex];
        
        try {
            // Parse the message and get its denotation
            const parsed = parse(tokenize(randomMessage));
            const denotationResult = replaceWithDenotation(parsed);
            
            // Update the agent's beliefs
            guess_agentBeliefs[agent].messages.push(randomMessage);
            guess_agentBeliefs[agent].denotation = denotationResult;
        } catch (error) {
            console.log(`Error parsing message for agent ${agent}. Using default message.`);
            guess_agentBeliefs[agent].messages.push(randomMessage);
            guess_agentBeliefs[agent].denotation = '{{}}';
        }
    });

    console.log("agent b's belief:", guess_agentBeliefs['b'].denotation);
    console.log("agent c's belief:", guess_agentBeliefs['c'].denotation);
    
    // Update the displayed beliefs for all agents
    displayAgentBeliefs();
    calculateStrong();
}

// Modify the window.onload function
window.onload = function() {
    generateRandomFollower();
    guess_assignBelief();
};


// Function to get the strongest belief for an agent
function getStrongestBelief(agent) {
    if (strongAnnounce[agent] && strongAnnounce[agent] !== '(p&~p)') {
        return strongAnnounce[agent];
    }
    if (guess_agentBeliefs[agent] && guess_agentBeliefs[agent].messages.length > 0) {
        return guess_agentBeliefs[agent].messages[0];
    }
    return possibleMessage[Math.floor(Math.random() * possibleMessage.length)];  // Return a random message if no belief is found
}

// Function to check and display the strongest beliefs of b and c
function checkStrongestBeliefs() {
    const agentsToCheck = ['b', 'c'];
    
    agentsToCheck.forEach(agent => {
        let strongestBelief = getStrongestBelief(agent);
        document.getElementById(`belief${agent.toUpperCase()}`).innerText = strongestBelief || 'No belief available';
    });
}

// Function to update the follower's belief after an announcement by agent a
function handleUpdateModelClick() {
    const announcement = document.getElementById("beliefupdate").value;
    const follower = guess_agentFollowers['a'][0];

    // Update the follower's belief with the announcement
    guess_agentBeliefs[follower].messages = [announcement];

    // Parse the announcement and update the follower's denotation
    try {
        const parsed = parse(tokenize(announcement));
        const denotationResult = replaceWithDenotation(parsed);
        guess_agentBeliefs[follower].denotation = denotationResult;
    } catch (error) {
        console.error("Error parsing announcement:", error);
        guess_agentBeliefs[follower].denotation = '{{}}';
    }

    // Recalculate the strongest beliefs
    calculateStrong();

    // Update the displayed strongest beliefs
    checkStrongestBeliefs();

    // Display success message
    document.getElementById("result").innerHTML = "Announcement made! Follower's belief has been updated.";
}

// Function to guess who the follower is
function guessFollower(guess) {
    const follower = guess_agentFollowers['a'][0];
    if (guess === follower) {
        document.getElementById("result").innerHTML = "Correct! Agent " + guess + " is the follower.";
    } else {
        document.getElementById("result").innerHTML = "Wrong guess. Try again!";
    }
}
