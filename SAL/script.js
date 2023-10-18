let f = {}; // Function f
let k = {}; // Function k
let Prop = []; // Global Prop variable

function generateProp() {
    const count = parseInt(document.getElementById('variableCount').value);

    if (count < 4) {
        Prop = ['p', 'q', 'r'];
    } else {
        for (let i = 1; i <= count; i++) {
            Prop.push(`p_${i}`);
        }
    }

    document.getElementById('result').textContent = `Prop = { ${Prop.join(', ')} }`;
}

function generateAgt() {
    const count = parseInt(document.getElementById('agentCount').value);
    let agt = [];

    if (count < 4) {
        agt = ['a', 'b', 'c'];
    } else {
        for (let i = 1; i <= count; i++) {
            agt.push(`a_${i}`);
        }
    }

    document.getElementById('agentResult').textContent = `Agt = { ${agt.join(', ')} }`;

    populateDropdown('chosenAgent', agt);
    populateDropdown('agentSelect', agt);
}

function populateDropdown(dropdownId, options) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.innerHTML = ''; // Clear existing options

    for (let optionValue of options) {
        const option = document.createElement('option');
        option.value = optionValue;
        option.textContent = optionValue;
        dropdown.appendChild(option);
    }
}

function showFollowersOptions() {
    const chosenAgent = document.getElementById('chosenAgent').value;
    const allAgents = Array.from(document.getElementById('chosenAgent').options).map(opt => opt.value);
    populateDropdown('followers', allAgents);
    document.getElementById('followersDiv').style.display = 'block';
}

function addToModel() {
    const chosenAgent = document.getElementById('chosenAgent').value;
    const followersOptions = document.getElementById('followers').options;
    let selectedFollowers = [];

    for (let option of followersOptions) {
        if (option.selected) {
            selectedFollowers.push(option.value);
        }
    }

    f[chosenAgent] = selectedFollowers;
    displayCurrentF();
}

function displayCurrentF() {
    let currentFText = 'Current f: ';
    for (let agent in f) {
        currentFText += `f(${agent}) = { ${f[agent].join(', ')} }, `;
    }
    document.getElementById('currentF').textContent = currentFText.slice(0, -2); // Remove trailing comma and space
}

function displayModel() {
    let modelText = 'Model m = (f, k) where ';
    for (let agent in f) {
        modelText += `f(${agent}) = { ${f[agent].join(', ')} }, `;
    }
    document.getElementById('modelResult').textContent = modelText.slice(0, -2); // Remove trailing comma and space
}

function powerSet(array) {
    return array.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
}

function difference(setA, setB) {
    const setBStringified = setB.map(subset => JSON.stringify(subset));
    return setA.filter(x => !setBStringified.includes(JSON.stringify(x)));
}

function intersection(setA, setB) {
    return setA.filter(subsetA => setB.some(subsetB => arraysEqual(subsetA, subsetB)));
}

function union(setA, setB) {
    const combined = [...setA, ...setB];
    const uniqueSets = new Set(combined.map(JSON.stringify));
    return Array.from(uniqueSets).map(JSON.parse);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// ... [rest of the code]

function tokenize(formula) {
    const tokens = [];
    let currentToken = '';
    let i = 0;

    while (i < formula.length) {
        const char = formula[i];
        if (['~', '&', '+', '(', ')', '>'].includes(char)) {
            if (currentToken) {
                tokens.push(currentToken.trim());
                currentToken = '';
            }
            tokens.push(char);
            i++;
        } else {
            currentToken += char;
            i++;
        }
    }
    if (currentToken) tokens.push(currentToken.trim());
    return tokens;
}

function addBelief() {
    const agent = document.getElementById('agentSelect').value;
    let formula = document.getElementById('formulaInput').value;

    if (!isValidFormula(formula)) {
        alert("Invalid formula!");
        return;
    }

    const formulaDenotation = denotation(formula);
    if (k[agent]) {
        k[agent] = intersection(k[agent], formulaDenotation);
    } else {
        k[agent] = formulaDenotation;
    }

    // If after the intersection, the belief set is empty, alert the user
    if (k[agent].length === 0) {
        alert(`${agent} now has no beliefs due to a contradiction.`);
    }

    // Append the agent's belief to the belief display
    const beliefDisplay = document.getElementById('beliefDisplay');
    beliefDisplay.innerHTML += `<p>${agent} believes ${formula}. k(${agent}) = { ${k[agent].map(set => `{${set.join(', ')}}`).join(', ')} }</p>`;

    // Clear the input for the next formula
    document.getElementById('formulaInput').value = '';
}



function parse(tokens) {
    if (tokens.length === 1) {
        return { type: 'atom', value: tokens[0] };
    }
    if (tokens[0] === '~') {
        if (tokens[1] === '(') {
            let depth = 1;
            let i = 2;
            while (depth > 0 && i < tokens.length) {
                if (tokens[i] === '(') depth++;
                if (tokens[i] === ')') depth--;
                i++;
            }
            return { type: 'negation', subformula: parse(tokens.slice(1, i)) };
        } else {
            return { type: 'negation', subformula: parse(tokens.slice(1)) };
        }
    }
    let depth = 0;
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === '(') depth++;
        if (tokens[i] === ')') depth--;
        if (depth === 0) {
            if (tokens[i] === '&') {
                return {
                    type: 'conjunction',
                    left: parse(tokens.slice(0, i)),
                    right: parse(tokens.slice(i + 1))
                };
            } else if (tokens[i] === '+') {
                return {
                    type: 'disjunction',
                    left: parse(tokens.slice(0, i)),
                    right: parse(tokens.slice(i + 1))
                };
            } else if (tokens[i] === '>') {
                return {
                    type: 'implication',
                    left: parse(tokens.slice(0, i)),
                    right: parse(tokens.slice(i + 1))
                };
            }
        }
    }
    return null;  // Invalid formula
}

function denotation(formula) {
    const parsedFormula = parse(tokenize(formula));
    if (!parsedFormula) return [];

    switch (parsedFormula.type) {
        case 'atom':
            return powerSet(Prop).filter(subset => subset.includes(parsedFormula.value));
        case 'negation':
            return difference(powerSet(Prop), denotation(parsedFormula.subformula.value));
        case 'conjunction':
            return intersection(denotation(parsedFormula.left.value), denotation(parsedFormula.right.value));
        case 'disjunction':
            return union(denotation(parsedFormula.left.value), denotation(parsedFormula.right.value));
        case 'implication':
            const notLeftDenotation = difference(powerSet(Prop), denotation(parsedFormula.left.value));
            const rightDenotation = denotation(parsedFormula.right.value);
            return union(notLeftDenotation, rightDenotation);
        default:
            return [];
    }
}












function isValidFormula(formula) {
    // Basic validation for now
    const validChars = new Set([...Prop.join(''), '~', '&', '+', '-', '>', '(', ')']);
    for (let char of formula) {
        if (!validChars.has(char)) {
            return false;
        }
    }
    return true;
}





function confirmBeliefs() {
    // Logic to finalize the beliefs for the chosen agent
    // For now, just display the beliefs
    let beliefText = "Beliefs (k):\n";
    for (let agent in k) {
        beliefText += `${agent}: { ${k[agent].map(set => `{${set.join(', ')}}`).join(', ')} }\n`;
    }
    alert(beliefText);
}

