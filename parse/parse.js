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

// ================================================
// =============== PROP FUNCTIONS =================
// ================================================
//let Prop = [];



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
/*
function parseSet(denotation) {
    if (denotation === '{}') return [];
    return denotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
}
*/
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

// Helper function to perform set intersection
/*
function setIntersection(setA, setB) {
    // Convert each set to a string to perform comparison
    const setAStr = setA.map(subset => subset.sort().join(','));
    const setBStr = setB.map(subset => subset.sort().join(','));
    
    // Filter set A to only include elements that are also in set B
    const intersection = setAStr.filter(subsetA => setBStr.includes(subsetA));
    
    // Convert the string representation back to a set
    return intersection.map(subset => subset.split(',').filter(Boolean));
}
*/
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

    const token = tokens.shift(); // Get the first token and remove it from the array

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
        // Belief case
        const agent = token[1];
        let message = '';
        if (tokens[0] === '(') {
            // Belief with a message inside parentheses
            while (tokens.length > 0 && tokens[0] !== ')') {
                message += tokens.shift();
            }
            message += tokens.shift(); // Add the closing parenthesis
        } else {
            // Belief with a propositional variable or negation
            message = tokens.shift();
        }
        return {
            type: 'belief',
            agent: agent,
            message: message
        };
    } else if (token === '(') {
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


/*

const input = "[a:p]([b:(p>q)]Bc(p+q) & [a:q](Bc(q>p) +[c:q]Baq))";
const example_tokens = tokenizeFormula(input);
console.log('Tokens:', example_tokens);

try {
    const parsed = parseFormula(example_tokens);
    console.log('Parsed formula:', JSON.stringify(parsed, null, 2));
} catch (e) {
    console.error('Error:', e.message);
}


console.log("announcement:", announcement)
console.log("left:", left)
console.log("operator:", operator)
console.log("right:", right)
console.log("messageTokens:", messageTokens)

*/
/*
function updatedmodels(announcement) {
    const parsedAnnouncement = parseFormula(tokenizeFormula(announcement));
    console.log("parsedAnnouncement:", parsedAnnouncement);
    const announcementAgent = parsedAnnouncement.agent;
    console.log("announcementAgent:", announcementAgent);
    const announcementProposition = parsedAnnouncement.content;
    console.log("announcementProposition:", announcementProposition);

    for (let agt in agentFollowers) {
        console.log("follower:", agt);
        if (agentFollowers[announcementAgent].includes(agt)) {
            let announcementDenotation = replaceWithDenotation(parse(tokenize(announcementProposition)));
            console.log("announcementDenotation:", announcementDenotation);
            let announcementWorlds;
            console.log("announcementWorlds:", announcementWorlds);
            // Check if announcementDenotation is already an array
            if (Array.isArray(announcementDenotation)) {
                announcementWorlds = announcementDenotation;
            } else {
                // If it's a string, parse it
                announcementWorlds = parseSet(announcementDenotation);
            }

            let agentBeliefWorlds = parseSet(agentBeliefs[agt].denotation);
            agentBeliefWorlds = setIntersection(agentBeliefWorlds, announcementWorlds);
            console.log("agentBeliefWorlds:", agentBeliefWorlds);
            
            agentBeliefs[agt].denotation = formatDenotation(agentBeliefWorlds);
        }
    }
}*/
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

function updatedmodels(formula) {

    console.log("Updatedmodels called with announcement:", announcement);

    // Check if announcement is a valid string
    if (typeof announcement !== 'string' || announcement.trim() === '') {
        console.error("Invalid announcement format:", announcement);
        return;
    }
    const parsedAnnouncement = parseFormula(tokenizeFormula(formula));
    console.log("Parsed Announcement:", parsedAnnouncement);
    const announcementAgent = parsedAnnouncement.agent;
    const announcementProposition = parsedAnnouncement.content;
    const announcementDenotation = replaceWithDenotation(parse(tokenize(announcementProposition)));
    console.log("Announcement Denotation:", announcementDenotation);
    const announcementWorlds = stringToDenotation(announcementDenotation);
    console.log("Announcement Worlds:", announcementWorlds);

    console.log("a's followers:", agentFollowers[announcementAgent]);

    for (let agt of agentFollowers[announcementAgent]) { // Use 'of' instead of 'in'
        console.log("Processing agent:", agt);

        console.log(`Agent ${agt} is a follower of ${announcementAgent}`);
        let agentBeliefWorlds = stringToDenotation(agentBeliefs[agt].denotation);
        console.log(`Agent ${agt} Belief Worlds Before Intersection:`, agentBeliefWorlds);

        agentBeliefWorlds = setIntersection(agentBeliefWorlds, announcementWorlds);
        console.log(`Agent ${agt} Belief Worlds After Intersection:`, agentBeliefWorlds);

        agentBeliefs[agt].denotation = denotationToString(agentBeliefWorlds);
    }
    
    console.log("a's belief:", agentBeliefs["a"]);
    console.log("b's belief:", agentBeliefs["b"]);
    console.log("c's belief:", agentBeliefs["c"]);
}





function handleUpdateModelClick() {
    const inputElement = document.getElementById("beliefupdate");
    if (!inputElement) {
        console.error("Input element not found.");
        return;
    }

    const announcement = inputElement.value;
    console.log("Retrieved announcement:", announcement); // Check the retrieved value

    if (typeof announcement !== 'string' || announcement.trim() === '') {
        console.error("Invalid input: Announcement must be a string and cannot be empty.");
        return;
    }

    updatedmodels(announcement);



}




/*
function updatedmodels(announcement) {
    const parsedAnnouncement = parseFormula(tokenizeFormula(announcement));
    const announcementAgent = parsedAnnouncement.agent;
    const announcementProposition = parsedAnnouncement.content;

    for (let agt in agentFollowers) {
        if (agentFollowers[announcementAgent].includes(agt)) {
            const announcementDenotation = replaceWithDenotation(parse(tokenize(announcementProposition)));
            console.log(`announcementDenotation for ${agt}:`, announcementDenotation);

            let announcementWorlds = announcementDenotation; // Assuming this is already in the correct format
            console.log(`announcementWorlds for ${agt}:`, announcementWorlds);

            let agentBeliefWorlds = parseSet(agentBeliefs[agt].denotation);
            console.log(`agentBeliefWorlds (before intersection) for ${agt}:`, agentBeliefWorlds);

            agentBeliefWorlds = setIntersection(agentBeliefWorlds, announcementWorlds);
            console.log(`agentBeliefWorlds (after intersection) for ${agt}:`, agentBeliefWorlds);

            agentBeliefs[agt].denotation = formatDenotation(agentBeliefWorlds);
        }
    }
}




let Prop = ["p", "q", "r"];

agentFollowers["a"] = ["b", "c"] 
agentFollowers["b"] = [ "c"]
agentFollowers["c"] = ["b"]
// Initialize beliefs for each agent
agentBeliefs["a"] = { denotation: "{{p}, {p,q}, {p,r}, {p,q,r} }" };
agentBeliefs["b"] = { denotation: "{{q}, {p,q}, {q,r}, {p,q,r} }" };
agentBeliefs["c"] = { denotation: "{{p}, {r}}" };
updatedmodels("[a:r]Bbq");
*/








// ================================================
// =============== Evalutate Formula ==============
// ================================================

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





/*
function setIntersection(setA, setB) {
    return setA.filter(subsetA => 
        setB.some(subsetB => 
            subsetA.length === subsetB.length && subsetA.every(element => subsetB.includes(element))
        )
    );
}
*/


function evaluateLiteral(literal, announcements) {
    
    const agent = literal[1];
    console.log("agent:", agent);
    console.log("Bound announcements", announcements);
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

    // Start with the agent's belief worlds.
    let agentBeliefWorlds = parseSet(agentBeliefs[agent].denotation);
     
    // Check if the proposition is true in all of the agent's belief worlds.
    const result = isSubsetOf(agentBeliefWorlds, messageWorlds);
    console.log("result:", result);
    return result;
    
}

  
/*
For verification:
f(a) = {b, c}
f(b) = {c}

[a:p]Bbp

[a:p][b:(p>q)]Bcq 
 
[a:p]([b:(p>q)]Bcq & Bcq) 


[a:p]([b:(p>q)]Bcq &[a:q](Bcq +[c:q]Baq)) 
*/


function evaluateFormula(formula) {
    switch (formula.type) {
        case 'atom':
            // Assuming evaluateLiteral is defined elsewhere
            return evaluateLiteral(formula.value);
        case 'negation':
            return !evaluateFormula(formula.subformula);
        case '&':
            return evaluateFormula(formula.left) && evaluateFormula(formula.right);
        case '+':
            return evaluateFormula(formula.left) || evaluateFormula(formula.right);

        case 'free announcement':
                console.log("Evaluating free announcement:", formula.announcement);
    
                // Ensure the announcement is in a valid format
                if (typeof formula.announcement !== 'string' || formula.announcement.trim() === '') {
                    console.error("Invalid format for free announcement:", formula.announcement);
                    return false;
                }
    
                updatedmodels(formula.announcement);
                return evaluateFormula(formula.subformula);

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


/*
[a:r]([a:p]Bbp&Bcp)


function evaluateFormula(formula, announcements) {
    switch (formula.type) {
        case 'atom':
            return formula.value === 'T' ? true : formula.value === 'F' ? false : undefined;
        case 'negation':
            return !evaluateFormula(formula.submessage, announcements);
        case '&':
            return evaluateFormula(formula.left, announcements) && evaluateFormula(formula.right, announcements);
        case '+':
            return evaluateFormula(formula.left, announcements) || evaluateFormula(formula.right, announcements);
        case 'free announcement':
            // Add the current announcement to the context for the subformula
            const newAnnouncements = [...announcements, { agent: formula.agent, proposition: formula.proposition }];
            return evaluateFormula(formula.subformula, newAnnouncements);
        default:
            throw new Error(`Unexpected formula type: ${formula.type}`);
    }
}


function satisfiability() {
    const formula = document.getElementById("formulaInput").value.trim();
    console.log("formula:", formula)
    

    // Parse the substituted formula so that it becomes an object structure
    const parsedFormula = parseFormula(tokenizeFormula(substitutedFormulaString));
    console.log("parsedFormula:", parsedFormula);
    
    // Evaluate the formula with an empty context initially
    const satResult = evaluateFormula(parsedFormula, []);
    
    document.getElementById("satisfaction").innerText = satResult ? "Satisfied" : "Unsatisfied";
}
*/

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

(Ba~(p>q)&(Bb(r>~q)+Bc(p+~r)))
(F&(F+F))
*/


/*
function substituteLiteralsWithValues(formula, literals, evaluations) {
    for (let i = 0; i < literals.length; i++) {
        // Escape regex special characters
        let regex = new RegExp(literals[i].replace(/([()\[\]{}^$+*?.])/g, '\\$1'), 'g');
        formula = formula.replace(regex, evaluations[i] ? 'T' : 'F');
    }
    formula = formula.replace(/\[[a-z]:[^\]]+\](T|F)/g, (match, p1) => p1);
    return formula;
}

// Transform the formula: replace '|' with the appropriate characters
    // const transformedFormula = formula.replace(/\|&\|/g, '&').replace(/\|\+\|/g, '+');
    //console.log("transformedFormula:", transformedFormula)
    // Extract the literals from the transformed formula
    const literals = extractLiterals(formula);
    console.log("literals:",literals)
    const announcements = extractAnnouncements(formula);
    console.log("announcements:",announcements)
    // Evaluate each literal to determine its truth value
    const evaluations = literals.map(literal => evaluateLiteral(literal, announcements));
    console.log("evaluation:",evaluations)
    // Substitute the truth values into the formula
    const substitutedFormulaString = substituteLiteralsWithValues(formula, literals, evaluations);
    console.log("substitutedFormulaString:",substitutedFormulaString)

    const tokensForParsing = tokenizeFormula(substitutedFormulaString);
    console.log("Tokens for parsing:", tokensForParsing);

function getNextToken(subtokens) {
    if (subtokens.length === 0) {
        throw new Error("Unexpected end of formula.");
    }
    return subtokens.shift();
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






  // Expected output: (([a:p][c:r]Bbr&[a:p][c:r]~Bcq) + [a:p][b:q]Bcr)
  // Should output: (([a:p][c:r]Bbr&[a:p][c:r]~Bcq) + [a:p][b:q]Bcr)



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


function includesSet(set, subset) {
    return subset.every(element => set.includes(element));
}


function includesArray(bigArray, smallArray) {
    return bigArray.some(arr => JSON.stringify(arr) === JSON.stringify(smallArray));
}



function setIntersection(setA, setB) {
    // Convert each set to a string to perform comparison
    const setAStr = setA.map(subset => subset.sort().join(','));
    const setBStr = setB.map(subset => subset.sort().join(','));
    
    // Filter set A to only include elements that are also in set B
    const intersection = setAStr.filter(subsetA => setBStr.includes(subsetA));
    
    // Convert the string representation back to a set
    return intersection.map(subset => subset.split(',').filter(Boolean));
}

function getApplicableAnnouncements(literal, announcements, formula) {
    console.log(`getApplicableAnnouncements called with literal: ${literal}, announcements:`, announcements, `formula: ${formula}`);
    let applicableAnnouncements = [];
    let literalIndices = getIndicesOf(literal, formula); // Get all indices of the literal in the formula
    console.log(`Literal indices in formula:`, literalIndices);

    // Iterate over each occurrence of the literal
    literalIndices.forEach(literalIndex => {
        console.log(`Checking literal at index ${literalIndex}`);
        // Iterate over the announcements in reverse order (starting from the most recent)
        for (let i = announcements.length - 1; i >= 0; i--) {
            const announcement = announcements[i];
            console.log(`Checking against announcement:`, announcement);
            // Check if the literal is within the scope of the announcement
            if (isLiteralInScopeOfAnnouncement(literalIndex, announcement, formula)) {
                console.log(`Announcement is applicable for literal at index ${literalIndex}:`, announcement);
                applicableAnnouncements.push(announcement);
                // Do not break here; we need to check for all applicable announcements
            }
        }
    });

    console.log(`Applicable announcements found:`, applicableAnnouncements);
    return applicableAnnouncements;
}
function isLiteralInScopeOfAnnouncement(literalIndex, announcement, formula) {
    // The announcement string should be a unique identifier for the announcement in the formula
    const announcementString = `[${announcement.agent}:${announcement.proposition}]`;
    const announcementIndices = getIndicesOf(announcementString, formula);

    console.log(`Checking literal at index ${literalIndex} against announcement '${announcementString}' with indices:`, announcementIndices);

    // Check each occurrence of the announcement
    for (let i = 0; i < announcementIndices.length; i++) {
        const announcementIndex = announcementIndices[i];
        const closingBracketIndex = findClosingBracketIndex(formula, announcementIndex);

        console.log(`Announcement at index ${announcementIndex} has closing bracket at index ${closingBracketIndex}`);

        // If the literal is within the announcement's brackets or exactly at the closing bracket, it's in scope
        if (literalIndex >= announcementIndex && literalIndex <= closingBracketIndex + 1) {
            console.log(`Literal is in scope of announcement at index ${announcementIndex}`);
            return true;
        }
    }

    console.log(`Literal at index ${literalIndex} is not in scope of any occurrences of announcement '${announcementString}'`);
    // If no scope is found for the literal, it's not in scope
    return false;
}




// Helper function to find the index of the closing bracket for the given opening bracket
function findClosingBracketIndex(formula, openingIndex) {
    let depth = 1;
    for (let i = openingIndex + 1; i < formula.length; i++) {
        if (formula[i] === '[') {
            depth++;
        } else if (formula[i] === ']') {
            depth--;
            if (depth === 0) {
                return i;
            }
        }
    }
    // If no closing bracket is found, return the length of the formula
    return formula.length;
}



// Helper function to get all indices of a substring in a string
function getIndicesOf(searchStr, str) {
    let searchStrLen = searchStr.length;
    if (searchStrLen === 0) {
        return [];
    }
    let startIndex = 0, index, indices = [];

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}
function literalScope(input) {
    const scopeStack = [[]]; // Stack to manage scopes
    const scopes = {}; // Object to hold the scopes and their literals

    // Helper function to add literals to the current scope
    function addLiteral(literal) {
        const currentScope = scopeStack[scopeStack.length - 1];
        currentScope.push(literal);
    }

    // Helper function to open a new scope
    function openScope() {
        scopeStack.push([...scopeStack[scopeStack.length - 1]]); // Copy the current scope
    }

    // Helper function to close the current scope and save it if necessary
    function closeScope(scopeName) {
        const closedScope = scopeStack.pop();
        if (scopeName && closedScope.length > 0) {
            if (!scopes[scopeName]) {
                scopes[scopeName] = [];
            }
            scopes[scopeName].push(closedScope);
        }
    }

    let i = 0;
    while (i < input.length) {
        const char = input[i];

        if (char === '[') {
            // Literal found, extract it and add to the current scope
            const endLiteral = input.indexOf(']', i);
            const literal = input.slice(i, endLiteral + 1);
            addLiteral(literal);
            i = endLiteral;
        } else if (char === '(') {
            // Open a new scope
            openScope();
        } else if (char === ')') {
            // Close scope without saving
            closeScope();
        } else if (char === 'B' && i + 1 < input.length && /[a-z]/.test(input[i + 1])) {
            // Scope identifier found, close the current scope and save it with the identifier
            const scopeName = char + input[i + 1];
            i++; // Skip the scope identifier character
            // Close the scope after incrementing i to include the scope identifier in the name
            closeScope(scopeName);
        }

        i++; // Move to the next character
    }

    // At the end, close any remaining open scopes
    while (scopeStack.length > 1) {
        closeScope();
    }

    // Convert the arrays of literals to strings
    for (const scope in scopes) {
        scopes[scope] = scopes[scope].map(literals => literals.join(''));
    }

    return scopes;
}

  // Test the function with the provided examples
  console.log(JSON.stringify(literalScope('[a:p]Bbp'))); 
  // Expected output: { Bbp: [['[a:p]']] }
  console.log(JSON.stringify(literalScope('[a:p][b:(p>q)]Bcq'))); 
  // Expected output: { Bcq: [['[a:p]', '[b:(p>q)]']] }
  console.log(JSON.stringify(literalScope('[b:q][a:p]([b:(p>q)]Bcq & Bcq)'))); 
  // Expected output: { Bcq: [['[b:q]', '[a:p]', '[b:(p>q)]'], ['[b:q]', '[a:p]']] }
  console.log(JSON.stringify(literalScope('[a:p]([b:(p>q)]Bcq &[a:q](Bcq +[c:q]Baq))'))); 
  // Expected output: { Bcq: [['[a:p]', '[b:(p>q)]'], ['[a:p]', '[a:q]']], Baq: [['[a:p]', '[a:q]', '[c:q]']] }


  
function getApplicableAnnouncements(literal, announcements, formulaString) {
    const scopes = literalScope(formulaString);
    const agentLiteral = literal.slice(0, 2);

    return announcements.filter(announcement => {
        const announcementScope = scopes[agentLiteral];
        // Ensure that announcementScope is an array before calling includes
        return Array.isArray(announcementScope) && announcementScope.includes(literal);
    });
}


function announcementScope(formula) {
    // Recursive function to handle the scope parsing
    function parseScope(segment) {
      let stack = [];
      let currentScope = stack;
      let token = '';
  
      for (let i = 0; i < segment.length; i++) {
        let char = segment[i];
  
        if (char === '[') {
          // When we find an announcement, we push a new scope onto the stack
          if (token) {
            currentScope.push(token);
            token = '';
          }
          let scope = [];
          currentScope.push({ [segment.slice(i, segment.indexOf(']', i) + 1)]: scope });
          currentScope = scope;
          i = segment.indexOf(']', i);
        } else if (char === ']') {
          // When we find a closing bracket, we pop the current scope from the stack
          if (token) {
            currentScope.push(token);
            token = '';
          }
          currentScope = stack;
        } else if (char === '&') {
          // Handle conjunctions by pushing the current token to the scope
          if (token) {
            currentScope.push(token);
            token = '';
          }
          // Skip the '&' and any whitespace following it
          while (segment[i + 1] === ' ') {
            i++;
          }
        } else if (char !== ' ') {
          // Accumulate tokens for literals
          token += char;
        }
      }
  
      if (token) {
        currentScope.push(token);
      }
  
      return stack;
    }
  
    return parseScope(formula);
  }
  
  // Test the function with the provided examples
  console.log(JSON.stringify(announcementScope('[a:p]Bbp')));
  // Expected output: [{"[a:p]":["Bbp"]}]
  
  console.log(JSON.stringify(announcementScope('[a:p][b:(p>q)]Bcq')));
  // Expected output: [{"[a:p]":[{"[b:(p>q)]":["Bcq"]}]}]
  
  console.log(JSON.stringify(announcementScope('[b:q][a:p]([b:(p>q)]Bcq & Bcq)')));
  // Expected output: [{"[b:q]":[{"[a:p]":[{"[b:(p>q)]":["Bcq"]},"Bcq"]}]}]


  function extractAnnouncements(formula) {
    // This regex matches the pattern [a:θ] where 'a' is a single character agent identifier
    // and 'θ' is a proposition which may include logical operators and other agents' beliefs.
    const announcementRegex = /\[([a-z]):([^\]]+)\]/gi;
    let match;
    let announcements = [];

    while ((match = announcementRegex.exec(formula)) !== null) {
        announcements.push({
            agent: match[1],
            proposition: match[2]
        });
    }

    return announcements;

}
*/