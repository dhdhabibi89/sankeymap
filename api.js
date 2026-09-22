const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 3000;

const server = http.createServer((req, res) => {
    if (req.url === "/api/routes") {
        const data = fs.readFileSync(
            path.join(__dirname, "data.json"),
            "utf8"
        );

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });

        res.end(data);
        return;
    }

    if (req.url === "/" || req.url === "/index.html") {
        const file = fs.readFileSync(
            path.join(__dirname, "index.html")
        );

        res.writeHead(200, {
            "Content-Type": "text/html"
        });

        res.end(file);
        return;
    }

    if (req.url === "/style.css") {
        const file = fs.readFileSync(
            path.join(__dirname, "style.css")
        );

        res.writeHead(200, {
            "Content-Type": "text/css"
        });

        res.end(file);
        return;
    }

    if (req.url === "/script.js") {
        const file = fs.readFileSync(
            path.join(__dirname, "script.js")
        );

        res.writeHead(200, {
            "Content-Type": "application/javascript"
        });

        res.end(file);
        return;
    }

    res.writeHead(404);
    res.end("Not Found");
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});