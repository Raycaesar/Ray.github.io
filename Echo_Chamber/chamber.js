const props = ['p', 'q', 'r', 's', 't'];
const negprops = ['~p', '~q', '~r', '~s', '~t'];
let agentFollowers = {};
let agentBeliefs = {};
let agents = [];
const agentColors = {};
const colors = [
    '#D67293', '#73DEFA', '#5DB117', '#5A8CD7', '#CCCC00', '#9A5FD7', '#ED0807', 
    '#A300A3', '#00A3A3', '#F5DAD2', '#DFD0B8', '#BACD92', '#75A47F',
    '#FF5733', '#33FF57', '#3357FF', '#EBB4ED', '#53F5F0', '#33FFA1', '#FFA133', 
    '#FF3399', '#9933FF', '#3399FF', '#99FF33', '#FF9933', '#33FF99', '#339933', 
    '#993333', '#3399CC', '#CC3399', '#99CC33', '#CC9933', '#33CC99', '#9933CC', 
];

document.addEventListener('DOMContentLoaded', function() {
    const setSizeBtn = document.getElementById('setSizeBtn');
    const distributeBtn = document.getElementById('distributeBtn');
    const network = document.getElementById('network');
    const ctx = network.getContext('2d');
    const Ran_AnnoucBtn = document.getElementById('announcement');
    const Cham_CheckBtn = document.getElementById('chambers');

    setSizeBtn.addEventListener('click', setAgentSize);
    distributeBtn.addEventListener('click', randomDistribution);
    Ran_AnnoucBtn.addEventListener('click', randomAnnounce);
    Cham_CheckBtn.addEventListener('click', chamberCheck);

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
        agentBeliefs = {}; // Ensure agentBeliefs is reset before each distribution
        agentFollowers = {}; // Ensure agentFollowers is reset before each distribution
        
        agents.forEach(agent => {
            const beliefProps = new Set();
            const beliefNegProps = new Set();
    
            // Assign all props or their negations to the agent
            props.forEach(prop => {
                if (Math.random() < 0.3) {
                    beliefProps.add(prop);
                } else if (Math.random() > 0.7) {
                    beliefNegProps.add(`~${prop}`);
                }
            });
    
            agentBeliefs[agent] = [...beliefProps, ...beliefNegProps];
            console.log("agentBeliefs:", agentBeliefs);
    
            // Randomly assign followers to the agent
            const followers = agents.filter(() => Math.random() < 0.3);
            agentFollowers[agent] = followers;
            console.log("agentFollowers:", agentFollowers);
        });
    
        // Ensure all agents have an entry in agentFollowers, even if they have no followers
        agents.forEach(agent => {
            if (!agentFollowers[agent]) {
                agentFollowers[agent] = [];
            }
        });
    
        drawNetwork();
    }

    function drawNetwork() {
        const width = network.width = window.innerWidth * 0.9;
        const height = network.height = window.innerHeight * 0.8;
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
                        ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                        ctx.lineTo(x + (radius + arrowLength) * Math.cos(arrowAngle - Math.PI / 12), y + (radius + arrowLength) * Math.sin(arrowAngle - Math.PI / 12));
                        ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                        ctx.lineTo(x + (radius + arrowLength) * Math.cos(arrowAngle + Math.PI / 12), y + (radius + arrowLength) * Math.sin(arrowAngle + Math.PI / 12));
                        ctx.stroke();
                        ctx.closePath();
                    }
                });
            }
        });
    }

    function randomAnnounce() {
        const announcer = agents[Math.floor(Math.random() * agents.length)];
        const announcedBelief = agentBeliefs[announcer][Math.floor(Math.random() * agentBeliefs[announcer].length)];
        const isPosAnnounce = !announcedBelief.startsWith('~');
        const prop = isPosAnnounce ? announcedBelief : announcedBelief.slice(1);
        console.log("announcer:", announcer);
        console.log("announcedBelief:", announcedBelief);

        const followers = agentFollowers[announcer];
        agentFollowers[announcer] = followers.filter(follower => {
            const followerBeliefs = agentBeliefs[follower];
            if (isPosAnnounce) {
                if (followerBeliefs.includes(`~${prop}`)) {
                    return false;
                } else if (!followerBeliefs.includes(prop)) {
                    followerBeliefs.push(prop);
                }
            } else {
                if (followerBeliefs.includes(prop)) {
                    return false;
                } else if (!followerBeliefs.includes(`~${prop}`)) {
                    followerBeliefs.push(`~${prop}`);
                }
            }
            return true;
        });

        console.log("agentBeliefs:", agentBeliefs);
        console.log("agentFollowers:", agentFollowers);
        drawNetwork();
    }


    function buildSources(agentFollowers) {
        let sources = {};
    
        // Initialize sources for each agent
        for (const agent in agentFollowers) {
            sources[agent] = [];
        }
    
        // Build the sources mapping for each agent
        for (const agent in agentFollowers) {
            const followers = agentFollowers[agent];
            followers.forEach(follower => {
                if (!sources[follower].includes(agent)) {
                    sources[follower].push(agent);
                }
                agentFollowers[agent].forEach(indirectFollower => {
                    if (!sources[follower].includes(indirectFollower) && indirectFollower !== follower) {
                        sources[follower].push(indirectFollower);
                    }
                });
            });
        }
    
        // Remove duplicates from each agent's source
        for (const agent in sources) {
            sources[agent] = [...new Set(sources[agent])];
        }
    
        return sources;
    }
    
    function chamberCheck() {
        const sources = buildSources(agentFollowers);
        let chambers = [...agents];
        let connectedChambers = [];
    
        console.log("psedochambers:", sources);
    
        // Remove agents with conflicting beliefs from their sources
        chambers = chambers.filter(agent => {
            const agentBeliefSet = new Set(agentBeliefs[agent]);
            const agentSources = sources[agent] || [];
    
            for (const source of agentSources) {
                const sourceBeliefs = new Set(agentBeliefs[source]);
                for (const belief of agentBeliefSet) {
                    if (sourceBeliefs.has(`~${belief}`) || (belief.startsWith('~') && sourceBeliefs.has(belief.slice(1)))) {
                        return false;
                    }
                }
            }
            return true;
        });
    
        // Build connected chambers
        const visited = new Set();
    
        for (const agent of chambers) {
            if (!visited.has(agent)) {
                const connectedChamber = [];
                const queue = [agent];
    
                while (queue.length > 0) {
                    const currentAgent = queue.shift();
                    if (!visited.has(currentAgent)) {
                        visited.add(currentAgent);
                        connectedChamber.push(currentAgent);
    
                        const followers = agentFollowers[currentAgent] || [];
                        followers.forEach(follower => {
                            if (chambers.includes(follower) && !visited.has(follower)) {
                                queue.push(follower);
                            }
                        });
                    }
                }
    
                connectedChambers.push(connectedChamber);
            }
        }
    
        console.log("connectedChambers:", connectedChambers);
    
        drawChambers(connectedChambers);
    }

    function drawChambers(connectedChambers) {
        const width = network.width = window.innerWidth * 0.9;
        const height = network.height = window.innerHeight * 0.8;
        const radius = 20;
        const padding = 50;
        const chamberColors = [ '#42D4F4', '#F032E6', '#FABEBE', '#469990', '#DCBEFF', '#9A6324', '#F58231', '#33FF57', '#3357FF', '#53F5F0', '#33FFA1', '#FFA133' ];
    
        ctx.clearRect(0, 0, width, height);
    
        // Draw the agents as before
        drawNetwork();
    
        const agentPositions = agents.map((agent, i) => {
            const angle = (2 * Math.PI * i) / agents.length;
            const x = width / 2 + (width / 2 - padding) * Math.cos(angle);
            const y = height / 2 + (height / 2 - padding) * Math.sin(angle);
            return { x, y };
        });
    
        connectedChambers.forEach((chamber, chamberIndex) => {
            const chamberColor = chamberColors[chamberIndex % chamberColors.length];
            chamber.forEach((agent, i) => {
                const followers = agentFollowers[agent] || [];
                if (followers.length > 0) {
                    const { x, y } = agentPositions[agents.indexOf(agent)];
                    followers.forEach(follower => {
                        if (chamber.includes(follower)) {
                            const { x: followerX, y: followerY } = agentPositions[agents.indexOf(follower)];
                            const dx = followerX - x;
                            const dy = followerY - y;
                            const arrowLength = 10;
                            const arrowAngle = Math.atan2(dy, dx);
    
                            if (follower === agent) {
                                ctx.beginPath();
                                ctx.arc(x, y, radius + 5, 0, 2 * Math.PI);
                                ctx.strokeStyle = chamberColor;
                                ctx.stroke();
                                ctx.closePath();
                            } else {
                                // Draw an arrow from the border of one node to the border of another node
                                ctx.beginPath();
                                ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                                ctx.lineTo(followerX - radius * Math.cos(arrowAngle), followerY - radius * Math.sin(arrowAngle));
                                ctx.lineWidth = 1;
                                ctx.strokeStyle = chamberColor;
                                ctx.stroke();
                    
                                // Draw an arrowhead pointing to the followee
                                ctx.beginPath();
                                ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                                ctx.lineTo(x + (radius + arrowLength) * Math.cos(arrowAngle - Math.PI / 12), y + (radius + arrowLength) * Math.sin(arrowAngle - Math.PI / 12));
                                ctx.moveTo(x + radius * Math.cos(arrowAngle), y + radius * Math.sin(arrowAngle));
                                ctx.lineTo(x + (radius + arrowLength) * Math.cos(arrowAngle + Math.PI / 12), y + (radius + arrowLength) * Math.sin(arrowAngle + Math.PI / 12));
                                ctx.stroke();
                                ctx.closePath();
                            }
                        }
                    });
                }
            });
        });
    }
});


   /* 

       function buildSources(agentFollowers) {
        let sources = {};
        //for each agent i0 in agents, if i0 is in agentFollowers[j0], we update sources = {'i0':['j0']}, and if j0 is in agentFollowers[k0], we update sources = {'i0':['j0', 'k0']}. Given agentFollowers, we update sources by listing every agent's source. note that each agent's source will not contain an element twice.

    
        return sources;
    }


    function chamberCheck() {
        const sources = buildSources(agentFollowers);
        const chambers = agents;
        const connectedChambers = [];
        console.log("psedochambers:", sources);
        // for each agent, we consider if there exists an opposite prop from its source, e.g. sources = {'i0':['c0', 'j0', 'k0']} agentBeliefs = {'i0':['p', '~q', '~s', '~t'], 'c0':['p', '~q', 'r'],'j0':[ 's', '~t'], 'k0':['p', '~t', '~r']} we see that j0 has s which is opposite to i0, so we remove i0 from chambers.
        //Keep doing this procedure for all agents in chambers, and update the chambers. Then for agents in the updated chambers, if one follows another, we put them into connectedChambers.
        //for example, the update chambers = [a0, b0, c0, d0], agentFollowers = {a0:[b0, e0], b0:[e0, f0], c0:[b0, f0, i0], d0:[e0, f0]}; Then we update connectedChambers = [[a0, b0, c0], [d0]] because a0, b0 and c0 are connected and d0 is not followed by or follow the three.
    
        console.log("connectedChambers:", connectedChambers);
    
        // Draw the chambers with different colors
        drawChambers(connectedChambers);
    }




    function buildSources(agentFollowers) {
        let sources = {};
    
        for (const agent in agentFollowers) {
            const followers = agentFollowers[agent];
            for (const follower of followers) {
                if (!sources[follower]) {
                    sources[follower] = [];
                }
                sources[follower].push(agent);
            }
        }
    
        // Remove duplicates from each agent's source
        for (const agent in sources) {
            sources[agent] = [...new Set(sources[agent])];
        }
    
        return sources;
    }
    
    function chamberCheck() {
        const sources = buildSources(agentFollowers);
        const chambers = [...agents];
        const connectedChambers = [];
        console.log("psedochambers:", sources);
    
        // Remove agents with conflicting beliefs from their sources
        for (const agent of agents) {
            const agentBeliefSet = new Set(agentBeliefs[agent]); // Renamed to avoid shadowing
            const agentSources = sources[agent] || [];
    
            for (const source of agentSources) {
                const sourceBeliefs = new Set(agentBeliefs[source]);
                const conflictingProps = [...agentBeliefSet].filter(belief => sourceBeliefs.has(`~${belief.replace('~', '')}`));
    
                if (conflictingProps.length > 0) {
                    chambers.splice(chambers.indexOf(agent), 1);
                    break;
                }
            }
        }
    
        // Build connected chambers
        while (chambers.length > 0) {
            const currentAgent = chambers.pop();
            const connectedChamber = [currentAgent];
            const queue = [currentAgent];
    
            while (queue.length > 0) {
                const agent = queue.shift();
                const followers = agentFollowers[agent] || [];
    
                for (const follower of followers) {
                    if (chambers.includes(follower) && !connectedChamber.includes(follower)) {
                        connectedChamber.push(follower);
                        queue.push(follower);
                    }
                }
            }
    
            connectedChambers.push(connectedChamber);
        }
    
        console.log("connectedChambers:", connectedChambers);
    
        // Draw the chambers with different colors
        drawChambers(connectedChambers);
    }


     
*/