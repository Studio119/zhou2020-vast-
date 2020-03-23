/*
 * @Author: Antoine YANG 
 * @Date: 2019-11-15 21:47:38 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-23 23:49:28
 */

const express = require('express');
const app = express();
const process = require('child_process');
const fs = require("fs")
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


function formatResult(cmd, state, value) {
    return {
        command: cmd,
        state: state ? "successed" : "failed",
        value: value
    };
}

function parseCSV(b) {
    return decodeURI(b).split("\n").filter(d => d.includes(","));
}


app.get("/zs/:filepath", (req, res) => {
    const path = req.params["filepath"] === "temp"
                ? "..\\back-end\\temp_input.csv"
                : ".\\public\\data\\" + req.params["filepath"].split("_dot").join(".");
    const output_path = path.replace(".csv", "_zs.json").replace("\\data\\", "\\storage\\");
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    fs.readFile(output_path, {encoding: "utf-8"}, (err, data) => {
        if (err) {
            const cmd = "CHCP 65001 & .\\public\\cpp\\Z_Score < " + path + " > " + output_path;
            process.exec(cmd, (error, stdout, stderr) => {
                if (stderr) {
                    res.json(
                        formatResult(
                            cmd,
                            false,
                            stderr
                        )
                    );
                } else if (error) {
                    res.json(
                        formatResult(
                            cmd,
                            false,
                            error
                        )
                    );
                } else {
                    res.json(
                        formatResult(
                            cmd,
                            true,
                            JSON.parse(fs.readFileSync(output_path))
                        )
                    );
                }
            });
        } else {
            res.json(
                formatResult(
                    "get storage",
                    true,
                    JSON.parse(fs.readFileSync(output_path))
                )
            );
        }
    });
});


app.post("/take", (req, res) => {
    const body = JSON.parse(Object.keys(req.body)[0]);
    const file = body["dataset"];
    const sample = body["list"];
    const data = parseCSV(fs.readFileSync("./public/data/" + file));

    let items = [];
    
    for (let i = 0; i < sample.length; i++) {
        items.push(data[sample[i]]);
    }
    
    fs.writeFileSync("../back-end/temp_input.csv", items.join("\n"));
    
    res.json(
        formatResult(
            "take sample",
            true,
            true
        )
    );
});


const server = app.listen(2369, () => {
    const addr = server.address().address;
    const host = addr === "::" ? "127.0.0.1" : addr;
    const port = server.address().port;
    console.log("Back-end server opened at http://" + host + ":" + port);
});
