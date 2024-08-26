// loadNavigationButtons.js

// Function to load the buttons.html file and inject it into the current page
function loadNavigationButtons() {
    fetch('../buttons.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('buttons-container').innerHTML = html;
        })
        .catch(error => console.error('Error loading navigation buttons:', error));
}
