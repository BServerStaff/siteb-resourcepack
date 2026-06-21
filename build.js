#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const [, , srcArg, outArg, zipArg] = process.argv;

if (!srcArg || !outArg || !zipArg) {
	console.error("Usage: node build.js <srcDir> <outDir> <zipName>");
	process.exit(1);
}

const SRC = path.resolve(srcArg);
const OUT = path.resolve(outArg);
const ZIP = path.resolve(zipArg);
const ARTIFACT_IDS = [
	"vote_note",
	"two_birds_one_arrow",
	"big_size",
	"small_size",
	"head_bowl",
	"mob_silencer",
	"mob_unsilencer",
	"siteb_guidebook",
	"b_box"
];

if (SRC === OUT || SRC.startsWith(OUT + path.sep)) {
	console.error("Output directory must not contain the source directory.");
	process.exit(1);
}

function ensureDir(directory) {
	fs.mkdirSync(directory, { recursive: true });
}

function minifyJson(source, destination) {
	ensureDir(path.dirname(destination));
	const parsed = JSON.parse(fs.readFileSync(source, "utf8"));
	fs.writeFileSync(destination, JSON.stringify(parsed), "utf8");
}

function copyFile(source, destination) {
	ensureDir(path.dirname(destination));
	fs.copyFileSync(source, destination);
}

function walk(directory) {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		if (["node_modules", ".git", "dist", "build"].includes(entry.name)) {
			continue;
		}

		const source = path.join(directory, entry.name);
		const relative = path.relative(SRC, source);
		const destination = path.join(OUT, relative);

		if (entry.isDirectory()) {
			walk(source);
			continue;
		}
		if (!entry.isFile()) {
			continue;
		}

		const lowerName = entry.name.toLowerCase();
		if (lowerName.endsWith(".json") || lowerName.endsWith(".mcmeta")) {
			try {
				minifyJson(source, destination);
			} catch (error) {
				throw new Error(`Invalid JSON: ${relative}\n${error.message}`);
			}
		} else {
			copyFile(source, destination);
		}
	}
}

function validateArtifactDefinitions() {
	const root = path.join(SRC, "assets", "siteb", "items", "artifact");
	const missing = ARTIFACT_IDS.filter(
		id => !fs.existsSync(path.join(root, `${id}.json`))
	);
	if (missing.length > 0) {
		throw new Error(
			`Missing dinoCore artifact definitions: ${missing.join(", ")}`
		);
	}

	const plushieModelRoot = path.join(
		SRC,
		"assets",
		"siteb",
		"models",
		"item",
		"decoration",
		"plushies"
	);
	const plushieItemRoot = path.join(root, "plushie");
	const specialPlushieIds = {
		baby_ender_dragon_plushie: "baby_dragon",
		nm_adorable_trophy_gold: "first_place_trophy",
		nm_adorable_trophy_silver: "second_place_trophy",
		nm_adorable_trophy_bronze: "third_place_trophy"
	};
	const plushieIds = fs
		.readdirSync(plushieModelRoot)
		.filter(name => name.endsWith(".json"))
		.map(name => name.slice(0, -5))
		.filter(name => name !== "siteb-box")
		.map(name => {
			if (specialPlushieIds[name]) {
				return specialPlushieIds[name];
			}
			if (name.startsWith("plushie_")) {
				return name.slice("plushie_".length);
			}
			throw new Error(`Unmapped plushie model: ${name}`);
		});
	const missingPlushies = plushieIds.filter(
		id => !fs.existsSync(path.join(plushieItemRoot, `${id}.json`))
	);
	if (missingPlushies.length > 0) {
		throw new Error(
			`Missing plushie item definitions: ${missingPlushies.join(", ")}`
		);
	}
}

function zipFolder() {
	const installed7Zip = "C:\\Program Files\\7-Zip\\7z.exe";
	const executable =
		process.platform === "win32" && fs.existsSync(installed7Zip)
			? installed7Zip
			: "7z";

	console.log("Zipping with 7-Zip (maximum compression)...");
	const result = spawnSync(
		executable,
		[
			"a",
			"-tzip",
			"-mx=9",
			"-mfb=258",
			"-mpass=15",
			ZIP,
			"."
		],
		{ cwd: OUT, stdio: "inherit" }
	);

	if (result.error) {
		throw new Error("7-Zip was not found.");
	}
	if (result.status !== 0) {
		throw new Error("7-Zip compression failed.");
	}
}

function writeSha1(zipPath) {
	const sha1 = crypto
		.createHash("sha1")
		.update(fs.readFileSync(zipPath))
		.digest("hex");
	const output = path.join(process.cwd(), "sha1.txt");
	fs.writeFileSync(output, sha1 + "\n", "utf8");
	console.log(`SHA-1: ${sha1}`);
	console.log(`Written to: ${output}`);
}

try {
	validateArtifactDefinitions();
	fs.rmSync(OUT, { recursive: true, force: true });
	fs.rmSync(ZIP, { force: true });
	ensureDir(OUT);
	walk(SRC);
	zipFolder();
	writeSha1(ZIP);
	console.log(`Done.\nOutput folder: ${OUT}\nZip file: ${ZIP}`);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
