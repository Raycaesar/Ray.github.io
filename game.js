
let isGameOver = false;

window.addEventListener('resize', function() {
    updateGraph();
});

class Card {
 
    constructor(suit, value) {
        this.suit = suit;  // Suit of the card (e.g., Hearts, Diamonds, etc.)
        this.value = value;  // Value of the card (e.g., 2, 3, J, Q, etc.)
    }

    toString() {
       
        const suitMap = {'Hearts': 'H', 'Diamonds': 'D', 'Clubs': 'C', 'Spades': 'S'};
        return `${suitMap[this.suit]}${this.value}`;
    }
}


class Player {
    constructor(name) {
        this.name = name;  // Name of the player (e.g., 'a', 'b', etc.)
        this.cards = [];  // Cards held by the player
        this.followers = new Set();  // Set of players that this player is following
        this.beliefs = [];  // Cards that the player believes to be true based on announcements
        this.announcements = [];  // Cards that the player has announced
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

// Define the suits and values for the cards
const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const deck = [];  

// Populate the deck with cards for each suit and value combination
for (let suit of suits) {
    for (let value of values) {
        deck.push(new Card(suit, value));
    }
}
// Shuffle the deck to randomize the order of cards
shuffle(deck);

// Create players with names 'a', 'b', 'c', and 'd'
const players = ['a', 'b', 'c', 'd'].map(name => new Player(name));
// Distribute cards to players and set up initial followers
for (let player of players) {
    player.receiveCards(deck.splice(0, 13));  // Each player receives 13 cards
    for (let otherPlayer of players) {
        if (player !== otherPlayer) {
            player.addFollower(otherPlayer);  // Each player follows every other player initially
        }
    }
}

// Index to keep track of the current player's turn
let currentPlayerIndex = 0;

// Function to shuffle an array (used for shuffling the deck)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
}

// Function to determine the color of a card (red or black)
function getColorOfCard(card) {
    return (card.suit === 'Hearts' || card.suit === 'Diamonds') ? 'red' : 'black';
}

function believesColor(player, color) {
    for (let card of [...player.cards, ...player.beliefs]) {
        if (getColorOfCard(card) === color) {
            return true;
        }
    }
    return false;
}

function announceCard(player, card) {
    const announcedColor = getColorOfCard(card);  // Determine the color of the announced card
    const oppositeColor = announcedColor === 'red' ? 'black' : 'red';  // Determine the opposite color

    const cardIndex = player.cards.findIndex(c => c.suit === card.suit && c.value === card.value);
    if (cardIndex > -1) {
        player.cards.splice(cardIndex, 1);
    }


    player.announcements.push(card);


    for (let otherPlayer of players) {
        if (otherPlayer !== player) {
            const hasOppositeColorSameNumber = otherPlayer.cards.some(c => c.value === card.value && getColorOfCard(c) !== announcedColor);
            

            if (player.followers.has(otherPlayer.name) && hasOppositeColorSameNumber) {
                player.followers.delete(otherPlayer.name);
            }
    
            if (!player.followers.has(otherPlayer.name) && otherPlayer.cards.some(c => c.value === card.value && getColorOfCard(c) === announcedColor)) {
                player.followers.add(otherPlayer.name);
            }
        }
    }

    // Update beliefs based on announcements from players they follow
    for (let otherPlayer of players) {
        if (player.followers.has(otherPlayer.name)) {
            for (let belief of otherPlayer.announcements) {
                if (!player.beliefs.some(b => b.suit === belief.suit && b.value === belief.value)) {
                    player.beliefs.push(belief);
                }
            }
        }
    }

    // Check for defeated players (players with no followers)
    for (let p of players) {
        if (p.followers.size === 0) {
            defeatPlayer(p);
        }
    }

    // Update the graph and belief state
    updateGraph();
    updateBeliefState(player);
}

// Function to handle the next player's turn
function nextPlayerTurn() {
    if (isGameOver) {
        return;
    }

    const player = players[currentPlayerIndex];

    document.getElementById('announcement').textContent = `${player.name}'s turn to announce a card.`;

    populateCardSelection(player);

    document.getElementById('cardSelection').style.display = 'block';

    updateBeliefState(player);
}

// Function to display the current belief state of a player
function updateBeliefState(player) {
    const beliefStateDiv = document.getElementById('beliefState');
    beliefStateDiv.innerHTML = `<strong>${player.name}'s Belief State:</strong><br>`;
    beliefStateDiv.innerHTML += 'Cards: ' + player.cards.map(card => card.toString()).join(', ') + '<br>';
    beliefStateDiv.innerHTML += 'Announced: ' + player.announcements.map(card => card.toString()).join(', ') + '<br>';
    beliefStateDiv.innerHTML += 'Beliefs from others: ';
    let beliefsFromOthers = [];
    for (let otherPlayer of players) {
        if (player.followers.has(otherPlayer.name)) {
            beliefsFromOthers.push(...otherPlayer.announcements);
        }
    }
    beliefStateDiv.innerHTML += [...new Set(beliefsFromOthers)].map(card => card.toString()).join(', ') + '; ';
}

// Function to populate the card selection form for a player
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
            document.getElementById('cardSelection').style.display = 'none';
            if (!isGameOver) {
                currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
            }
            updateGraph();
        };
        const label = document.createElement('label');
        label.htmlFor = card.toString();
        label.textContent = card.toString();
        form.appendChild(radio);
        form.appendChild(label);
        form.appendChild(document.createElement('br'));
    }
}

// Function to handle the defeat of a player
function defeatPlayer(defeatedPlayer) {
    const index = players.indexOf(defeatedPlayer);
    if (index > -1) {
        players.splice(index, 1);
    }

    for (let player of players) {
        player.followers.delete(defeatedPlayer.name);
    }

    const announcementDiv = document.getElementById('announcement');
    announcementDiv.textContent = `${defeatedPlayer.name} is defeated! Click 'Next Player' to continue.`;

    if (players.length === 1) {
        announcementDiv.textContent = `Game Over! ${players[0].name} is the winner!`;
        isGameOver = true;
    }
}

// Function to update the graph visualization
function updateGraph() {
    const nodes = players.map(player => ({
        id: player.name,
        label: player.name,
        color: {
            background: currentPlayerIndex === players.indexOf(player) ? '#FFD700' : '#CDFAD5',
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

// Initialize the graph and start the game with the first player's turn
updateGraph();
nextPlayerTurn();
