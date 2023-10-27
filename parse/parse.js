

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

function tokenize(message) {
    return message.match(/~|\+|&|>|[a-z]_[0-9]+|[a-z]|[\(\)]/g);
}


function parse(tokens) {
    if (tokens.length === 0) throw new Error("Unexpected end of input");

    const token = tokens.shift();

    switch (token) {
        case '~':
            return { type: 'negation', submessage: parse(tokens) };
        case '(':
            const left = parse(tokens);

            if (!tokens.length) throw new Error("Expected an operator after opening parenthesis");

            const operator = tokens.shift();
            if (['&', '+', '>'].indexOf(operator) === -1) throw new Error(`Unexpected operator: ${operator}`);

            const right = parse(tokens);
            
            if (tokens[0] !== ')') throw new Error("Expected a closing bracket");
            tokens.shift();

            return { type: operator, left, right };
        default:
            if (/^[a-z](?:[a-z]|[A-Z])?$/.test(token)) { // This regex matches one or two-letter combinations like 'Ba', 'p', etc.
                return { type: 'atom', value: token };
            } else {
                throw new Error(`Unexpected token: ${token}`);
            }
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

function replaceWithDenotation(parsedmessage) {
    console.log("replaceWithDenotation called with:", parsedmessage);
    if (!parsedmessage) throw new Error("Invalid or non-well-formed message.");

    switch (parsedmessage.type) {
        case 'atom':
            const denotation = atomDenotation(parsedmessage.value);
            if (denotation.length === 0) return '{}';
            return `{{${denotation.map(set => set.join(', ')).join('}, {')}}}`;
            
        case 'negation':
            const innerDenotation = replaceWithDenotation(parsedmessage.submessage);
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
            const leftDenotation = replaceWithDenotation(parsedmessage.left);
            const rightDenotation = replaceWithDenotation(parsedmessage.right);

            if (leftDenotation.startsWith("{{") && leftDenotation.endsWith("}}") &&
                rightDenotation.startsWith("{{") && rightDenotation.endsWith("}}")) {
                
                let setA = leftDenotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
                let setB = rightDenotation.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));

                let resultSet;
                if (parsedmessage.type === '&') {
                    resultSet = setIntersection(setA, setB);
                } else { // '+'
                    resultSet = setUnion(setA, setB);
                }
                
                if (resultSet.length === 0) return '{}'; // Return {} if the result set is empty
                return `{{${resultSet.map(set => set.join(', ')).join('}, {')}}}`;
            }

            return `(${leftDenotation} ${parsedmessage.type} ${rightDenotation})`;

        case '>':
            const notLeft = {
                type: 'negation',
                submessage: parsedmessage.left
            };
            const orRight = {
                type: '+',
                left: notLeft,
                right: parsedmessage.right
            };
            return replaceWithDenotation(orRight);

        default:
            throw new Error("Invalid or non-well-formed message.");
    }
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
        const parsed = parse(tokenize(message));
        const denotationResult = replaceWithDenotation(parsed);

        // Check if the agent already has beliefs
        if (agentBeliefs[selectedAgent]) {
            // Append new message to the beliefs
            agentBeliefs[selectedAgent].messages.push(message);
            
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

function setIntersection(setA, setB) {
    return setA.filter(subsetA => setB.some(subsetB => arraysAreEqual(subsetA, subsetB)));
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



function isSubsetOf(subset, superset) {
    return subset.every(element => superset.includes(element));
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

function tokenizeFormula(formula) {
    if (typeof formula !== "string") {
        throw new TypeError("Formula must be a string.");
    }

    return formula.match(/B[a-z]|~|&|\+|>|[a-z]_[0-9]+|[a-z]|[\(\)]/g);
}

function getNextToken(subtokens) {
    if (subtokens.length === 0) {
        throw new Error("Unexpected end of formula.");
    }
    return subtokens.shift();
}
// ================================================
// =============== Evalutate Formula ==============
// ================================================

function parseFormula(subtokens) {
    if (subtokens.length === 0) {
        throw new Error("Unexpected end of formula");
    }

    let token = subtokens.shift();

    if (token === '(') {
        console.log("Encountered open parenthesis. Starting extraction...");

        let subFormula = [];
        let bracketCount = 1;

        while (subtokens.length > 0 && bracketCount > 0) {
            let nextToken = subtokens.shift();
            console.log("Current token:", nextToken, "Subtokens:", subtokens, "SubFormula:", subFormula, "BracketCount:", bracketCount);

            if (nextToken === '(') {
                bracketCount++;
                console.log("Encountered open parenthesis. Incrementing bracketCount...");
            } else if (nextToken === ')') {
                bracketCount--;
                console.log("Encountered close parenthesis. Decrementing bracketCount...");
            }

            if (bracketCount !== 0) {
                subFormula.push(nextToken);
            }
        }

        if (bracketCount !== 0) {
            throw new Error("Mismatched parentheses");
        }

      // After extracting a subformula, we parse it again to identify the connectors and operands
      let splitPoint;
      if ((splitPoint = subFormula.indexOf('&')) !== -1) {
          let leftFormula = subFormula.slice(0, splitPoint);
          let rightFormula = subFormula.slice(splitPoint + 1);

          return {
              type: 'and',
              left: parseFormula(leftFormula),
              right: parseFormula(rightFormula)
          };
      } else if ((splitPoint = subFormula.indexOf('+')) !== -1) {
          let leftFormula = subFormula.slice(0, splitPoint);
          let rightFormula = subFormula.slice(splitPoint + 1);

          return {
              type: 'or',
              left: parseFormula(leftFormula),
              right: parseFormula(rightFormula)
          };
      } else {
          // If no operator is found, parse the subformula directly
          return parseFormula(subFormula);
      }

  } else if (token.startsWith('B')) {
      let agent = token[1];
      let proposition = subtokens.join("");
      return { type: "belief_atom", agent: agent, proposition: proposition };

  } else if (token === '~') {
      let negatedFormula = parseFormula(subtokens);
      return { type: "not", element: negatedFormula };
  }

  throw new Error(`Unexpected token: ${token}`);
}


        

function checkSatisfiability(parsedFormula) {
    switch(parsedFormula.type) {
        case "belief_atom":
    const agent = parsedFormula.agent;
    const proposition = parsedFormula.proposition;

    if (!agentBeliefs[agent]) {
        console.error(`Agent '${agent}' does not have any assigned beliefs.`);
        return false; 
    }
    
    const agentBeliefWorlds = parseDenotationString(agentBeliefs[agent].denotation);
    console.log(`Full beliefs object for agent ${agent}:`, agentBeliefs[agent]);
    console.log("agentBeliefWorlds:", agentBeliefWorlds);

    // Check if the proposition is already parsed
    const parsedmessage = (typeof proposition === "string") 
        ? parse(tokenize(proposition)) 
        : proposition;
        
    const propositionDenotation = replaceWithDenotation(parsedmessage);
    const parsedpropositionDenotation = parseDenotationString(propositionDenotation);
    console.log("propositionDenotation:", propositionDenotation);
    console.log("parsedpropositionDenotation:", parsedpropositionDenotation);
    
    return agentBeliefWorlds.every(world => includesArray(parsedpropositionDenotation, world));
            
        case "not":
            return !checkSatisfiability(parsedFormula.element);

        case "and":
            return checkSatisfiability(parsedFormula.left) && checkSatisfiability(parsedFormula.right);

        case "or":
            return checkSatisfiability(parsedFormula.left) || checkSatisfiability(parsedFormula.right);

        case "announcement":
           
            return true;

        default:
            
            return false;
    }
}


function satisfiability() {
    const formula = document.getElementById("formulaInput").value.trim();
    const subtokens = tokenizeFormula(formula); 
    const parsedFormula = parseFormula(subtokens); 
    console.log(parsedFormula)
    
    const satResult = checkSatisfiability(parsedFormula);

    document.getElementById("satisfaction").innerText = satResult ? "The formula is satisfiable." : "The formula is not satisfiable.";
}





