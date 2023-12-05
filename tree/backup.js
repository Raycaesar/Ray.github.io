let formulaIndex = 0; // Global index to keep track of formula IDs

document.getElementById('generate-tableau').addEventListener('click', function() {
    const formulaInput = document.getElementById('formula-input').value;
    const tableauOutput = document.querySelector('.tableau-output');
    tableauOutput.innerHTML = ''; // Clear previous output

    const formulas = formulaInput.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
    let currentParent = tableauOutput; // Start with the main container

    formulas.forEach((formula) => {
        formulaIndex++; // Increment global formula index
        const trimmedFormula = formula.trim(); // Trim the formula
        const formulaDiv = document.createElement('div');
        formulaDiv.classList.add('formula');
        formulaDiv.textContent = trimmedFormula; // Use the trimmed formula
        formulaDiv.setAttribute('data-used', 'false'); // Track if the formula has been used
        formulaDiv.setAttribute('id', `formula-${formulaIndex}`); // Assign a unique ID

        formulaDiv.ondblclick = function(event) {
            event.stopPropagation();
            expandFormula(formulaDiv);
        };

        setupFormulaClick(formulaDiv);

        currentParent.appendChild(formulaDiv);
        currentParent = formulaDiv; // Set the current parent to the last added formula

        console.log(`Added formula: ${trimmedFormula}, ID: formula-${formulaIndex}`);
    });
});

function setupFormulaClick(formulaDiv) {
    formulaDiv.onclick = function(event) {
        event.stopPropagation(); // Prevents the document-wide click listener from being triggered
        clearStyles(); // Clear previous styles

        // Find children and leaves of the clicked formula
        const { offspring, leaves } = findOffspringAndLeaves(formulaDiv);

        // Highlight only the leaves
        leaves.forEach(leaf => leaf.classList.add('leaf'));

        // Log the text content of the clicked formula, excluding its children
        const clickedFormulaText = formulaDiv.childNodes[0].nodeValue.trim();
        console.log('Clicked formula:', clickedFormulaText);
        console.log('Offspring:', offspring.map(x => x.childNodes[0].nodeValue.trim()));
        console.log('Leaves:', leaves.map(leaf => leaf.childNodes[0].nodeValue.trim()));
    };
}


document.addEventListener('click', function(event) {
    if (!event.target.classList.contains('formula')) {
        clearStyles();
    }
});

function clearLeafHighlighting() {
    document.querySelectorAll('.leaf').forEach(node => {
        node.classList.remove('leaf');
    });
}

function clearStyles() {
    document.querySelectorAll('.formula').forEach(node => {
        node.classList.remove('bold', 'leaf');
    });
}

function findOffspringAndLeaves(node) {
    let offspring = Array.from(node.querySelectorAll('.formula'));
    let leaves;

    if (node.classList.contains('formula') && !node.querySelector('.formula')) {
        leaves = [node]; // The node itself is a leaf
        offspring = []; // No offspring since it's a leaf
    } else {
        leaves = offspring.filter(offspringNode => !offspringNode.querySelector('.formula'));
    }

    return { offspring, leaves };
}


function highlightLeaves() {
    // Clear existing leaf highlighting
    clearLeafHighlighting();

    // Dynamically find and highlight current leaf nodes
    const leaves = findLeafNodes(document.querySelector('.tableau-output'));
    leaves.forEach(leaf => leaf.classList.add('leaf'));
}


function expandFormula(formulaDiv) {
    // Ensure only the text of this formula is used
    const formulaText = formulaDiv.childNodes[0].nodeValue.trim();
    console.log('Expanding formula:', formulaText);
    
    const formulaType = getFormulaType(formulaText);

    if (formulaType === 'box arbitrary') {
        handleBoxArbitrary(formulaDiv);
    } else{
    const isUsed = formulaDiv.getAttribute('data-used') === 'true';

    if (isUsed) return;

    if (formulaType === 'diamond arbitrary') {
        handleDiamondArbitrary(formulaDiv);
    } else {

    if (['conjunction', 'diamond sincere', ].includes(formulaType)) {
        addVerticalChildren(formulaDiv);
    } else if (['belief with free announcement', 'negation with free announcement', 'box sincere', 'disjunction'].includes(formulaType)) {
        addBranchChildren(formulaDiv);
    }}

    formulaDiv.setAttribute('data-used', 'true');
    formulaDiv.ondblclick = null;
    formulaDiv.classList.add('expanded');
    updateLeaves();
}
}

function updateLeaves() {
    // Clear existing leaf highlighting
    clearLeafHighlighting();

    // Find and highlight new leaf nodes
    const leaves = findLeafNodes(document.querySelector('.tableau-output'));
    leaves.forEach(leaf => leaf.classList.add('leaf'));
}

function addBranchChildren(formulaDiv) {
    console.log('Adding branch children for formula:', formulaDiv);
    if (!formulaDiv) {
        console.error("Undefined formulaDiv in addBranchChildren");
        return;
    }

    let outputs;
    const formulaText = formulaDiv.childNodes[0].nodeValue.trim();
    const formulaType = getFormulaType(formulaText);

    switch (formulaType) {
        case 'belief with free announcement':
            outputs = updateBeliefWithFreeAnnouncement(formulaText);
            break;
        case 'negation with free announcement':
            outputs = updateNegationWithFreeAnnouncement(formulaText);
            break;
        case 'disjunction':
            outputs = updateDisjunction(formulaText);
            break;
        case 'box sincere':
            outputs = updateBoxSincere(formulaText);
            break;
        default:
            console.error('Unhandled formula type:', formulaType);
            return;
    }

    if (!outputs || !outputs.leftOutput || !outputs.rightOutput) {
        console.error('Outputs not defined for formula:', formulaText);
        return;
    }

    // Find the leaves of the clicked formula
    const { leaves } = findOffspringAndLeaves(formulaDiv);

    // Add the branch children to each leaf node
    leaves.forEach(leaf => {
        // Create containers for left and right branches
        const leftBranchContainer = document.createElement('div');
        leftBranchContainer.classList.add('left-branch');
        const rightBranchContainer = document.createElement('div');
        rightBranchContainer.classList.add('right-branch');

        // Create left and right branch elements
        const leftBranch = createChildNode(outputs.leftOutput, ++formulaIndex);
        const rightBranch = createChildNode(outputs.rightOutput, ++formulaIndex);

        // Append branches to their respective containers
        leftBranchContainer.appendChild(leftBranch);
        rightBranchContainer.appendChild(rightBranch);

        // If rightOutput1 exists, create and append it inside rightBranch
        if (outputs.rightOutput1) {
            const rightOutput1 = createChildNode(outputs.rightOutput1, ++formulaIndex);
            rightBranch.appendChild(rightOutput1);
        }

        // Create a container for both branches
        const branchesContainer = document.createElement('div');
        branchesContainer.classList.add('branches');
        branchesContainer.appendChild(leftBranchContainer);
        branchesContainer.appendChild(rightBranchContainer);

        // Append the branches container to the leaf
        leaf.appendChild(branchesContainer);
    });

    // Update leaf highlighting
    highlightLeaves();
}



function addVerticalChildren(formulaDiv) {
    let outputs;
    const formulaText = formulaDiv.childNodes[0].nodeValue.trim();
    const formulaType = getFormulaType(formulaText);

    switch (formulaType) {
        case 'conjunction':
            outputs = updateConjunction(formulaText);
            break;
        case 'diamond sincere':
            outputs = updateDiamondSincere(formulaText);
            break;
        case 'diamond arbitrary':
            outputs = updateDiamondArbitrary(formulaText);
            break;
        case 'box arbitrary':
            outputs = updateBoxArbitrary(formulaText);
            break;
    }

    if (!outputs) {
        console.error('Outputs not defined for formula:', formulaText);
        return;
    }

    let leafNodes = findOffspringAndLeaves(formulaDiv).leaves;
    let formulaIndex = parseInt(formulaDiv.getAttribute('id').split('-')[1]);

    leafNodes.forEach(leafNode => {
        if (outputs.vertical) {
            const verticalChild = createChildNode(outputs.vertical, ++formulaIndex);
            leafNode.appendChild(verticalChild);

            if (outputs.vertical1) {
                const verticalChild1 = createChildNode(outputs.vertical1, ++formulaIndex);
                verticalChild.appendChild(verticalChild1);
            }
        }
    });
}



function findLeafNodes(node) {
    let leaves = [];
    if (!node) return leaves;

    // Define the logic to find leaf nodes
    // Example: If a node has no children, it's a leaf
    if (node.children.length === 0) {
        leaves.push(node);
    } else {
        Array.from(node.children).forEach(child => {
            leaves.push(...findLeafNodes(child));
        });
    }

    return leaves;
}
 
function createChildNode(text, index) {
    const childNode = document.createElement('div');
    childNode.classList.add('formula'); // Use the same class as other formulas
    childNode.textContent = text;
    childNode.setAttribute('data-used', 'false');
    childNode.setAttribute('id', `formula-${index}`);
    childNode.ondblclick = function(event) {
        event.stopPropagation();
        expandFormula(childNode);
    };

    setupFormulaClick(childNode);

    console.log(`Added new formula: ${text}, ID: formula-${index}`);
    return childNode;
}





function tokenizeFormula(formula) {
    if (typeof formula !== 'string') {
        throw new TypeError('Formula must be a string.');
    }

    // Updated pattern to include all tokens
    const pattern = /<[^>]+>|\[[^\]]+\]|~B[a-z]_[0-9]+|~B[a-z]|B[a-z]_[0-9]+|B[a-z]|\+|&|\(|\)|[a-z]_[0-9]+|[a-z]/g;
    return formula.match(pattern);
}

function getFormulaType(formula) {
    // Atomic belief and atomic negation
    if (/^B[a-z]/.test(formula)) {
        return 'atomic belief';
    } else if (/^~B[a-z]/.test(formula)) {
        return 'atomic negation';
    }

// Belief and negation with free announcement
if (/\[[a-z]:[^\]]+\](B[a-z]|~B[a-z])/.test(formula)) {
    const remainingFormula = formula.replace(/\[[a-z]:[^\]]+\]/g, '');
    if (/^B[a-z]/.test(remainingFormula)) {
        return 'belief with free announcement';
    } else if (/^~B[a-z]/.test(remainingFormula)) {
        return 'negation with free announcement';
    }
}


    // Removing free announcements for further analysis
    const formulaWithoutFreeAnnouncements = formula.replace(/\[[a-z]:[^\]]+\]/g, '');

    // Checking the first character after removing free announcements
    const firstChar = formulaWithoutFreeAnnouncements[0];

    if (firstChar === '<') {
        // Diamond cases
        return formulaWithoutFreeAnnouncements[3] === '>'|| (formulaWithoutFreeAnnouncements[4] === '!' && formulaWithoutFreeAnnouncements[5] === '>') ? 'diamond arbitrary' : 'diamond sincere';
    } else if (firstChar === '[') {
        // Box cases
        return formulaWithoutFreeAnnouncements[3] === ']'|| (formulaWithoutFreeAnnouncements[4] === '!' && formulaWithoutFreeAnnouncements[5] === ']') ? 'box arbitrary' : 'box sincere';
    } else if (firstChar === '(') {
        // Conjunction or disjunction, need to consider depth
        let depth = 0;
        for (let i = 0; i < formulaWithoutFreeAnnouncements.length; i++) {
            const char = formulaWithoutFreeAnnouncements[i];
            if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
            } else if (depth === 1 && char === '&') {
                return 'conjunction';
            } else if (depth === 1 && char === '+') {
                return 'disjunction';
            }
        }
    }

    throw new Error('Unknown formula type: ' + formula);
}



function updateBeliefWithFreeAnnouncement(formula) {
    // Extract all announcements
    const announcements = formula.match(/\[[a-z]:[^\]]+\]/g) || [];
    
    // Separate the last announcement and prefix announcements
    const lastAnnouncement = announcements.pop();
    const prefixAnnouncements = announcements.join('');

    // Extract the belief part of the formula
    const beliefPart = formula.replace(/\[[a-z]:[^\]]+\]/g, '');
    if(beliefPart){

    // Extract announcer and message from the last announcement
    const announcer = lastAnnouncement[1];
    const message = lastAnnouncement.slice(3, -1);

    // Extract the receiver from the belief part
    const receiver = beliefPart[1];

    // Generate left and right parts of the tableau
    const leftOutput = prefixAnnouncements + beliefPart;
    const rightOutput = prefixAnnouncements + 'B' + receiver + '(' + message + '>' + beliefPart.slice(2) + ')';
    const rightOutput1 = receiver + 'F' + announcer;

    console.log('Left:', leftOutput);
    console.log('Right:', rightOutput);
    console.log('Right1:', rightOutput1);
    return {leftOutput, rightOutput, rightOutput1};
} else {
    throw new Error('Invalid Belief With Free Announcement format: ' + formula);
}
}



function updateNegationWithFreeAnnouncement(formula) {
    // Extract all announcements
    const announcements = formula.match(/\[[a-z]:[^\]]+\]/g) || [];
    
    // Separate the last announcement and prefix announcements
    const lastAnnouncement = announcements.pop();
    const prefixAnnouncements = announcements.join('');

    // Extract the negation and belief part of the formula
    const negationPart = formula.replace(/\[[a-z]:[^\]]+\]/g, '');
    if(negationPart){
    // Extract announcer and message from the last announcement
    const announcer = lastAnnouncement[1];
    const message = lastAnnouncement.slice(3, -1);

    // Generate left and right parts of the tableau
    const leftOutput = prefixAnnouncements + '~B' + negationPart[2] + '(' + message + '>' + negationPart.slice(3) + ')';
    const rightOutput = prefixAnnouncements + negationPart;
    const rightOutput1 = ' ~' + negationPart[2] + 'F' + announcer;

    console.log('Left:', leftOutput);
    console.log('Right:', rightOutput);
    console.log('Right1:', rightOutput1);
    return { leftOutput, rightOutput, rightOutput1};
} else {
    throw new Error('Invalid Negation With Free Announcement format: ' + formula);
}
}



function updateConjunction(formula) {
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    //console.log('prefixAnnouncements', prefixAnnouncements);

    // Extract the conjunction part of the formula
    const conjunctionPart = formula.replace(prefixAnnouncements, '');
    //console.log('conjunctionPart', conjunctionPart);

    const conjunction = conjunctionPart.slice(1, -1);
    //console.log('conjunction ', conjunction);
    if(conjunction){
    // Find the main conjunction within the brackets
    let depth = 0;
    let splitIndex = -1;
    for (let i = 0; i < conjunction.length; i++) {
        const char = conjunction[i];
        if (char === '(') {
            depth++;
        } else if (char === ')') {
            depth--;
        } else if (depth === 0 && char === '&') {
            splitIndex = i;
            break;
        }
    }

    if (splitIndex !== -1) {
        const conjunct = [conjunction.slice(0, splitIndex), conjunction.slice(splitIndex + 1)];
        const vertical = prefixAnnouncements + conjunct[0].trim();
        const vertical1 = prefixAnnouncements + conjunct[1].trim();
        console.log('vertical:', vertical, 'vertical1:', vertical1);

        return { vertical, vertical1 }; // Ensure this is the returned object
    } else {
        throw new Error('No main conjunction found: ' + formula);
    }
}
}



function updateDisjunction(formula) {
     // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log('prefixAnnouncements', prefixAnnouncements);
 
     // Extract the conjunction part of the formula
     const disjunctionPart = formula.replace(prefixAnnouncements, '');
     //console.log('disjunctionPart', disjunctionPart);
 
     const disjunction = disjunctionPart.slice(1, -1);
     //console.log('disjunction ', disjunction);
 if(disjunction){
     // Find the main conjunction within the brackets
     let depth = 0;
     let splitIndex = -1;
     for (let i = 0; i < disjunction.length; i++) {
         const char = disjunction[i];
         if (char === '(') {
             depth++;
         } else if (char === ')') {
             depth--;
         } else if (depth === 0 && char === '+') {
             splitIndex = i;
             break;
         }
     }
 
     if (splitIndex !== -1) {
         const disjunct = [disjunction.slice(0, splitIndex), disjunction.slice(splitIndex + 1)];
         const leftOutput = prefixAnnouncements + disjunct[0].trim();
         const rightOutput = prefixAnnouncements + disjunct[1].trim();
         console.log('Left:', leftOutput);
         console.log('Right:', rightOutput);
         return {leftOutput, rightOutput};
     }  
    } else {
         throw new Error('No main disjunction found: ' + formula);
     }
}



function updateDiamondSincere(formula) {
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log('prefixAnnouncements', prefixAnnouncements);

    // Assuming the formula structure is like <a!p>φ or [prefix]<a!p>φ
    const sincereAnnouncementMatch = formula.match(/<([a-z])!(?:[^>]*\([^>]*>[^)]*\))*[^>]*>/);
// Explanation of the regular expression:
// - `<`: Match the opening angle bracket literally.
// - `([a-z])`: Capture a single lowercase letter (the agent).
// - `!`: Match the exclamation mark literally.
// - `(?: ... )`: Group of expressions (non-capturing) for the message.
// - `[^>]*`: Match any characters that are not `>`. Zero or more occurrences.
// - `\(`: Match the opening parenthesis `(`.
// - `[^>]*`: Match characters that are not `>` but not inside parentheses.
// - `>`: Match the closing angle bracket `>` literally.
// I am not sure if this is correct, GPT suggests this part. I keep its comments.

    console.log("sincereAnnouncementMatch:", sincereAnnouncementMatch);

    if (sincereAnnouncementMatch) {
        const agent = sincereAnnouncementMatch[1];
        console.log("agent:", agent)
        const message = sincereAnnouncementMatch[0].slice(3, -1);
        console.log("message:", message)

        // Calculate the start index of the formula part after the sincere announcement
        const startIndexAfterAnnouncement = formula.indexOf(sincereAnnouncementMatch[0]) + sincereAnnouncementMatch[0].length;
        const remainingFormula = formula.slice(startIndexAfterAnnouncement);

        // Construct the vertical formulas
        const vertical = prefixAnnouncements + "B" + agent + message;
        const vertical1 = prefixAnnouncements + "["+ agent + ":" + message + "]" + remainingFormula.trim();
        console.log('vertical:', vertical, vertical1);

     return {vertical, vertical1};
    }else {
        throw new Error('Invalid sincere Announcement format: ' + formula);
    }
}

function updateBoxSincere(formula) {
    // Existing logic to calculate leftOutput and rightOutput
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';

    const sincerebox = formula.match(/\[[a-z]![^\]]+\]/);

    if (sincerebox) {
        const agent = sincerebox[0][1];
        const message = sincerebox[0].slice(3, -1);

        const startIndexAfterAnnouncement = formula.indexOf(sincerebox[0]) + sincerebox[0].length;
        const remainingFormula = formula.slice(startIndexAfterAnnouncement);

        const leftOutput = prefixAnnouncements + "~B" + agent + message;
        const rightOutput = prefixAnnouncements + "[" + agent + ":" + message + "]" + remainingFormula.trim();

        // Return an object with leftOutput and rightOutput
        return {leftOutput, rightOutput};
    } else {
        throw new Error('Invalid box sincere format: ' + formula);
    }
}


function handleDiamondArbitrary(formulaDiv) {
    const formulaText = formulaDiv.childNodes[0].nodeValue.trim();
    const variable = promptForUniqueVariable(formulaDiv);
    if (variable) {
        const newFormulaObject = updateDiamondArbitrary(formulaText, variable);
        if (newFormulaObject && newFormulaObject.vertical) {
            const leafNodes = findOffspringAndLeaves(formulaDiv).leaves;
            let formulaIndex = parseInt(formulaDiv.getAttribute('id').split('-')[1]);

            leafNodes.forEach(leafNode => {
                const newChildNode = createChildNode(newFormulaObject.vertical, ++formulaIndex); 
                leafNode.appendChild(newChildNode);
            });
        } else {
            console.error('Error updating Diamond Arbitrary formula');
        }
    }
}



function promptForUniqueVariable(formulaDiv) {
    let variable;
    do {
        variable = prompt("Enter a unique variable (suggested: x, y, z, u, v, w):");
    } while (variableExistsInTableau(variable, formulaDiv));

    return variable;
}

function variableExistsInTableau(variable, formulaDiv) {
    const tableauContent = document.querySelector('.tableau-output').textContent;
    return tableauContent.includes(variable);
}



function updateDiamondArbitrary(formula, variable) {
    
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);


    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log("formula:", formula);
    // Extract the diamond arbitrary part of the formula
    const diamondarbitrary = formula.replace(prefixAnnouncements, '');
    console.log("diamondarbitrary:", diamondarbitrary);
    if (diamondarbitrary) {
        // Assuming the formula structure is like <a!>φ
        const agentMatch = diamondarbitrary.match(/<([a-z])!>(.*)/);
        console.log("agentMatch:", agentMatch);
        if (agentMatch) {
            const agent = agentMatch[1];
            const remainingFormula = agentMatch[2]; // Capture the remaining formula here
            const vertical = prefixAnnouncements + '<' + agent + '!' + variable + '>' + remainingFormula;
            console.log("remainingFormula:", remainingFormula);
            console.log('vertical:', vertical);
            return { vertical };
        } else {
            throw new Error('Invalid Diamond Arbitrary format: ' + formula);
        }
    } else {
        throw new Error('Invalid Diamond Arbitrary: ' + formula);
    }
}






function handleBoxArbitrary(formulaDiv) {
    const formulaText = formulaDiv.childNodes[0].nodeValue.trim();
    const message = promptmessage(formulaDiv);
    if (message) {
        const newFormulaObject = updateBoxArbitrary(formulaText, message);
        if (newFormulaObject && newFormulaObject.vertical) {
            const leafNodes = findOffspringAndLeaves(formulaDiv).leaves;
            let formulaIndex = parseInt(formulaDiv.getAttribute('id').split('-')[1]);

            leafNodes.forEach(leafNode => {
                const newChildNode = createChildNode(newFormulaObject.vertical, ++formulaIndex); 
                leafNode.appendChild(newChildNode);
            });
        } else {
            console.error('Error updating Diamond Arbitrary formula');
        }
    }
}


function promptmessage(formulaDiv) {
    return prompt("Enter any message (suggested: no need to use new variables):");
}


function updateBoxArbitrary(formula, message) {
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log('prefixAnnouncements', prefixAnnouncements);
    // Extract the conjunction part of the formula
    const boxarbitrary = formula.replace(prefixAnnouncements, '');
    if(boxarbitrary){
    // Assuming the formula structure is like [a!]φ
    const agent = boxarbitrary.match(/\[([a-z])!\]/)[1];
    const remainingFormula = boxarbitrary.slice(4); // Skips [a!]
    const vertical = prefixAnnouncements +'[' + agent + '!' + message + ']' + remainingFormula;
    console.log('vertical:', vertical);
    return {vertical};
} else {
    throw new Error('Invalid Box Arbitrary: ' + formula);
}
}
