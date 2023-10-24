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
    Agt = Array.from({length: size}, (_, i) => i < 4 ? ['a', 'b', 'c', 'd'][i] : `a_${i + 1}`);

    Agt.forEach((agent, index) => {
        agentColors[agent] = colors[index % colors.length];
    });
    
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
}


// Display Followers
function displayFollowers() {
    let outputText = '';
    for (let agent in agentFollowers) {
        outputText += `f(${agent}) = {${agentFollowers[agent].join(', ')}}\n`;
    }
    document.getElementById("followerOutput").innerText = outputText;
}

// ================================================
// =============== PROP FUNCTIONS =================
// ================================================
let Prop = [];  // This makes it global



// Set Proposition Size
function setPropSize() {
    const size = parseInt(document.getElementById("propSize").value);
    if (size < 4) {
        Prop = ['p', 'q', 'r'].slice(0, size);
    } else if (size === 4) {
        Prop = ['p', 'q', 'r', 's'];
    } else if (size === 5) {
        Prop = ['p', 'q', 'r', 's', 't'];
    } else {
        Prop = ['p', 'q', 'r', 's', 't'].concat(Array.from({length: size - 5}, (_, i) => `p_${i + 2}`));
    }
    document.getElementById("propOutput").innerText = `Prop = {${Prop.join(', ')}}`;
}



// ================================================
// =============== FORMULA FUNCTIONS ==============
// ================================================

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

//Formula Check
function isWellFormedSimpleCheck(formula) {
    const binaryOperators = ['&', '+', '>'];

    let operatorCount = 0;
    for (const operator of binaryOperators) {
        operatorCount += (formula.match(new RegExp(`\\${operator}`, 'g')) || []).length;
    }

    const bracketPairsCount = (formula.match(/\(/g) || []).length;

    return operatorCount === bracketPairsCount;
}



// ===============================================
// ============== Denotation Compute==============
// ===============================================


//We obtain denotation by substiting formulas from atomic with sets.

function replaceWithDenotation(parsedFormula) {
    if (!parsedFormula) throw new Error("Invalid or non-well-formed formula.");

    switch (parsedFormula.type) {
        case 'atom':
            const denotation = atomDenotation(parsedFormula.value);
            if (denotation.length === 0) return '{}';
            return `{{${denotation.map(set => set.join(', ')).join('}, {')}}}`;
            
        case 'negation':
            const innerDenotation = replaceWithDenotation(parsedFormula.subformula);
            if (innerDenotation === '{}') return '{{}}'; // Handle negation of empty set
            if (innerDenotation.startsWith("{{") && innerDenotation.endsWith("}}")) {
                let setString = innerDenotation.slice(2, -2).split('}, {'); 
                let setArray = setString.map(str => str.split(', ').filter(Boolean));
                let complementSet = complementOfSet(setArray);
                if (complementSet.length === 0) return '{}'; // Return {} if the complement set is empty
                return `{{${complementSet.map(set => set.join(', ')).join('}, {')}}}`;
            }
            return `~${innerDenotation}`;

        case '&':
        case '+':
            const leftDenotation = replaceWithDenotation(parsedFormula.left);
            const rightDenotation = replaceWithDenotation(parsedFormula.right);

            if (leftDenotation.startsWith("{{") && leftDenotation.endsWith("}}") &&
                rightDenotation.startsWith("{{") && rightDenotation.endsWith("}}")) {
                
                let setA = leftDenotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                let setB = rightDenotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));

                let resultSet;
                if (parsedFormula.type === '&') {
                    resultSet = setIntersection(setA, setB);
                } else { // '+'
                    resultSet = setUnion(setA, setB);
                }
                
                if (resultSet.length === 0) return '{}'; // Return {} if the result set is empty
                return `{{${resultSet.map(set => set.join(', ')).join('}, {')}}}`;
            }

            return `(${leftDenotation} ${parsedFormula.type} ${rightDenotation})`;

        case '>':
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

        default:
            throw new Error("Invalid or non-well-formed formula.");
    }
}


// Display Denotation
function displayDenotation() {
    try {
        const formula = document.getElementById("formulaInput").value;

        if (!isWellFormedSimpleCheck(formula)) {
            throw new Error("The formula is not well-formed!");
        }

        const parsed = parse(tokenize(formula));
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
        
        const formula = document.getElementById("beliefFormula").value;

        if (!isWellFormedSimpleCheck(formula)) {
            throw new Error("The formula is not well-formed!");
        }

        const selectedAgent = document.getElementById("beliefAgent").value;
        const parsed = parse(tokenize(formula));
        const denotationResult = replaceWithDenotation(parsed);

        // Check if the agent already has beliefs
        if (agentBeliefs[selectedAgent]) {
            // Append new formula to the beliefs
            agentBeliefs[selectedAgent].formulas.push(formula);
            
            // Intersect the new denotation with the previous one
            let oldDenotation = agentBeliefs[selectedAgent].denotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
            let newDenotation = denotationResult.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
            let intersection = setIntersection(oldDenotation, newDenotation);
            
            if (intersection.length === 0) {
                agentBeliefs[selectedAgent].denotation = '{}'; // Set denotation to empty if there's a contradiction
            } else {
                agentBeliefs[selectedAgent].denotation = `{{${intersection.map(set => set.join(', ')).join('}, {')}}}`;
            }
        } else {
            // If no prior beliefs, initialize with the current one
            agentBeliefs[selectedAgent] = {
                formulas: [formula],
                denotation: denotationResult
            };
        }

        // Update the displayed beliefs for all agents
        displayAgentBeliefs();
    } catch (error) {
        alert(error.message);
    }
}



function displayAgentBeliefs() {
    let outputText = '';
    for (let agent in agentBeliefs) {
        // Wrap agent's name in a span, color it, and make it bold using inline CSS
        const coloredAgentName = `<span style="color: ${agentColors[agent]}; font-weight: bold;">${agent}</span>`;
        outputText += `${coloredAgentName} believes ${agentBeliefs[agent].formulas.join(' and ')} and k(${agent}) = ${agentBeliefs[agent].denotation}<br>`;
    }
    // Using innerHTML instead of innerText since we are adding HTML tags
    document.getElementById("beliefOutput").innerHTML = outputText;
}




// ================================================
// =============== AUXILIARY FUNCTIONS ============
// ================================================

// Remove the redundant arraysAreEqual inside complementOfSet
function setUnion(setA, setB) {
    const union = [...setA];
    for (const subset of setB) {
        if (!union.some(item => arraysAreEqual(item, subset))) {
            union.push(subset);
        }
    }
    return union;
}

function setIntersection(setA, setB) {
    return setA.filter(subsetA => setB.some(subsetB => arraysAreEqual(subsetA, subsetB)));
}

function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}



function complementOfSet(set) {
    let powerSetOfProp = powerSet(Prop);
    return powerSetOfProp.filter(subset => !set.some(item => arraysAreEqual(item, subset)));

    function arraysAreEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }
}

function atomDenotation(atom) {
    return powerSet(Prop).filter(subset => subset.includes(atom));
}

function powerSet(array) {
    return array.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
}

// Global arraysAreEqual function
function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}





/*for verification  


(p+(~q&((r+~p)>~(p>~r)))) ===> {{p}, {q, p}, {r, p}, {r, q, p}}

((p > q) & (q > r)) ===>  {{}, {r}, {r, q}, {r, q, p}}

both ===> {{r, q, p}}
*/