module.exports = class Placeholder {

    static reset() {
        this.counter = 1;
    }

    static increment() {
        return `$${this.counter++}`;
    }

}