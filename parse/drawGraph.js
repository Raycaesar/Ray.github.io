ocument.addEventListener("DOMContentLoaded", function () {
    document.getElementById("drawGraph").addEventListener("click", drawHesseDiagram);

let beliefStates = {};

function assignBelief() {
    let agent = document.getElementById('beliefAgent').value;
    let formula = document.getElementById('beliefFormula').value;

    if (!beliefStates[agent]) {
        beliefStates[agent] = [];
    }

    beliefStates[agent].push(formula);
    updateBeliefOutput();
}

function updateBeliefOutput() {
    let output = document.getElementById('beliefOutput');
    output.innerHTML = '';

    for (let agent in beliefStates) {
        output.innerHTML += agent + ': ' + JSON.stringify(beliefStates[agent]) + '<br>';
    }
}

function drawHesseDiagram() {
    let cy = cytoscape({
        container: document.getElementById('cy'),
        elements: generateElements(),
        style: [{
                selector: 'node',
                style: {
                    'background-color': 'data(color)',
                    'label': 'data(id)'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ]
    });

    function generateElements() {
        let elements = [];
        let propSize = parseInt(document.getElementById('propSize').value);
        let allProps = Array.from({length: propSize}, (_, i) => 'p' + (i + 1));

        // Generate powerset of Prop
        let powerSet = [[]];
        for (let i = 0; i < allProps.length; i++) {
            for (let j = 0, len = powerSet.length; j < len; j++) {
                powerSet.push(powerSet[j].concat(allProps[i]));
            }
        }

        // Generate nodes from powerset and edges based on subset relation
        for (let i = 0; i < powerSet.length; i++) {
            let setColor = [];
            for (let agent in beliefStates) {
                if (beliefStates[agent].includes(powerSet[i].join(','))) {
                    setColor.push(agentColor(agent));
                }
            }
            elements.push({
                data: { id: powerSet[i].join(','), color: setColor.join(';') },
            });

            for (let j = i + 1; j < powerSet.length; j++) {
                if (isSubset(powerSet[i], powerSet[j])) {
                    elements.push({
                        data: { source: powerSet[i].join(','), target: powerSet[j].join(',') }
                    });
                }
            }
        }

        return elements;
    }

    function agentColor(agent) {
        let colors = {
            'a': 'red',
            'b': 'blue',
            'c': 'green',
            // extend as needed
        };
        return colors[agent] || 'gray';
    }

    function isSubset(sub, set) {
        return sub.every(el => set.includes(el));
    }
}
});
