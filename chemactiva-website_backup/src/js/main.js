// src/js/main.js
// src/js/main.js
console.log('--- MAIN.JS EXECUTING ---'); // <<< ADD THIS AS THE VERY FIRST LINE
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});