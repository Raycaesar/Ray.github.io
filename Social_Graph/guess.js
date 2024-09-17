let agentFollowers = {};
let agentBeliefs = {
    b: { messages: ['(~p+q)'], denotation: '(~p+q)' },
    c: { messages: ['(~p+~q)'], denotation: '(~p+~q)' }
};

// Assign a random follower to agent 'a'
function generateRandomFollower() {
    const possibleFollowers = ['b', 'c'];
    const randomIndex = Math.floor(Math.random() * possibleFollowers.length);
    const follower = possibleFollowers[randomIndex];
    agentFollowers['a'] = [follower];
    console.log("Follower of agent a:", follower);
}

// Hide the strongest beliefs initially
function hideStrongestBeliefs() {
    document.getElementById('beliefB').innerText = '???';
    document.getElementById('beliefC').innerText = '???';
}

// Display the strongest beliefs of agents when clicked
function checkStrongestBeliefs() {
    document.getElementById('beliefB').innerText = agentBeliefs.b.denotation || 'No beliefs';
    document.getElementById('beliefC').innerText = agentBeliefs.c.denotation || 'No beliefs';
}

// Update the model when an announcement is made and hide beliefs again
function handleUpdateModelClick() {
    const announcement = document.getElementById("beliefupdate").value;
    if (announcement.trim()) {
        updatedmodels(announcement);  // Process the announcement and update agent beliefs
        hideStrongestBeliefs();  // Hide the beliefs after updating
    }
}

// Update agent beliefs based on announcement
function updatedmodels(announcement) {
    const follower = agentFollowers['a'][0];  // Retrieve the follower of 'a'
    
    if (announcement === '[a:p]') {
        if (follower === 'b') {
            agentBeliefs.b.denotation = '(p&q)';  // Update b's belief
        } else {
            agentBeliefs.c.denotation = '(p&~q)'; // Update c's belief
        }
    }
}

// Function to guess who the follower is
function guessFollower(guess) {
    const follower = agentFollowers['a'][0];
    if (guess === follower) {
        document.getElementById("result").innerHTML = "Correct! Agent " + guess + " is the follower.";
    } else {
        document.getElementById("result").innerHTML = "Wrong guess. Try again!";
    }
}

// Initialize the game
generateRandomFollower();
hideStrongestBeliefs();
