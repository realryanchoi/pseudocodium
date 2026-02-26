import { ConfigInterface, IndexInterface } from "./interfaces";
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
     * Loads a config file from an arbitrary absolute path.
     * Returns an empty {@link ConfigInterface} on any error (file missing, malformed JSON, etc.).
     * Never rejects.
     * @param filePath - Absolute path to the config file
     */
    static async loadFromPath(filePath: string): Promise<ConfigInterface> {
        try {
            const data = await fsp.readFile(filePath);
            return JSON.parse(data.toString()) as ConfigInterface;
        } catch {
            return {};
        }
    }

    /**
     * Merges multiple {@link IndexInterface} objects into one.
     * Arrays are unioned: all unique keywords from all sources are included.
     * Duplicates are removed; first-occurrence order is preserved.
     * @param indexes - Ordered from lowest to highest priority
     */
    static mergeIndexes(...indexes: IndexInterface[]): IndexInterface {
        const merged: IndexInterface = {};
        for (const idx of indexes) {
            for (const key of Object.keys(idx)) {
                if (!merged[key]) {
                    merged[key] = [];
                }
                for (const word of idx[key]) {
                    if (!merged[key].includes(word)) {
                        merged[key].push(word);
                    }
                }
            }
        }
        return merged;
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
