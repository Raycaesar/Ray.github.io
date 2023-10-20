// ===============================================
// =============== AGENT FUNCTIONS ===============
// ===============================================
const agentFollowers = {};
const agentBeliefs = {};


// Set Agent Size and Update Dropdowns
function setAgentSize() {
    const size = parseInt(document.getElementById("agentSize").value);
    Agt = Array.from({length: size}, (_, i) => i < 4 ? ['a', 'b', 'c', 'd'][i] : `a_${i + 1}`);
    
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

// Set Proposition Size
function setPropSize() {
    const size = parseInt(document.getElementById("propSize").value);
    Prop = Array.from({length: size}, (_, i) => i < 3 ? ['p', 'q', 'r'][i] : `p_${i + 1}`);
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
    if (tokens.length === 0) return null;

    let token = tokens.shift();
    
    if (token === '~') {
        return {
            type: 'negation',
            subformula: parse(tokens)
        };
    } else if (token === '(') {
        let left = parse(tokens);
        
        let operator = tokens.shift(); // Assume the next token is an operator
        
        let right = parse(tokens);
        
        if (tokens[0] === ')') {
            tokens.shift();  // Remove closing bracket
            return {
                type: operator,
                left: left,
                right: right
            };
        }
    } else {  // atom
        return {
            type: 'atom',
            value: token
        };
    }
}


// Display Denotation
function displayDenotation() {
    const formula = document.getElementById("formulaInput").value;
    const parsed = parse(tokenize(formula));
    const result = replaceWithDenotation(parsed);
    document.getElementById("resultOutput").innerText = result;
}

function replaceWithDenotation(parsedFormula) {
    // Basic error handling - handle malformed formulas
    try {
        if (!parsedFormula) return "";

        switch (parsedFormula.type) {
            case 'atom':
                return `{{${atomDenotation(parsedFormula.value).map(set => set.join(', ')).join('}, {')}}}`;
            case 'negation':
                // Check if it's directly negating a set
                let innerDenotation = replaceWithDenotation(parsedFormula.subformula);
                if (innerDenotation.startsWith("{{") && innerDenotation.endsWith("}}")) {
                    let setString = innerDenotation.slice(2, -2).split('}, {'); // Extract set elements
                    let setArray = setString.map(str => str.split(', ').filter(Boolean));
                    let complementSet = complementOfSet(setArray);
                    return `{{${complementSet.map(set => set.join(', ')).join('}, {')}}}`;
                }
                return `~${innerDenotation}`;
            case '&':
                let leftIntersection = replaceWithDenotation(parsedFormula.left);
                let rightIntersection = replaceWithDenotation(parsedFormula.right);
                
                if (leftIntersection.startsWith("{{") && leftIntersection.endsWith("}}") &&
                    rightIntersection.startsWith("{{") && rightIntersection.endsWith("}}")) {
                    
                    let setA = leftIntersection.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                    let setB = rightIntersection.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                    let intersectionSet = setIntersection(setA, setB);
                    
                    return `{{${intersectionSet.map(set => set.join(', ')).join('}, {')}}}`;
                }
                return `(${leftIntersection} & ${rightIntersection})`;
            case '+':
                let leftUnion = replaceWithDenotation(parsedFormula.left);
                let rightUnion = replaceWithDenotation(parsedFormula.right);
                
                if (leftUnion.startsWith("{{") && leftUnion.endsWith("}}") &&
                    rightUnion.startsWith("{{") && rightUnion.endsWith("}}")) {
                    
                    let setA = leftUnion.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                    let setB = rightUnion.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                    let unionSet = setUnion(setA, setB);
                    
                    return `{{${unionSet.map(set => set.join(', ')).join('}, {')}}}`;
                }
                return `(${leftUnion} + ${rightUnion})`;
            case '>':
                let notLeft = {
                    type: 'negation',
                    subformula: parsedFormula.left
                };
                let orRight = {
                    type: '+',
                    left: notLeft,
                    right: parsedFormula.right
                };
                return replaceWithDenotation(orRight);
            default:
                return "";
        }
    } catch (error) {
        console.error("Error processing formula: ", error);
        return "Error in formula processing.";
    }
}


// ===============================================
// =============== BELIEF FUNCTIONS ==============
// ===============================================

function assignBelief() {
    const selectedAgent = document.getElementById("beliefAgent").value;
    const beliefFormula = document.getElementById("beliefFormula").value;

    const parsed = parse(tokenize(beliefFormula));
    const denotationResult = replaceWithDenotation(parsed);

    // Store the belief for the agent
    agentBeliefs[selectedAgent] = {
        formula: beliefFormula,
        denotation: denotationResult
    };

    // Update the displayed beliefs for all agents
    displayAgentBeliefs();
}
function displayAgentBeliefs() {
    let outputText = '';
    for (let agent in agentBeliefs) {
        outputText += `${agent} believes ${agentBeliefs[agent].formula} and k(${agent}) = ${agentBeliefs[agent].denotation}\n`;
    }

    document.getElementById("beliefOutput").innerText = outputText;
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





/*for verification  (p+(~q&((r+~p)>~(p>~r))))*/