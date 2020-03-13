/*
 * @Author: Antoine YANG 
 * @Date: 2019-11-15 21:47:38 
 * @Last Modified by: Antoine YANG
 * @Last Modified time: 2020-03-13 20:30:34
 */

const express = require('express');
const app = express();
const process = require('child_process');
const fs = require("fs")


let path = "./";
let originPath = "./";

let venv = null;


function formatResult(cmd, state, value) {
    return {
        command: cmd,
        state: state ? "successed" : "failed",
        value: value
    };
}


app.get("/command/:cmd", (req, res) => {
    const cmd = req.params["cmd"].split("_blc").join(" ")
                                .split("_sep").join("/")
                                .split("_dot").join(".")
                                .split("_init").join("cd " + originPath + " & conda deactivate");
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    process.exec(
        "cd " + path
            + " & CHCP 65001 "
            + " & " + (
                venv ? (" conda activate " + venv + " & ") : ""
            ) + cmd
            + " & CHCP & cd & CHCP"
            , (error, stdout, stderr) => {
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
                    JSON.parse(fs.readFileSync("../back-end/temp_output.json"))
                )
            );
            if (stdout.split("Active code page: 65001")[2]) {
                const o = stdout.split("Active code page: 65001")[2].split("\r\n");
                for (let i = 0; i < o.length; i++) {
                    if (o[i].length) {
                        path = o[i];
                        break;
                    }
                }
            }
            if (cmd === "conda deactivate") {
                venv = null;
            } else if (cmd.startsWith("conda activate ")) {
                venv = cmd.replace("conda activate ", "");
            }
        }
    });
});


const server = app.listen(2369, () => {
    const addr = server.address().address;
    const host = addr === "::" ? "127.0.0.1" : addr;
    const port = server.address().port;
    console.log("Back-end server opened at http://" + host + ":" + port);

    process.exec("cd", (error, stdout, stderr) => {
        if (stdout) {
            originPath = stdout.replace("\r\n", "");
        }
    });
});
