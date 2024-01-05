let backgroundSet = [];
Prop = [];

function setPropSize() {
    const size = parseInt(document.getElementById("propSize").value);
    
    let Prop0 = [];
    let Prop1 = [];
    backgroundSet = []; // Clear the background set

    // Define Prop, Prop0, and Prop1
    if (size === 3) {
        Prop = ['p', 'q', 'r'];
    } else if (size === 4) {
        Prop = ['p', 'q', 'r', 's'];
    } else if (size === 5) {
        Prop = ['p', 'q', 'r', 's', 't'];
    } else {
        for (let i = 1; i <= size; i++) {
            Prop.push(`p_${i}`);
        }
    }

    // Create Prop^0 and Prop^1 with real superscripts
    Prop.forEach(element => {
        Prop0.push(element + '<sup>0</sup>');
        Prop1.push(element + '<sup>1</sup>');
    });

    // Generate all combinations
    const allProps = [Prop, Prop0, Prop1];
    function generateCombination(prefix, index) {
        if (index === Prop.length) {
            backgroundSet.push(`{${prefix.join(', ')}}`);
        } else {
            for (let i = 0; i < 3; i++) {
                generateCombination([...prefix, allProps[i][index]], index + 1);
            }
        }
    }

    generateCombination([], 0);

    // Displaying Prop, Prop^0, and Prop^1 using innerHTML
    document.getElementById("propOutput").innerHTML = `Prop = {${Prop.join(', ')}}`;
    document.getElementById("prop0Output").innerHTML = `Prop<sup>0</sup> = {${Prop0.join(', ')}}`;
    document.getElementById("prop1Output").innerHTML = `Prop<sup>1</sup> = {${Prop1.join(', ')}}`;
    document.getElementById("backgroundOutput").innerHTML = `Background = {${backgroundSet.join(', ')}}`;
}




function isWellFormedSimpleCheck(formula) {
    const binaryOperators = ['&', '+'];

    let operatorCount = 0;
    for (const operator of binaryOperators) {
        operatorCount += (formula.match(new RegExp(`\\${operator}`, 'g')) || []).length;
    }

    const bracketPairsCount = (formula.match(/\(/g) || []).length;

    return operatorCount === bracketPairsCount;
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
        
        if (tokens.length === 0 || ['&', '+'].indexOf(tokens[0]) === -1) {
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


        default:
            throw new Error("Invalid or non-well-formed formula.");
    }
}

function atomDenotation(atom) {
    // Ensure that the output is an array of arrays
    return backgroundSet.filter(bgElement => {
        const elements = bgElement.slice(1, -1).split(', ');
        return elements.includes(atom) || elements.includes(`${atom}<sup>1</sup>`);
    }).map(set => set.slice(1, -1).split(', '));
}

function handleNegation(subformula) {
    const innerDenotation = replaceWithDenotation(subformula);
    let parsedInnerDenotation = parseSet(innerDenotation);

    // Ensure that each element of negatedDenotation is an array
    let negatedDenotation = parsedInnerDenotation.map(set => {
        return set.map(element => switchSuperscript(element));
    });

    return formatDenotation(negatedDenotation);
}



function switchSuperscript(element) {
    // Check if the element has a superscript
    if (element.includes('<sup>')) {
        // Switch superscripts 0 to 1 and 1 to 0
        return element.includes('<sup>0</sup>') ? 
               element.replace('<sup>0</sup>', '<sup>1</sup>') :
               element.replace('<sup>1</sup>', '<sup>0</sup>');
    } else {
        // If no superscript, return the element as is
        return element;
    }
}

function handleBinaryOperator(parsedFormula) {
    const leftDenotation = parseSet(replaceWithDenotation(parsedFormula.left));
    const rightDenotation = parseSet(replaceWithDenotation(parsedFormula.right));

    // Both setUnion and setIntersection should return an array of arrays
    let resultSet = parsedFormula.type === '&'
        ? setIntersection(leftDenotation, rightDenotation)
        : setUnion(leftDenotation, rightDenotation);

    return formatDenotation(resultSet);
}

function parseSet(setString) {
    if (setString === '{}') return [];
    // Ensure this returns an array of arrays
    return setString.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
}



function formatDenotation(setArray) {
    console.log("formatDenotation received:", setArray); // Log the input to formatDenotation

    if (!Array.isArray(setArray)) {
        console.error('formatDenotation expects an array but received:', setArray);
        throw new Error('formatDenotation expects an array');
    }

    if (setArray.length === 0) return '{}';

    try {
        return `{{${setArray.map(set => {
            console.log("Processing set:", set); // Log each set being processed
            if (!Array.isArray(set)) {
                console.error('Non-array set found:', set);
                throw new Error('Each set should be an array');
            }
            return set.join(', ');
        }).join('}, {')}}}`;
    } catch (error) {
        console.error("Error in formatDenotation: ", error);
        throw error;
    }
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

function displayDenotation() {
    try {
        const formula = document.getElementById("formulaInput").value;

        if (!isWellFormedSimpleCheck(formula)) {
            throw new Error("The formula is not well-formed!");
        }

        const parsed = parse(tokenize(formula));
        let result = replaceWithDenotation(parsed);
        document.getElementById("resultOutput").innerHTML = result; // Change here
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("generateDiagram").addEventListener("click", function() {
    displayBackground();
    
    function getDenotationResult() {
        const denotation = document.getElementById("resultOutput").innerText;
        return denotation;
    }

    function displayBackground() {
        const svgContainer = document.getElementById("hasseDiagram");

        // Adjust the size of the SVG container based on the size of Prop
        switch (Prop.length) {
            case 3:
                svgContainer.style.width = "1000px";
                svgContainer.style.height = "600px";
                maxCirclesPerLine = 9;
                break;
            case 4:
                svgContainer.style.width = "2000px";
                svgContainer.style.height = "800px";
                maxCirclesPerLine = 18;
                break;
            case 5:
                svgContainer.style.width = "3000px";
                svgContainer.style.height = "1000px";
                maxCirclesPerLine = 27;
                break;
            default:
                svgContainer.style.width = "1000px"; // Default size
                svgContainer.style.height = "600px";
                maxCirclesPerLine = 9;
                break;
        }

        svgContainer.innerHTML = '';  // Clear previous diagram
            const denotationResult = getDenotationResult();
            backgroundSet.sort();
    
            const totalLines = Math.ceil(backgroundSet.length / maxCirclesPerLine);
            const verticalGap = svgContainer.height.baseVal.value / (totalLines + 1);
            const circleRadius = 30;
    
        backgroundSet.forEach((setString, index) => {
            const lineIndex = Math.floor(index / maxCirclesPerLine);
            const positionInLine = index % maxCirclesPerLine;
    
            const xOffset = (svgContainer.width.baseVal.value / (maxCirclesPerLine + 1)) * (positionInLine + 1);
            const yOffset = (lineIndex + 1) * verticalGap;
    
            const subset = parse_Set(setString);
            const isSubsetInDenotation = subset.every(element => denotationResult.includes(element));
            createCircle(xOffset, yOffset, subset.join(', '), svgContainer, circleRadius, isSubsetInDenotation);
        });
    }
    

    function parse_Set(setString) {
        if (setString === '{}') return [];
        // Split and process the string to separate main elements and their superscripts
        return setString.slice(1, -1).split(', ').map(part => {
            return part.includes('<sup>') ? 
                   part.replace('<sup>', '').replace('</sup>', '') : 
                   part;
        });
    }
    
    
    
    
    
    function createCircle(x, y, label, svgContainer, radius, isInDenotation) {
       

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1.5");
        circle.classList.add(isInDenotation ? "circle-in-denotation" : "circle-not-in-denotation"); // Add class based on denotation
        circle.setAttribute("data-text", label);  // Setting the data-text attribute here
        svgContainer.appendChild(circle);
        
    
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y);
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("text-anchor", "middle");
        text.textContent = label;
        svgContainer.appendChild(text);
    }
    
    
    function colorDenotation(result) {
        const circles = document.querySelectorAll("#hasseDiagram circle");
        if (result === '{}') return;
        if (typeof result !== 'string' || !result.startsWith("{{") || !result.endsWith("}}")) {
            console.error('Invalid format for denotation result.');
            return;
        }
    
        const resultSets = result.slice(2, -2).split('}, {').map(str => str.split(', ').filter(Boolean));
        const denotationStrings = resultSets.map(subset => subset.join(', '));
    
        circles.forEach(circle => {
            const circleText = circle.getAttribute("data-text").trim(); // Ensure no leading/trailing whitespace
            if (denotationStrings.includes(circleText)) {
                circle.style.fill = "#7ea5c5"; // Denotation color
            } else {
                circle.style.fill = "#3C3C3C"; // Original color (assuming this is the original fill color)
            }
        });
    }
    
    
    
    
    const denotationResult = getDenotationResult(); 
    console.log("denotationResult:", denotationResult);
    colorDenotation(denotationResult);
});

