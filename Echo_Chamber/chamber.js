const props = ['p', 'q', 'r', 's', 't'];
const negprops = ['~p', '~q', '~r', '~s', '~t'];
const agentFollowers = {};
let agentBeliefs = {};
let agents = [];
const agentColors = {};
const colors = ['#D67293', '#73DEFA', '#5DB117', '#5A8CD7', '#CCCC00', '#9A5FD7', '#FA1CA8', '#A300A3', '#00A3A3', '#F5DAD2', '#DFD0B8', '#BACD92', '#75A47F'];

document.addEventListener('DOMContentLoaded', function() {
    const setSizeBtn = document.getElementById('setSizeBtn');
    const distributeBtn = document.getElementById('distributeBtn');
    const chamber = document.getElementById('chamber');
    const ctx = chamber.getContext('2d');

    setSizeBtn.addEventListener('click', setAgentSize);
    distributeBtn.addEventListener('click', randomDistribution);

    function setAgentSize() {
        const agentSize = document.getElementById('agentSize').value;
        agents = [];
        for (let i = 0; i < agentSize; i++) {
            const agentName = `${String.fromCharCode(97 + (i % 26))}${Math.floor(i / 26)}`;
            agents.push(agentName);
            agentColors[agentName] = colors[i % colors.length];
        }
        //console.log("agents:", agents);
        drawNetwork();
    }

    function randomDistribution() {
     
        agents.forEach(agent => {
            const beliefProps = new Set();
            const beliefNegProps = new Set();

            // Assign all props or their negations to the agent
            props.forEach(prop => {
                if (Math.random() < 0.5) {
                    beliefProps.add(prop);
                    beliefNegProps.add(`~${prop}`);
                } else {
                    beliefNegProps.add(`~${prop}`);
                    beliefProps.add(prop);
                }
            });

            agentBeliefs[agent] = [...beliefProps, ...beliefNegProps];

            // Randomly assign followers to the agent
            const followers = agents.filter(() => Math.random() < 0.3);
            agentFollowers[agent] = followers;
            console.log("agentFollowers:", agentFollowers);
        });

        drawNetwork();
    }

    function drawNetwork() {
        const width = chamber.width = window.innerWidth * 0.9;
        const height = chamber.height = window.innerHeight * 0.8;
        const radius = 20;
        const padding = 50;

        ctx.clearRect(0, 0, width, height);

        const agentPositions = agents.map((agent, i) => {
            const angle = (2 * Math.PI * i) / agents.length;
            const x = width / 2 + (width / 2 - padding) * Math.cos(angle);
            const y = height / 2 + (height / 2 - padding) * Math.sin(angle);
            return { x, y };
        });

        agentPositions.forEach(({ x, y }, i) => {
            const agent = agents[i];
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = agentColors[agent];
            ctx.fill();
            ctx.closePath();

            // Draw agent name on the node
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(agent, x, y);

            // Draw a circle around the agent if it follows itself
            if (agentFollowers[agent] && agentFollowers[agent].includes(agent)) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.closePath();
            }
        });

        agents.forEach((agent, i) => {
    const followers = agentFollowers[agent] || [];
    if (followers.length > 0) {
        const { x, y } = agentPositions[i];
        followers.forEach(follower => {
            const { x: followerX, y: followerY } = agentPositions[agents.indexOf(follower)];
            const dx = followerX - x;
            const dy = followerY - y;
            const arrowLength = 10;
            const arrowAngle = Math.atan2(dy, dx);

            // If the agent follows itself, draw a circle around the node
            if (follower === agent) {
                ctx.beginPath();
                ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
                ctx.closePath();
            } else {
                // Draw an arrow from the border of one node to the border of another node
                ctx.beginPath();
                ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                ctx.lineTo(followerX - radius * Math.cos(arrowAngle), followerY - radius * Math.sin(arrowAngle));
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#fff';
                ctx.stroke();

                // Draw an arrowhead pointing to the followee
                ctx.beginPath();
                ctx.moveTo(followerX - radius * Math.cos(arrowAngle), followerY - radius * Math.sin(arrowAngle));
                ctx.lineTo(followerX - (radius + arrowLength) * Math.cos(arrowAngle - Math.PI / 12), followerY - (radius + arrowLength) * Math.sin(arrowAngle - Math.PI / 12));
                ctx.moveTo(followerX - radius * Math.cos(arrowAngle), followerY - radius * Math.sin(arrowAngle));
                ctx.lineTo(followerX - (radius + arrowLength) * Math.cos(arrowAngle + Math.PI / 12), followerY - (radius + arrowLength) * Math.sin(arrowAngle + Math.PI / 12));
                ctx.stroke();
                ctx.closePath();
            }
        });
    }
});
    }
});