let Prop = [];

function setPropSize() {
    const size = parseInt(document.getElementById("propSize").value);
    Prop = [];
    if (size < 4) {
        Prop = ['p', 'q', 'r'];
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

// Mocked functions for the sake of example
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

function replaceWithDenotation(parsedFormula) {
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

function denotation(formula) {
    const parsedFormula = parse(tokenize(formula));
    if (!parsedFormula) return [];

    switch (parsedFormula.type) {
        case 'atom':
            return powerSet(Prop).filter(subset => subset.includes(parsedFormula.value));
        case '~':
            return difference(powerSet(Prop), denotation(parsedFormula.subformula.value));
        case '&':
            return intersection(denotation(parsedFormula.left.value), denotation(parsedFormula.right.value));
        case '+':
            return union(denotation(parsedFormula.left.value), denotation(parsedFormula.right.value));
        case '>':
            const notLeftDenotation = difference(powerSet(Prop), denotation(parsedFormula.left.value));
            const rightDenotation = denotation(parsedFormula.right.value);
            return union(notLeftDenotation, rightDenotation);
        default:
            return [];
    }
}

function atomDenotation(atom) {
    return powerSet(Prop).filter(subset => subset.includes(atom));
}




function displayDenotation() {
    const formula = document.getElementById("formulaInput").value;
    const parsed = parse(tokenize(formula));
    const result = replaceWithDenotation(parsed);
    document.getElementById("resultOutput").innerText = result;
}



/*for verification  (p+(~q&((r+~p)>~(p>~r))))*/