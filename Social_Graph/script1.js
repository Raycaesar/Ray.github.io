// setup
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gradient = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 100, canvas.width * 0.5, canvas.height * 0.5, 600)
gradient.addColorStop(0, "white");
gradient.addColorStop(0.05, "#bbcabb");
gradient.addColorStop(0.25, 'cyan');
gradient.addColorStop(0.5, 'magenta');
gradient.addColorStop(0.75, 'aqua');
gradient.addColorStop(0.85, 'lime');
gradient.addColorStop(1, 'gold');

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.strokeStyle = 'white';

class Particle {
    constructor(effect, index, agentName) {
        this.effect = effect;
        this.index = index;
        this.agentName = agentName;
        this.radius = 30;
        this.minRadius = this.radius;
        this.maxRadius = this.radius * 10;
        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);
        this.vx = Math.random() * 1 - 0.5;
        this.vy = Math.random() * 1 - 0.5;
        this.pushX = 0;
        this.pushY = 0;
        this.friction = 0.95;
        this.isMouseOver = false;
    }

    draw(context) {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        // Draw agent name
        const agentNameText = this.agentName;
        const agentNameFontSize = 20;
        context.font = `bold ${agentNameFontSize}px Arial`;
        const agentNameTextWidth = context.measureText(agentNameText).width;
        const agentNameTextHeight = agentNameFontSize;

        if (this.radius === 30) {
            // Draw agent name at the center
            context.fillStyle = 'navy';
            context.fillRect(this.x - agentNameTextWidth / 2 - 5, this.y - agentNameTextHeight / 2 - 2, agentNameTextWidth + 10, agentNameTextHeight + 4);
            context.fillStyle = gradient;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(agentNameText, this.x, this.y);
        } else if (this.radius === 60) {
            // Draw agent name at the top-left
            const padding = 5;
            context.fillStyle = 'navy';
            context.fillRect(this.x - agentNameTextWidth / 2 - 5, this.y - this.radius + 2*padding, agentNameTextWidth+2*padding, agentNameTextHeight);
            context.fillStyle = gradient;
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fillText(agentNameText, this.x-padding, this.y - this.radius + 2*padding);

            // Draw strongest belief at the center
            const strongestBeliefText = 'Strongest Belief';
            const strongestBeliefFontSize = 18;
            context.font = `bold ${strongestBeliefFontSize}px Arial`;
            const strongestBeliefTextWidth = context.measureText(strongestBeliefText).width;
            const strongestBeliefTextHeight = strongestBeliefFontSize;

            
            context.fillStyle = 'navy';
            context.fillRect(this.x - strongestBeliefTextWidth / 2 - padding, this.y - strongestBeliefTextHeight / 2 - padding, strongestBeliefTextWidth + 2 * padding, strongestBeliefTextHeight + 2 * padding);
            context.fillStyle = gradient;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(strongestBeliefText, this.x, this.y);
        }
    }

    strongestBeliefs(belief) {
        this.belief = belief;
    }

    update() {
        if ( this.isMouseOver &&this.effect.mouse.pressed) {  /*this.isMouseOver &&*/
            this.radius = 60;
        } else {
            this.radius = 30;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx *= -1;
        } else if (this.x > this.effect.width - this.radius) {
            this.x = this.effect.width - this.radius;
            this.vx *= -1;
        }
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y > this.effect.height - this.radius) {
            this.y = this.effect.height - this.radius;
            this.vy *= -1;
        }
    }
}

class Effect {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.particles = [];
        this.numberOfParticles;
        this.createParticles();

        this.mouse = {
            x: this.width * 0.5,
            y: this.height * 0.5,
            pressed: false,
            radius: 60
        }

        window.addEventListener('resize', e => {
            this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
        });
        window.addEventListener('mousemove', e => {
            if (this.mouse.pressed) {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            }
            this.checkMouseOverParticles(e.x, e.y);
        });
        window.addEventListener('mousedown', e => {
            this.mouse.pressed = !this.mouse.pressed;
            this.mouse.x = e.x;
            this.mouse.y = e.y;
            this.checkMouseOverParticles(e.x, e.y);
        });

        /*
        window.addEventListener('mouseup', e => {
            this.mouse.pressed = false;
            this.resetParticleRadii();
        });
        */

    }

    setNumberOfParticles(agentNames) {
        this.numberOfParticles = agentNames.length;
        this.agentNames = agentNames;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < this.numberOfParticles; i++) {
            this.particles.push(new Particle(this, i, this.agentNames[i]));
        }
    }

    drawNetwork(agentFollowers) {
        const context = this.context;
        const particles = this.particles;

        context.strokeStyle = 'white';
        context.lineWidth = 0.8;

        for (const follower in agentFollowers) {
            const followerIndex = particles.findIndex(p => p.agentName === follower);
            if (followerIndex === -1) continue;

            const followerParticle = particles[followerIndex];

            for (const followee of agentFollowers[follower]) {
                if (follower === followee) {
                    // Draw a circle around the particle
                    context.beginPath();
                    context.arc(followerParticle.x, followerParticle.y, followerParticle.radius + 5, 0, 2 * Math.PI);
                    context.stroke();
                    continue; // Skip the rest of the loop
                }

                const followeeIndex = particles.findIndex(p => p.agentName === followee);
                if (followeeIndex === -1) continue;

                const followeeParticle = particles[followeeIndex];

                // Calculate the direction vector from follower to followee
                const dx = followeeParticle.x - followerParticle.x;
                const dy = followeeParticle.y - followerParticle.y;
                const distance = Math.hypot(dx, dy);
                const directionX = dx / distance;
                const directionY = dy / distance;

                // Calculate the start and end points of the line
                const startX = followerParticle.x + followerParticle.radius * directionX;
                const startY = followerParticle.y + followerParticle.radius * directionY;
                const endX = followeeParticle.x - followeeParticle.radius * directionX;
                const endY = followeeParticle.y - followeeParticle.radius * directionY;

                // Draw the line
                context.beginPath();
                context.moveTo(startX, startY);
                context.lineTo(endX, endY);
                context.stroke();

                // Draw an arrowhead
                const angle = Math.atan2(-dy, -dx);
                const arrowLength = 10;

                context.moveTo(startX, startY);
                context.lineTo(startX - arrowLength * Math.cos(angle - Math.PI / 6), startY - arrowLength * Math.sin(angle - Math.PI / 6));
                context.moveTo(startX, startY);
                context.lineTo(startX - arrowLength * Math.cos(angle + Math.PI / 6), startY - arrowLength * Math.sin(angle + Math.PI / 6));
                context.stroke();
            }
        }
    }

    resetParticles() {
        this.particles = [];
        this.createParticles();
    }
/*
    resetParticleRadii() {
        this.particles.forEach(particle => {
            particle.radius = 30;
        });
    }*/

    checkMouseOverParticles(x, y) {
        this.particles.forEach(particle => {
            const dx = particle.x - x;
            const dy = particle.y - y;
            const distance = Math.hypot(dx, dy);
            particle.isMouseOver = distance < particle.radius;
        });
    }

    handleParticles(context) {
        this.connectParticles(context);
        this.particles.forEach(particle => {
            particle.draw(context);
            particle.update();
        });
        this.drawNetwork(agentFollowers);
    }

    connectParticles(context) {
        const maxDistance = 80;
        for (let a = 0; a < this.particles.length; a++) {
            for (let b = a; b < this.particles.length; b++) {
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const distance = Math.hypot(dx, dy);
                if (distance < maxDistance) {
                    context.save();
                    const opacity = 1 - (distance / maxDistance);
                    context.globalAlpha = opacity;
                    context.beginPath();
                    context.moveTo(this.particles[a].x, this.particles[a].y);
                    context.lineTo(this.particles[b].x, this.particles[b].y);
                    context.stroke();
                    context.restore();
                }
            }
        }
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        const gradient = this.context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.5, 'gold');
        gradient.addColorStop(1, 'orangered');
        this.context.fillStyle = gradient;
        this.context.strokeStyle = 'white';
    }
}

function handleParseFunction() {
    return {
        setNumberOfParticles: (agentNames) => {
            window.effect.setNumberOfParticles(agentNames);
        },
        resetParticles: () => {
            window.effect.resetParticles();
        },
        strongestBeliefs: (belief) => {
            window.effect.strongestBeliefs(belief);
        }
        
       
    };
}
/* resetParticles: () => {
            window.effect.resetParticles();
        }
,
       
        */
// Create an instance of the Effect class after it's defined
window.effect = new Effect(canvas, ctx);


// Move the rest of the code after the handleParseFunction
console.log(ctx);

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    window.effect.handleParticles(ctx);
    requestAnimationFrame(animate);
}
animate();