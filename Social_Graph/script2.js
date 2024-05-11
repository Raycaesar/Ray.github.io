

let matrix = [];
let Prop = [];



function setPropSize() {
     
    const baseProp = ['p', 'q', 'r', 's', 't'];
    const size = parseInt(document.getElementById("propSize").value);

    if (size <= baseProp.length) {
        Prop = baseProp.slice(0, size);
    }

    const numRows = Prop.length < 4 ? 2 : 4;
    const numCols = 4;
    matrix = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    console.log("matrix", matrix);
    document.getElementById("propOutput").innerText = `Prop = {${Prop.join(', ')}}`;
}

function powerSet(nums) {
    const result = [[]]; // Initialize with empty set

    for (const num of nums) {
        const subsets = [];
        for (const subset of result) {
            subsets.push([...subset, num]); // Add current number to existing subsets
        }
        result.push(...subsets); // Add new subsets to result
    }

    return result;
}

function deepArrayContains(mainArray, searchArray) {
    const mainString = JSON.stringify(mainArray);
    const searchString = JSON.stringify(searchArray);
    return mainString.includes(searchString);
}

function updateMatrix() {
    
    const inputSetString = document.getElementById('truth-table-set').value;
    if (inputSetString.trim() === "{}") {
        console.log("Input string is empty, returning default matrix.");
        matrix = [['0', '0', '0', '0'], ['0', '0', '0', '0']];
    }
    else{
    // Remove curly braces and split by comma
    const inputArray = inputSetString.match(/\{[^{}]*\}/g);
    // Map over the array to transform each element into a set
    const inputResult = inputArray.map(item => {
        if (item === "{}") return []; // Handle empty set
        return item.replace(/[{}]/g, "").split(",");
    });

    const powers = powerSet(Prop);

    for (let i = 0; i < powers.length; i++) {
        const { row, col } = getIndexAndBinaryTransform(i);
        if (deepArrayContains(inputResult, powers[i])) {
            matrix[row][col] = 1;
        } else {
            matrix[row][col] = 0;
        }
    }
    }
    console.log("matrix", matrix);
    return matrix; // Return the matrix array
};


function extractMatrix() {
    const extractedMatrix = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === 1) {
                extractedMatrix.push(`${i}${j}`);
            }
        }
    }
    console.log("extractedMatrix", extractedMatrix);
    return extractedMatrix;
}



function generateExpressions(matrix) {
    const valuedMatrix = extractMatrix(matrix);
    console.log("valuedMatrix ", valuedMatrix);
    const selectedParts = findMGTE(valuedMatrix);
    console.log("selectedParts", selectedParts);
   const sop = generateSOP(selectedParts);
   console.log('sop', sop);
document.getElementById('sop-expression').textContent = sop;
}

function findMGTE(array) {
    const fullMatrix = ['00', '01', '02', '03', '10', '11', '12', '13'];
    const groups = [
        ['00', '01', '02', '03'],
        ['10', '11', '12', '13'],
        ['00', '01', '10', '11'],
        ['01', '03', '11', '13'],
        ['00', '02', '10', '12'],
        ['02', '03', '12', '13']
    ];
    const tuples = [
        ['00', '01'], ['02', '03'],
        ['00', '02'], ['01', '03'],
        ['10', '11'], ['12', '13'],
        ['10', '12'], ['11', '13'],
        ['00', '10'], ['01', '11'],
        ['02', '12'], ['03', '13']
    ];

    let selectedParts = {
        fullMatrix: [],
        groups: [],
        tuples: [],
        elements: []
    };

    // Check if the input array is equal to the full matrix
    const arrayEqualFullMatrix = array.length === fullMatrix.length && array.every((elem, idx) => elem === fullMatrix[idx]);
    if (arrayEqualFullMatrix) {
        selectedParts.fullMatrix = fullMatrix;
    } else {
        // Check if the input array is a subset of any group
        for (const group of groups) {
            if (group.every(elem => array.includes(elem))) {
                selectedParts.groups.push(group);
            }
        }

        // Check if the input array contains any tuples not covered by the groups
        const uncoveredTuples = tuples.filter(tuple => {
            const isTupleCovered = selectedParts.groups.some(group => tuple.every(elem => group.includes(elem)));
            return tuple.every(elem => array.includes(elem)) && !isTupleCovered;
        });
        selectedParts.tuples = uncoveredTuples;

        // Check if the input array contains any elements not covered by groups or tuples
        const uncoveredElements = array.filter(elem => {
            const isElementCovered = selectedParts.groups.some(group => group.includes(elem)) ||
                selectedParts.tuples.some(tuple => tuple.includes(elem));
            return !isElementCovered;
        });
        selectedParts.elements = uncoveredElements.map(elem => [elem]);
    }

    return selectedParts;
}


function generateSOP(object) {
    const fullMatrix = ['00', '01', '02', '03', '10', '11', '12', '13'];
    const groups = [
        ['00', '01', '02', '03'],
        ['10', '11', '12', '13'],
        ['00', '01', '10', '11'],
        ['01', '03', '11', '13'],
        ['00', '02', '10', '12'],
        ['02', '03', '12', '13']
    ];
    const tuples = [
        ['00', '01'], ['02', '03'],
        ['00', '02'], ['01', '03'],
        ['10', '11'], ['12', '13'],
        ['10', '12'], ['11', '13'],
        ['00', '10'], ['01', '11'],
        ['02', '12'], ['03', '13']
    ];
    const elements = [
        ['00'], ['01'], ['02'], ['03'],
        ['10'], ['11'], ['12'], ['13']
    ];

    if (object.groups.length === 0 && object.tuples.length === 0 && object.elements.length === 0) {
        // If there are no groups, tuples, or elements, return p+~p or (p&~p) if fullMatrix is not empty
        return (object.fullMatrix.length !== 0) ?  'p+~p' :'(p&~p)';
    }

    const groupsInterpretation = ['~r', 'r', '~q', 'q', '~p', 'p'];
    const tuplesInterpretation = ['(~r&~q)', '(~r&q)', '(~r&~p)', '(~r&p)', '(r&~q)', '(r&q)', '(r&~p)', '(r&p)', '(~p&~q)', '(p&~q)', '(q&~p)', '(q&p)'];
    const elementInterpretation = ['(~p&~q&~r)', '(p&~q&~r)', '(~p&q&~r)', '(p&q&~r)', '(~p&~q&r)', '(p&~q&r)', '(~p&q&r)', '(p&q&r)'];

    let sop = "";

    // Translate groups into expressions
    object.groups.forEach(group => {
        const index = groups.findIndex(item => item.every(elem => group.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + groupsInterpretation[index] : groupsInterpretation[index];
        }
    });

    // Translate tuples into expressions
    object.tuples.forEach(tuple => {
        const index = tuples.findIndex(item => item.every(elem => tuple.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + tuplesInterpretation[index] : tuplesInterpretation[index];
        }
    });

    // Translate elements into expressions
    object.elements.forEach(element => {
        const index = elements.findIndex(item => item.every(elem => element.includes(elem)));
        if (index !== -1) {
            sop += (sop !== "") ? "+" + elementInterpretation[index] : elementInterpretation[index];
        }
    });

    return sop;
}


/*

function generateSOP(object) {
    if (object.length === 0) {
        return ""; // Return an empty string if the input array is empty
    }


    const groupsInterpretation = ['~r', 'r', '~q', 'q', '~p', 'p'];

    const tuplesInterpretation = [
        '(~r&~q)', '(~r&q)', '(~r&~p)', '(~r&p)',
        '(r&~q)', '(r&q)', '(r&~p)', '(r&p)',
        '(~p&~q)', '(p&~q)', '(q&~p)', '(q&p)'
    ];

    const elementInterpretation = [
        '(~p&~q&~r)', '(p&~q&~r)', '(~p&q&~r)', '(p&q&~r)',
        '(~p&~q&r)', '(p&~q&r)', '(~p&q&r)', '(p&q&r)'
    ];

    let sop = "";

    //if fullMatrix in selectedParts is not [], sop = "p+~p", 
    //otherwise, for every x in groups, tuples and elements, we translate it to expression by index of groupsInterpretation, tuplesInterpretation and elementInterpretation, finally link all parts with '+'

  
    return sop;
}
*/


function getIndexAndBinaryTransform(element) {
    // Transform index to binary with 3 digits
    const binary = element.toString(2).padStart(3, '0');

    // Separate binary into row and col parts
    const row = parseInt(binary[0], 2);
    const col = parseInt(binary.substring(1), 2); 
    return { row, col };
}



function generateTruthtable() {
    
}


/*


 given an array, we test every elements in groups first, if groups[i] in the array, we assign groupsInterpretation[i] without quotation marks to sop; 
    if there is another groups[j] in the array, and j= i+1 for any i we have assigned before, and j is odd then return sop = "p+~p", otherwise we update sop by sop + "+ groupsInterpretation[j]" without quotation marks;
    if elements in group covers all elements in array, we return sop, otherwise we test every elements in tuples, 
    if tuples[i], which is not a sublist of some assigned group[k], in the array, we update sop by sop + "+ tuplesInterpretation[j]" without quotation marks;
    if elements in group and tuple covers all elements in array, we return sop, otherwise we add elements
    remove elements in array that has been covered by assigned group and tuple, 
    for the rest elements in array we update we update sop by sop + "+ elementInterpretation[j]" without quotation marks, where j is from the element e.g. matrix[0][0] = 0, matrix[0][1] = 1, matrix[1][0] = 4, matrix[1][1] = 7.
    return sop.
    
const elements = [
        ['00'], ['01'], ['02'], ['03'],
        ['10'], ['11'], ['12'], ['13']
    ];
*/

 //const pos = generatePOS();
    //document.getElementById('pos-expression').textContent = pos;