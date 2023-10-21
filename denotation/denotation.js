

let Prop = [];

function setPropSize() {
    const size = parseInt(document.getElementById("propSize").value);
    Prop = [];
    
    if (size < 4) {
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

    document.getElementById("propOutput").innerText = `Prop = {${Prop.join(', ')}}`;
}

function powerSet(array) {
    return array.reduce((subsets, value) => subsets.concat(subsets.map(set => [value, ...set])), [[]]);
}

function isWellFormedSimpleCheck(formula) {
    const binaryOperators = ['&', '+', '>'];

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


document.getElementById("generateDiagram").addEventListener("click", function() {
    displayPowerSet();
    function getDenotationResult() {
        const denotation = document.getElementById("resultOutput").innerText;
        return denotation;
    }
    
    

    function displayPowerSet() {
        const powerSetOfProp = powerSet(Prop);
        const svgContainer = document.getElementById("hasseDiagram");
        svgContainer.innerHTML = '';  // Clear previous diagram
    
        const denotationResult = getDenotationResult();
    
        powerSetOfProp.sort((a, b) => a.length - b.length);  // Sort subsets by size
    
        const maxWidth = powerSetOfProp.length;
        const maxHeight = Prop.length + 1; 
    
        const verticalGap = svgContainer.height.baseVal.value / (maxHeight + 1);
        const circleRadius = 30;
    
        for (let i = 0; i <= Prop.length; i++) {
            const subsetsOfSizeI = powerSetOfProp.filter(subset => subset.length === i);
            
            // Adjust yOffset to reverse the diagram
            const yOffset = (Prop.length - i + 1) * verticalGap;
            
            const horizontalGap = svgContainer.width.baseVal.value / (subsetsOfSizeI.length + 1);
            subsetsOfSizeI.forEach((subset, j) => {
                const xOffset = (j + 1) * horizontalGap;
                const isSubsetInDenotation = subset.every(element => denotationResult.includes(element));
                createCircle(xOffset, yOffset, subset.join(','), svgContainer, circleRadius, isSubsetInDenotation);
            });
        }
    }
    
    
    function createCircle(x, y, label, svgContainer, radius, isInDenotation) {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", radius);
        circle.setAttribute("stroke", "black");
        circle.setAttribute("stroke-width", "1.5");
        circle.setAttribute("fill", isInDenotation ? "lightgreen" : "white");
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
        const denotationStrings = resultSets.map(subset => subset.join(','));
    
        console.log("Expected subsets to color:", denotationStrings); // Log expected subsets
    
        circles.forEach(circle => {
            console.log("Circle subset:", circle.getAttribute("data-text")); // Log each circle's subset
            if (denotationStrings.includes(circle.getAttribute("data-text"))) {
                circle.style.fill = "lightgreen"; // Change this color to your preference
            }
        });
    }
    
       

    const denotationResult = getDenotationResult(); 
    colorDenotation(denotationResult);
});



/*for verification  


((~p&~q) +(~r&~s)))
(p+(~q&((r+~p)>~(p>~r))))
(((p>q)&~r)+~(s&t))


*/