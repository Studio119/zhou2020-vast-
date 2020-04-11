/*
 * @Author: Antoine YANG 
 * @Date: 2019-11-15 21:47:38 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-11 15:41:16
 */

const express = require('express');
const app = express();
const fs = require("fs");
const process = require('child_process');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const pathInput = ".\\public\\data\\";
const pathOutput = "..\\storage\\";


function formatResult(cmd, state, value) {
    return {
        command: cmd,
        state: state ? "successed" : "failed",
        value: value
    };
}


app.get("/zs/:filepath", (req, res) => {
    if (req.params["filepath"] === "temp") {
        const path = pathOutput + "temp_input.csv";
        const output_path = pathOutput + "temp_output.json";
        res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
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
        const path = pathInput + req.params["filepath"].split("_dot").join(".");
        const output_path = path.replace(".csv", ".json").replace(pathInput, pathOutput);
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
    }
});


app.get("/get/:filepath", (req, res) => {
    const output_path = pathOutput + req.params["filepath"].replace("_dotcsv", "_m.json");
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    fs.readFile(output_path, {encoding: "utf-8"}, (err, data) => {
        if (err) {
            res.json(
                formatResult(
                    "get sampled",
                    false,
                    err
                )
            );
        } else {
            res.json(
                formatResult(
                    "get sampled",
                    true,
                    JSON.parse(data)
                )
            );
        }
    });
});


app.get("/random/:filepath/:rate", (req, res) => {
    const path = pathInput + req.params["filepath"].split("_dot").join(".");
    const output_path = path.replace(".csv", "_r.json").replace(pathInput, pathOutput);
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & .\\public\\cpp\\randomSample "
                    + req.params["rate"] + " < " + path + " > " + output_path;

    process.exec(cmd, (error, _, stderr) => {
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
});


app.get("/zorder/:filepath/:rate", (req, res) => {
    const path = pathInput + req.params["filepath"].split("_dot").join(".");
    const json_path = path.replace(".csv", ".json").replace(pathInput, pathOutput);
    const output_path = path.replace(".csv", "_z.json").replace(pathInput, pathOutput);
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & .\\public\\cpp\\nativeZOrder "
                    + req.params["rate"]
                    + " " + path + " < " + json_path + " > " + output_path;

    process.exec(cmd, (error, _, stderr) => {
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
});


const server = app.listen(2369, () => {
    const addr = server.address().address;
    const host = addr === "::" ? "127.0.0.1" : addr;
    const port = server.address().port;
    console.log("Back-end server opened at http://" + host + ":" + port);
});
