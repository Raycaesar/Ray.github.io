document.getElementById('generate-tableau').addEventListener('click', function() {
    const formulaInput = document.getElementById('formula-input').value;
    const tableauOutput = document.querySelector('.tableau-output');
    tableauOutput.innerHTML = ''; // Clear previous output

    // Split the input into separate formulas (assuming each formula is on a new line)
    const formulas = formulaInput.split('\n');

    formulas.forEach(formula => {
        const formulaType = getFormulaType(formula);
        const formulaDiv = document.createElement('div');
        formulaDiv.classList.add('formula');
        formulaDiv.textContent = `${formula} (${formulaType})`;
        formulaDiv.onclick = function() {
            // Add functionality to process the selected formula
            processFormula(formula, formulaType);
        };
        tableauOutput.appendChild(formulaDiv);
    });
});

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




let formulas = [


    "Baq",
    "~Baq",

    "[c:p]Bbq",
    "[c:p][a:r]Bb(q>~p)" ,
    "[a:(q>r)][c:p][d:r]Bb(r&(q>~p))" ,
    "[b:(p+q)][a:p]~Bcq",
    "[d:~(q>r)][c:p][a:~r]~Bb(~r>(q>~p))" ,

    "(Bap & Baq)",
    "[d:r]([b!(p+q)]Bbp & [a!]~Bcq)",
    "[d:(p>q)][c:r][a:(p&~q)]([b:q]Bc(~p&~r)&~Ba(q+r))",
    "[a:(p&q)](Bbp + Baq)",
    "[a:(p>q)][b:r](~Bc~(p&q) + [d:(p+q)]Baq)",

    "<a!(p>q)>Baq",
    "[b:q]<a!p><b!>Bb(r>q)",
    "[a:(p>q)][b:r]<a!(r>t)><b!(p>q)>Ba(r>q)",
    "[c:~q][a!(p&q)]⟨a!⟩(Bbp&~Bcq)",
    "[d:(q&~r)][b!r][a!](<a!>Bbp+~Bc~q)",
    "[a:(q>r)][c:p][a!(q&~r)][b!r][a!](<a!>Bbp &~Bc~q)",
    

    "<a!>Baq",
    "[b:q][c:(p>r)]<d!>Ba(q+~r)",
    "[c:~q][a:(p>q)][a!](Bbp&~Bcq)",
    "[c:~q][b:q][c:(p>r)][a:(p>q)][d_3!](<d!>Bbp+[b!r]~Bcq)",
  

];


formulas.forEach(formula => {
    //let tokens = tokenizeFormula(formula);
    let parsedFormula = getFormulaType(formula);
    console.log(`Formula: ${formula}\n`, JSON.stringify(parsedFormula, null, 2), '\n');
});


function updateBeliefWithFreeAnnouncement(formula) {
    // Extract all announcements
    const announcements = formula.match(/\[[a-z]:[^\]]+\]/g) || [];
    
    // Separate the last announcement and prefix announcements
    const lastAnnouncement = announcements.pop();
    const prefixAnnouncements = announcements.join('');

    // Extract the belief part of the formula
    const beliefPart = formula.replace(/\[[a-z]:[^\]]+\]/g, '');

    // Extract announcer and message from the last announcement
    const announcer = lastAnnouncement[1];
    const message = lastAnnouncement.slice(3, -1);

    // Extract the receiver from the belief part
    const receiver = beliefPart[1];

    // Generate left and right parts of the tableau
    const leftOutput = prefixAnnouncements + beliefPart;
    const rightOutput = prefixAnnouncements + 'B' + receiver + '(' + message + '>' + beliefPart.slice(2) + '), ' + receiver + 'F' + announcer;

    console.log('Left:', leftOutput);
    console.log('Right:', rightOutput);
}



function updateNegationWithFreeAnnouncement(formula) {
    // Extract all announcements
    const announcements = formula.match(/\[[a-z]:[^\]]+\]/g) || [];
    
    // Separate the last announcement and prefix announcements
    const lastAnnouncement = announcements.pop();
    const prefixAnnouncements = announcements.join('');

    // Extract the negation and belief part of the formula
    const negationPart = formula.replace(/\[[a-z]:[^\]]+\]/g, '');

    // Extract announcer and message from the last announcement
    const announcer = lastAnnouncement[1];
    const message = lastAnnouncement.slice(3, -1);

    // Generate left and right parts of the tableau
    const leftOutput = prefixAnnouncements + '~B' + negationPart[2] + '(' + message + '>' + negationPart.slice(3) + ')';
    const rightOutput = prefixAnnouncements + negationPart + ' ~' + negationPart[2] + 'F' + announcer;

    console.log('Left:', leftOutput);
    console.log('Right:', rightOutput);
}



function updateConjunction(formula) {
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log('prefixAnnouncements', prefixAnnouncements);

    // Extract the conjunction part of the formula
    const conjunctionPart = formula.replace(prefixAnnouncements, '');
    console.log('conjunctionPart', conjunctionPart);

    const conjunction = conjunctionPart.slice(1, -1);
    console.log('conjunction ', conjunction);

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
        const vertical1 = prefixAnnouncements + conjunct[0].trim();
        const vertical2 = prefixAnnouncements + conjunct[1].trim();
        console.log('vertical:', vertical1, vertical2);
    } else {
        throw new Error('No main conjunction found: ' + formula);
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
        const vertical1 = prefixAnnouncements + "B" + agent + message;
        const vertical2 = prefixAnnouncements + "["+ agent + ":" + message + "]" + remainingFormula.trim();
        console.log('vertical:', vertical1, vertical2);
    } else {
        throw new Error('Invalid diamond sincere format: ' + formula);
    }
}




function updateBoxSincere(formula) {
    // Extract only the free announcements at the start of the formula
    const prefixAnnouncementsMatch = formula.match(/^(\[[a-z]:[^\]]+\])+/);
    const prefixAnnouncements = prefixAnnouncementsMatch ? prefixAnnouncementsMatch[0] : '';
    console.log('prefixAnnouncements', prefixAnnouncements);

    // Assuming the formula structure is like [a!p]φ or [prefix][a!p]φ
    const sincerebox = formula.match(/\[[a-z]![^\]]+\]/);
    console.log("sincerebox :", sincerebox );

    if (sincerebox ) {
        const agent = sincerebox[0][1];
        console.log("agent:", agent)
        const message = sincerebox[0].slice(3, -1);
        console.log("message:", message)

        // Calculate the start index of the formula part after the sincere announcement
        const startIndexAfterAnnouncement = formula.indexOf(sincerebox[0]) + sincerebox[0].length;
        const remainingFormula = formula.slice(startIndexAfterAnnouncement);

        // Construct the vertical formulas
        const leftOutput = prefixAnnouncements + "~B" + agent + message;
        const rightOutput = prefixAnnouncements + "["+ agent + ":" + message + "]" + remainingFormula.trim();
        console.log('Left:', leftOutput);
         console.log('Right:', rightOutput);
    } else {
        throw new Error('Invalid diamond sincere format: ' + formula);
    }
}


/*
function updateDiamondArbitrary(formula) {
    // Assuming the formula structure is like <a!>φ
    const agent = formula.match(/<([a-z])!>/)[1];
    const remainingFormula = formula.slice(4); // Skips <a!>

    console.log('ColumnFormula:', '<' + agent + '!x>' + remainingFormula + ' (where x is a new atomic message)');
}

function updateBoxArbitrary(formula) {
    // Assuming the formula structure is like [a!]φ
    const agent = formula.match(/\[([a-z])!\]/)[1];
    const remainingFormula = formula.slice(4); // Skips [a!]

    console.log('ColumnFormula:', '[' + agent + '!y]' + remainingFormula + ' (where y is any message possible)');
}
*/


// Function to test each type of formula and log the output
function testFormulas(formulas) {
    formulas.forEach(formula => {
        let formulaType = getFormulaType(formula);
        console.log(`Formula: ${formula}, Type: ${formulaType}`);
        
        switch (formulaType) {
            case 'atomic belief':
            case 'atomic negation':
                console.log('No update required for atomic types.');
                break;
            case 'belief with free announcement':
                updateBeliefWithFreeAnnouncement(formula);
                break;
            case 'negation with free announcement':
                updateNegationWithFreeAnnouncement(formula);
                break;
            case 'conjunction':
                updateConjunction(formula);
                break;
            case 'disjunction':
                updateDisjunction(formula);
                break;
            case 'diamond sincere':
                updateDiamondSincere(formula);
                break;
            case 'box sincere':
                updateBoxSincere(formula);
                break;
            case 'diamond arbitrary':
                updateDiamondArbitrary(formula);
                break;
            case 'box arbitrary':
                updateBoxArbitrary(formula);
                break;
            default:
                console.log('Unknown formula type.');
        }
        console.log(''); // For better readability in console
    });
}


testFormulas(formulas);

