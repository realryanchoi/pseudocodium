import { ConfigInterface } from "./interfaces";
import { homedir as osHomedir } from "os";
import { join as joinPath } from "path";
import { promises as fsp } from "fs";

/**
 * Config class which handles the .pseudoconfig file in the home directory
 */
export class Config {
    /** Stores the config file in JSON format */
    private _config: ConfigInterface;
    /** Read-only access to the config file in JSON format */
    get config(): ConfigInterface {
        return this._config;
    }

    /**
     * Constructor for {@link Config}
     * @param callback - Invoked after config loading completes (whether or not the file exists)
     */
    constructor(callback: () => void) {
        this._config = {};
        this.findConfigFile(callback);
    }

    /**
     * Finds and loads the config file from the user's home directory.
     * Always invokes {@link callback} on completion, even if no config file is found.
     * @param callback - Invoked after config loading completes
     */
    findConfigFile(callback: () => void): void {
        const homeDirectory = osHomedir();
        const homeDirFile = joinPath(homeDirectory, ".pseudoconfig");

        fsp.readFile(homeDirFile)
            .then(data => {
                this._config = JSON.parse(data.toString());
                callback();
            })
            .catch(() => {
                console.log("Pseudocode: No .pseudoconfig file found, using defaults");
                callback();
            });
    }
}
