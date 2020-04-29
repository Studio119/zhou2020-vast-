/*
 * @Author: Antoine YANG 
 * @Date: 2019-11-15 21:47:38 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-04-30 01:23:30
 */

const express = require('express');
const app = express();
const fs = require("fs");
const process = require('child_process');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
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


app.get("/zorder_temp", (_, res) => {
    const path = pathOutput + "zorder_temp.json";
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    fs.readFile(path, {encoding: "utf-8"}, (err, data) => {
        if (err) {
            res.json(
                formatResult(
                    "zorder_temp",
                    false,
                    err
                )
            );
        } else {
            res.json(
                formatResult(
                    "zorder_temp",
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


app.get("/bns/:filepath/:radius", (req, res) => {
    const path = pathInput + req.params["filepath"].split("_dot").join(".");
    const json_path = path.replace(".csv", ".json").replace(pathInput, pathOutput);
    const output_path = path.replace(".csv", "_b.json").replace(pathInput, pathOutput);
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & conda activate base & python .\\public\\py\\bns.py"
                    + " " + json_path
                    + " " + req.params["radius"];

    res.json(
        formatResult(
            cmd,
            true,
            JSON.parse(fs.readFileSync(output_path))
        )
    );

    // process.exec(cmd, (error, _, stderr) => {
    //     if (stderr) {
    //         res.json(
    //             formatResult(
    //                 cmd,
    //                 false,
    //                 stderr
    //             )
    //         );
    //     } else if (error) {
    //         res.json(
    //             formatResult(
    //                 cmd,
    //                 false,
    //                 error
    //             )
    //         );
    //     } else {
    //         res.json(
    //             formatResult(
    //                 cmd,
    //                 true,
    //                 JSON.parse(fs.readFileSync(output_path))
    //             )
    //         );
    //     }
    // });
});


app.get("/ours/:filepath/:alpha/:rate", (req, res) => {
    const path = pathInput + req.params["filepath"].split("_dot").join(".");
    const json_path = path.replace(".csv", ".json").replace(pathInput, pathOutput);
    const output_path = path.replace(".csv", "_o.json").replace(pathInput, pathOutput);
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & conda activate base & python .\\public\\py\\ours.py"
                    + " " + json_path
                    + " " + req.params["alpha"]
                    + " " + req.params["rate"];

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


app.get("/better/:filepath/:n_iter", (req, res) => {
    const path = pathInput + req.params["filepath"].split("_dot").join(".");
    const ori_path = path.replace(".csv", ".json").replace(pathInput, pathOutput);
    const json_path = path.replace(".csv", "_o.json").replace(pathInput, pathOutput);
    const output_path = json_path.replace("_o.json", "_ob.json");
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & conda activate base & python .\\public\\py\\better.py"
                    + " " + json_path + " " + ori_path + " " + 0.6 + " " + req.params["n_iter"];

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


app.get("/test/:datasetName/:pIndex/:pList/:tail", (req, res) => {
    const datasetName = req.params["datasetName"];
    const pIndex = req.params["pIndex"];
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & conda activate base & python .\\public\\py\\updateOnline.py"
                    + " " + datasetName + " " + pIndex
                    + " " + req.params["pList"] + " " + req.params["tail"];

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
            const arr = stdout.split("\n")[1].toLowerCase().split("'").join('"');
            // console.log(formatResult(
            //     cmd,
            //     true,
            //     JSON.parse(arr)
            // ));
            res.json(
                formatResult(
                    cmd,
                    true,
                    JSON.parse(arr)
                )
            );
        }
    });
});


app.get("/replace/:datasetName/:from/:to", (req, res) => {
    const datasetName = req.params["datasetName"];
    const from = req.params["from"];
    const to = req.params["to"];
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & .\\public\\cpp\\replace.exe "
                    + " " + from + " " + to
                    + " " + "..\\storage\\" + datasetName + "_o.json"
                    + " " + "..\\storage\\" + datasetName + "_o.json"
                    + " < .\\public\\data\\" + datasetName + ".csv";

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
                    JSON.parse(fs.readFileSync("..\\storage\\" + datasetName + "_o.json"))
                )
            );
        }
    });
});


app.get("/noreplace/:datasetName/:from/:to", (req, res) => {
    const datasetName = req.params["datasetName"];
    const from = req.params["from"];
    const to = req.params["to"];
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const cmd = "CHCP 65001 & .\\public\\cpp\\replace.exe "
                    + " " + from + " " + to
                    + " " + "..\\storage\\" + datasetName + "_o.json"
                    + " " + "..\\storage\\" + datasetName + "_o_temp.json"
                    + " < .\\public\\data\\" + datasetName + ".csv";

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
                    JSON.parse(fs.readFileSync("..\\storage\\" + datasetName + "_o.json"))
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
