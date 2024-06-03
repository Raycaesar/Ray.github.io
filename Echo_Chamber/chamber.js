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
        agents = Array.from({ length: agentSize }, (_, i) => `a${i}`);
        agents.forEach((agent, index) => {
            agentColors[agent] = colors[index % colors.length];
        });
    }

    function randomDistribution() {
        agentBeliefs = {};
        agentFollowers = {};

        agents.forEach(agent => {
            agentBeliefs[agent] = Math.random();
            const followers = agents.filter(() => Math.random() < 0.3);
            agentFollowers[agent] = followers;
        });

        drawNetwork();
    }

    function drawNetwork() {
        const width = chamber.width = window.innerWidth * 0.8;
        const height = chamber.height = window.innerHeight * 0.7;
        const radius = 20;
        const padding = 50;

        ctx.clearRect(0, 0, width, height);

        const agentPositions = agents.map((agent, i) => ({
            x: padding + (i * (width - 2 * padding)) / (agents.length - 1),
            y: height / 2,
        }));

        agentPositions.forEach(({ x, y }, i) => {
            const agent = agents[i];
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = agentColors[agent];
            ctx.fill();
            ctx.closePath();
        });

        agents.forEach((agent, i) => {
            const followers = agentFollowers[agent];
            if (followers && followers.length > 0) {
                const { x, y } = agentPositions[i];
                followers.forEach(follower => {
                    const { x: followerX, y: followerY } = agentPositions[agents.indexOf(follower)];
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(followerX, followerY);
                    ctx.strokeStyle = '#fff';
                    ctx.stroke();
                    ctx.closePath();
                });
            }
        });
    }
});