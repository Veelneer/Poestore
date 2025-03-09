let recognizedText = "";

function processImage() {
    let input = document.getElementById('imageInput');
    if (input.files.length === 0) {
        alert("Please select an image!");
        return;
    }
    processImageFile(input.files[0]);
}

function processImageFile(image) {
    let outputDiv = document.getElementById('output');

    Tesseract.recognize(
        image,
        'eng', 
        { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
        recognizedText = text.trim();
        outputDiv.innerHTML = text.split("\n").map(line => `<p>${line}</p>`).join('');
    }).catch(err => {
        outputDiv.innerHTML = "<p style='color:red;'>Recognition error</p>";
        console.error(err);
    });
}

function searchPoE() {
    if (!recognizedText) {
        alert("Please recognize text first!");
        return;
    }

    let searchFilters = parsePoEText(recognizedText);
    let query = createPoETradeQuery(searchFilters);

    fetch("http://localhost:3000/search-poe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            let tradeSearchUrl = `https://www.pathofexile.com/trade/search/poe2/${data.searchId}`;
            window.open(tradeSearchUrl, "_blank");
        } else {
            alert("Failed to generate search ID");
        }
    })
    .catch(error => console.error("Error:", error));
}

function parsePoEText(text) {
    let lines = text.split("\n");
    let filters = [];

    lines.forEach(line => {
        if (line.includes("+") || line.includes("%")) {
            filters.push({ stat: line.trim() });
        }
    });

    return filters;
}

function createPoETradeQuery(filters) {
    let query = {
        query: {
            status: { option: "online" },
            stats: [{ type: "and", filters: [] }]
        },
        sort: { price: "asc" }
    };

    filters.forEach(filter => {
        query.query.stats[0].filters.push({
            id: "explicit.stat",
            value: { min: parseFloat(filter.stat) || 0 }
        });
    });

    return query;
}