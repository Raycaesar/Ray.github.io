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
    console.log("Retrieved announcement:", announcement); // Check the retrieved value

    if (typeof announcement !== 'string' || announcement.trim() === '') {
        console.error("Invalid input: Announcement must be a string and cannot be empty.");
        return;
    }

    updatedmodels(announcement);

}




/*
For checking the functions above

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


function evaluateLiteral(message, agent) {
    console.log("agent:", agent);
    console.log("message:", message);
    

    // Assuming replaceWithDenotation returns a set of worlds where the message is true.
    const parsedMessage = parse(tokenize(message));
    console.log("parsedMessage:", parsedMessage);

    const messageDenotation = replaceWithDenotation(parsedMessage);
    console.log("messageDenotation:", messageDenotation);

    // Convert the denotation string into a set of worlds.
    let messageWorlds = parseSet(messageDenotation);
    console.log("messageWorlds:", messageWorlds);

    // Start with the agent's belief worlds.
    let agentBeliefWorlds = parseSet(agentBeliefs[agent].denotation);
    console.log("agentBeliefWorlds:", agentBeliefWorlds);
     
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




/*for verification: 
f(a) = {b, c}
f(b) = {c}
f(c) = {a}

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

(Ba~(p>q)&(Bb(r>~q)+Bc(p+~r))) unsatisfied
(F&(F+F))

~(Ba(r>p)&~(Bb~q+~Bc(p+~r))) satisfied
~(T&~(F+~F))

[a:r]([a:p]Bbp&Bcp)  unsatisfied
(T&F)

[b:q](~Ba~q&Bcq)      satisfied
(~F&T)

[b:q]([a:(p&q)]Baq+Bcp)   unsatisfied
(F+F)

[a:(r>q)]([b:(q>p)]Bcp & [c:q](~Bcp&Baq))   satisfied
(T & (~F&T))


[a:(~r+~q)]([b:~~q]([c:~q]Ba~(q+~p)& Bc(p&~r))&[a:r]Bb(~q&r))  satisfied
((T&T)&T)

[a:~q](Bc(q&r)+~Bb(p&~p))  unsatisfied
(F+F)

[c:(q>r)](Bar+[a:~q](Bb(q>~q)&[b:q]Bc(p&~p))) satisfied
(F + (T & T))


[a:q](Bbq>Bcp)  unsatisfied
(T>F)


([a:q](Bbq>Bcp) > ([a:q]Bbq>[a:q]Bcp)) satisfied, axiom [K[:]] 


([a:p]Bbq > Bb(p > q))  satisfied, [SDMon] 

([a:r]~Bbr > ([a:p]Bbq> Bbq)) satisfied, [RDMon] p,q,r can be can be unification substituted by any boolean expression.
*/


