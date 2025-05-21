const States = {
    PRESTART: 'prestart',
    RUNNING: 'running',
    GAMEOVER: 'gameover',
    PAUSED: 'paused'
};

class StateMachine {
    constructor(initialState, scene) {
        this.currentState = initialState;
        this.scene = scene; // Reference to the Phaser scene for context if needed
        this.states = {};
    }

    addState(name, config) {
        this.states[name] = config;
    }

    setState(name) {
        if (!this.states[name]) {
            console.warn(`State '${name}' not found.`);
            return;
        }

        if (this.currentState && this.states[this.currentState].onExit) {
            this.states[this.currentState].onExit(this.scene);
        }

        console.log(`Changing state from '${this.currentState}' to '${name}'`);
        this.currentState = name;

        if (this.states[this.currentState].onEnter) {
            this.states[this.currentState].onEnter(this.scene);
        }
    }

    update(time, delta) {
        if (this.currentState && this.states[this.currentState] && this.states[this.currentState].onUpdate) {
            this.states[this.currentState].onUpdate(this.scene, time, delta);
        }
    }

    getCurrentState() {
        return this.currentState;
    }
}

export { StateMachine, States }; 