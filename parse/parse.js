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
    let outputfollower = '';
    for (let agent in agentFollowers) {
        outputfollower += `f(${agent}) = {${agentFollowers[agent].join(', ')}}\n`;
    }
    document.getElementById("followerOutput").innerText = outputfollower;
}

// ================================================
// =============== PROP FUNCTIONS =================
// ================================================
let Prop = [];



function setPropSize() {
    const baseProp = ['p', 'q', 'r', 's', 't'];
    const size = parseInt(document.getElementById("propSize").value);
    
    if (size <= baseProp.length) {
        Prop = baseProp.slice(0, size);
    } else {
        const additionalProps = Array.from({ length: size - baseProp.length }, (_, i) => `p_${i + 2}`);
        Prop = [...baseProp, ...additionalProps];
    }

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

// Helper function to parse a set denotation string into a set
function parseSet(denotation) {
    if (denotation === '{}') return [];
    return denotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
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

function includesArray(bigArray, smallArray) {
    return bigArray.some(arr => JSON.stringify(arr) === JSON.stringify(smallArray));
}

// Helper function to perform set intersection
function setIntersection(setA, setB) {
    // Convert each set to a string to perform comparison
    const setAStr = setA.map(subset => subset.sort().join(','));
    const setBStr = setB.map(subset => subset.sort().join(','));
    
    // Filter set A to only include elements that are also in set B
    const intersection = setAStr.filter(subsetA => setBStr.includes(subsetA));
    
    // Convert the string representation back to a set
    return intersection.map(subset => subset.split(',').filter(Boolean));
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


function parseDenotationString(denotation) {
    if (Array.isArray(denotation)) return denotation;

    if (typeof denotation !== "string") {
        console.error("Unexpected input:", denotation);
        return [];
    }

    let worlds = denotation.match(/(?<=\{)[^{}]*?(?=\})/g) || [];
    return worlds.map(world => 
        world.split(',').filter(atom => atom.trim()).map(atom => atom.trim())
    );
}


function getNextToken(subtokens) {
    if (subtokens.length === 0) {
        throw new Error("Unexpected end of formula.");
    }
    return subtokens.shift();
}



function tokenizeFormula(formula) {
    if (typeof formula !== "string") {
        throw new TypeError("Formula must be a string.");
    }
    return formula.match(/B[a-z]|~|&|\+|>|[a-z]_[0-9]+|[a-z]|T|F|[\(\)]/g);
}

function parseFormula(tokens) {
    if (!tokens) {
        throw new Error("Tokens are undefined or null");
    }
    if (tokens.length === 0) throw new Error("Unexpected end of input");

    const token = tokens.shift();

    switch (token) {
        case '~':
            return { type: 'negation', submessage: parseFormula(tokens) };
        case '(':
            const left = parseFormula(tokens);

            if (!tokens.length) throw new Error("Expected an operator after subformula");

            const operator = tokens.shift();
            if (['&', '+', '>'].indexOf(operator) === -1) throw new Error(`Unexpected operator: ${operator}`);

            const right = parseFormula(tokens);
            
            if (tokens[0] !== ')') throw new Error("Expected a closing bracket");
            tokens.shift();

            return { type: operator, left, right };
        default:
            if (/^[a-z](?:[a-z]|[A-Z])?$/.test(token) || token === 'T' || token === 'F') { 
                return { type: 'atom', value: token };
            } else {
                throw new Error(`Unexpected token: ${token}`);
            }
    }
}


// ================================================
// =============== Evalutate Formula ==============
// ================================================

function addSeparatorsToFormula(tokens) {
    let result = [];
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        if (token.startsWith('B') || token.startsWith('~B')) {
            if (i > 0 && (tokens[i-1] === '&' || tokens[i-1] === '+')) {
                result.push('|');
            }
        }
        result.push(token);
        if (token === '&' || token === '+') {
            if (i < tokens.length - 1 && (tokens[i+1].startsWith('B') || tokens[i+1].startsWith('~B'))) {
                result.push('|');
            }
        }
    }
    return result;
}




function extractLiterals(formula) {
    let literals = formula.match(/B[a-z](~+)?\([^)]+\)|B[a-z](~+)?[a-z]/g) || [];
    return literals;
}




/*
function includesSet(set, subset) {
    return subset.every(element => set.includes(element));
}

*/

function isSubsetOf(subsetWorlds, supersetWorlds) {
    // Convert the arrays of worlds to strings for easier comparison
    const supersetStrings = supersetWorlds.map(set => JSON.stringify(set.sort()));
    const subsetStrings = subsetWorlds.map(set => JSON.stringify(set.sort()));

    // Check if every world in subsetWorlds is included in supersetWorlds
    return subsetStrings.every(subset => supersetStrings.includes(subset));
}




function evaluateLiteral(literal) {
    const agent = literal[1];
    let message;

    // Extract the message part of the belief literal, including any negation inside it.
    if (literal.includes('(')) {
        // Include the parentheses to ensure any negation inside is parsed.
        const messageStartIndex = literal.indexOf('B' + agent) + ('B' + agent).length;
        message = literal.slice(messageStartIndex);
    } else {
        message = literal.slice(2); // Adjust this if the structure of your belief literals is different.
    }
    console.log("message:", message);

    // Parse the message including the negation.
    const parsedMessage = parse(tokenize(message));
    console.log("parsedMessage:", parsedMessage);

    // Assuming replaceWithDenotation returns a set of worlds where the message is true.
    const messageDenotation = replaceWithDenotation(parsedMessage);
    console.log("messageDenotation:", messageDenotation);

    // Convert the denotation string into a set of worlds.
    let messageWorlds = parseSet(messageDenotation);
    console.log("messageWorlds:", messageWorlds);
    const agentBeliefWorlds = parseSet(agentBeliefs[agent].denotation);
    console.log("agentBeliefWorlds:", agentBeliefWorlds);

    // Check if the proposition is true in all of the agent's belief worlds.
    const result = isSubsetOf(agentBeliefWorlds, messageWorlds);

    return result;
}







function substituteLiteralsWithValues(formula, literals, evaluations) {
    for (let i = 0; i < literals.length; i++) {
        // Escape regex special characters
        let regex = new RegExp(literals[i].replace(/([()\[\]{}^$+*?.])/g, '\\$1'), 'g');
        formula = formula.replace(regex, evaluations[i] ? 'T' : 'F');
    }
    return formula;
}





function evaluateFormula(formula) {
    switch (formula.type) {
        case 'atom':
            return formula.value === 'T' ? true : formula.value === 'F' ? false : undefined;
        case 'negation':
            return !evaluateFormula(formula.submessage);
        case '&':
            return evaluateFormula(formula.left) && evaluateFormula(formula.right);
        case '+':
            return evaluateFormula(formula.left) || evaluateFormula(formula.right);
        
        default:
            throw new Error(`Unexpected formula type: ${formula.type}`);
    }
}


function satisfiability() {
    const formula = document.getElementById("formulaInput").value.trim();
    console.log("formula:", formula)
    // Transform the formula: replace '|' with the appropriate characters
    const transformedFormula = formula.replace(/\|&\|/g, '&').replace(/\|\+\|/g, '+');
    console.log("transformedFormula:", transformedFormula)
    // Extract the literals from the transformed formula
    const literals = extractLiterals(transformedFormula);
    console.log("literals:",literals)
    // Evaluate each literal to determine its truth value
    const evaluations = literals.map(literal => evaluateLiteral(literal));
    console.log("evaluation:",evaluations)
    // Substitute the truth values into the formula
    const substitutedFormulaString = substituteLiteralsWithValues(transformedFormula, literals, evaluations);
    console.log("substitutedFormulaString:",substitutedFormulaString)

    const tokensForParsing = tokenizeFormula(substitutedFormulaString);
    console.log("Tokens for parsing:", tokensForParsing);


    // Parse the substituted formula so that it becomes an object structure
    const parsedFormula = parseFormula(tokenizeFormula(substitutedFormulaString));

    // Evaluate the formula
    const satResult = evaluateFormula(parsedFormula);


    
    document.getElementById("satisfaction").innerText = satResult ? "Satisfied" : "Unsatisfied";
}


/*for verification: 
a believes p and k(a) = {{p}, {q, p}, {r, p}, {r, q, p}}
b believes q and k(b) = {{q}, {q, p}, {r, q}, {r, q, p}}
c believes r and k(c) = {{r}, {r, p}, {r, q}, {r, q, p}}

(~(Ba~(q+r)+Bbr)&Bcr) satisified
(~(F+F)&T)

((~Ba(~p>q)&Bbr)+(Bc(~q>r)&~Bb(p>q))) unsatisfied
((~T&F)+(T&~T))

((Ba~(~p&r) + ~Bb~(r+q)) + ~Bc~(p>q)) Satisfied
((T + ~F) + ~F)

(~Ba(p>q)&~Bbr)+(Bc~~r+Bb~(r>q))  Satisfied
(~F&~F)+(T+F)

*/


