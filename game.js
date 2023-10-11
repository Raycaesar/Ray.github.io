// game.js
let isGameOver = false;


window.addEventListener('resize', function() {
    // Any operations or adjustments you want to perform when the window is resized
    updateGraph(); // Optionally, you can call updateGraph to refresh the network
});
// Define Card and Player classes
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
    }
    toString() {
        const suitMap = {'Hearts': 'H', 'Diamonds': 'D', 'Clubs': 'C', 'Spades': 'S'};
        return `${suitMap[this.suit]}${this.value}`;
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.cards = [];
        this.followers = new Set();
        this.beliefs = [];
    }
    receiveCards(cards) {
        this.cards = cards;
    }
    addFollower(player) {
        this.followers.add(player.name);
    }
    removeFollower(player) {
        this.followers.delete(player.name);
    }
}

// Initialize game variables
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const deck = [];
for (let suit of suits) {
    for (let value of values) {
        deck.push(new Card(suit, value));
    }
}
shuffle(deck);

const players = ['a', 'b', 'c', 'd'].map(name => new Player(name));
for (let player of players) {
    player.receiveCards(deck.splice(0, 13));
    for (let otherPlayer of players) {
        if (player !== otherPlayer) {
            player.addFollower(otherPlayer);
        }
    }
}

let currentPlayerIndex = 0;

// Define game functions
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function updateGraph() {
    const nodes = players.map(player => ({id: player.name, label: player.name}));
    const edges = [];
    for (let player of players) {
        for (let follower of player.followers) {
            edges.push({from: follower, to: player.name, arrows: 'to'});
        }
    }
    const container = document.getElementById('network');
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    const options = {};
    new vis.Network(container, data, options);
}

function nextPlayerTurn() {
    if (isGameOver) {
        return; // If the game is over, don't proceed to the next player's turn
    }
    const player = players[currentPlayerIndex];
    document.getElementById('announcement').textContent = `${player.name}'s turn to announce a card.`;
    populateCardSelection(player);
    document.getElementById('cardSelection').style.display = 'block';
    updateBeliefState(players[currentPlayerIndex]);
}


function populateCardSelection(player) {
    const form = document.getElementById('cardForm');
    form.innerHTML = '';
    for (let card of player.cards) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'cardChoice';
        radio.value = card.toString();
        radio.id = card.toString();
        radio.onchange = () => {
            announceCard(player, card);
            document.getElementById('cardSelection').style.display = 'none';  // Hide card selection after announcing
            if (!isGameOver) {
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            }
            updateGraph();  // Update the graph here after incrementing currentPlayerIndex
        };
        const label = document.createElement('label');
        label.htmlFor = card.toString();
        label.textContent = card.toString();
        form.appendChild(radio);
        form.appendChild(label);
        form.appendChild(document.createElement('br'));
    }
}

function updateBeliefState(player) {
    const beliefStateDiv = document.getElementById('beliefState');
    beliefStateDiv.innerHTML = `<strong>${player.name}'s Belief State:</strong><br>`;
    beliefStateDiv.innerHTML += 'Cards: ' + player.cards.join(', ') + '<br>';
    beliefStateDiv.innerHTML += 'Announced: ' + [...new Set(player.beliefs)].join(', ') + '<br>';
    beliefStateDiv.innerHTML += 'Beliefs from others: ';
    let beliefsFromOthers = [];
    for (let otherPlayer of players) {
        if (player.followers.has(otherPlayer.name)) {
            beliefsFromOthers.push(...otherPlayer.beliefs);
        }
    }
    beliefStateDiv.innerHTML += [...new Set(beliefsFromOthers)].join(', ') + '; ';
}

function announceCard(player, card) {
    const announcedSuit = card.suit;
    const announcedValue = card.value;

    // Remove the announced card from the player's hand
    const cardIndex = player.cards.findIndex(c => c.suit === announcedSuit && c.value === announcedValue);
    if (cardIndex > -1) {
        player.cards.splice(cardIndex, 1);
    }

    // Update beliefs based on announcements from players they follow
    for (let otherPlayer of players) {
        if (player.followers.has(otherPlayer.name)) {
            for (let belief of otherPlayer.beliefs) {
                if (belief.suit !== card.suit && belief.value === card.value && !player.cards.some(c => c.suit === card.suit && c.value === card.value)) {
                    player.followers.delete(otherPlayer.name);
                    break;
                } else if (!player.beliefs.includes(belief)) {
                    player.beliefs.push(belief);
                }
            }
        }
    }

    // Add the announced card to the player's beliefs
    player.beliefs.push(card);

    // Check for defeated players
    for (let p of players) {
        if (p.followers.size === 0) {
            defeatPlayer(p);
        }
    }

}

function defeatPlayer(defeatedPlayer) {
    // Remove the defeated player from the game
    const index = players.indexOf(defeatedPlayer);
    if (index > -1) {
        players.splice(index, 1);
    }

    // Remove the defeated player from other players' followers
    for (let player of players) {
        player.followers.delete(defeatedPlayer.name);
    }

    // Display the defeated player's name in the announcement div
    const announcementDiv = document.getElementById('announcement');
    announcementDiv.textContent = `${defeatedPlayer.name} is defeated! Click 'Next Player' to continue.`;

    // Check if only one player remains
    if (players.length === 1) {
        announcementDiv.textContent = `Game Over! ${players[0].name} is the winner!`;
        isGameOver = true;
    }
}

// Initialize the game
function updateGraph() {
    const nodes = players.map(player => ({
        id: player.name,
        label: player.name,
        color: {
            background: currentPlayerIndex === players.indexOf(player) ? '#FFD700' : '#CDFAD5', // Highlight current player
            border: '#F6FDC3'
        },
        borderWidth: 1.5,
        size: 40,
        font: {
            color: '#343434',
            size: 18,
            bold: currentPlayerIndex === players.indexOf(player)
        }
    }));

    const edges = [];
    for (let player of players) {
        for (let follower of player.followers) {
            edges.push({
                from: follower,
                to: player.name,
                arrows: 'to',
                width: 0.5,
                color: {color:'#201E20', highlight:'#0ae0f0', hover: '#7A2048'},
                smooth: {
                    "type": "continuous",

                    "roundness": 0.30,
                }
            });
        }
    }

    const container = document.getElementById('network');
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    const options = {
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 120,
                springConstant: 0.05,
                damping: 0.09,
                avoidOverlap: 0.1
            },
            stabilization: {iterations: 250}
        },
        interaction: {
            hover: true,
            tooltipDelay: 200
        }
    };
    new vis.Network(container, data, options);
}


updateGraph();
nextPlayerTurn();
