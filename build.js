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
	"large_size",
	"small_size",
	"head_bowl",
	"mob_silencer",
	"mob_unsilencer",
	"siteb_guidebook",
	"random_plushie_box"
];
const SHOP_CATEGORY_IDS = [
	"season_2_tags",
	"season_3_tags",
	"season_4_tags",
	"pokemon_tags",
	"misc",
	"plushies"
];
const SHOP_CATEGORY_MATERIALS = {
	season_2_tags: "creeper_banner_pattern",
	season_3_tags: "skull_banner_pattern",
	season_4_tags: "mojang_banner_pattern",
	pokemon_tags: "sniffer_egg",
	misc: "command_block_minecart",
	plushies: "oxidized_copper_chest"
};
const ARTIFACT_MATERIALS = {
	vote_note: "paper",
	two_birds_one_arrow: "feather",
	large_size: "iron_golem_spawn_egg",
	small_size: "allay_spawn_egg",
	head_bowl: "bowl",
	mob_silencer: "wooden_hoe",
	mob_unsilencer: "stick",
	siteb_guidebook: "written_book",
	random_plushie_box: "oxidized_copper_chest"
};
const TAG_VOUCHER_MATERIAL = "name_tag";
const PLUSHIE_MATERIAL = "popped_chorus_fruit";
const VANILLA_ITEM_MODELS = {
	paper: {
		type: "minecraft:model",
		model: "minecraft:item/paper"
	},
	feather: {
		type: "minecraft:model",
		model: "minecraft:item/feather"
	},
	iron_golem_spawn_egg: {
		type: "minecraft:model",
		model: "minecraft:item/iron_golem_spawn_egg"
	},
	allay_spawn_egg: {
		type: "minecraft:model",
		model: "minecraft:item/allay_spawn_egg"
	},
	bowl: {
		type: "minecraft:model",
		model: "minecraft:item/bowl"
	},
	wooden_hoe: {
		type: "minecraft:model",
		model: "minecraft:item/wooden_hoe"
	},
	stick: {
		type: "minecraft:model",
		model: "minecraft:item/stick"
	},
	written_book: {
		type: "minecraft:model",
		model: "minecraft:item/written_book"
	},
	name_tag: {
		type: "minecraft:model",
		model: "minecraft:item/name_tag"
	},
	popped_chorus_fruit: {
		type: "minecraft:model",
		model: "minecraft:item/popped_chorus_fruit"
	},
	creeper_banner_pattern: {
		type: "minecraft:model",
		model: "minecraft:item/creeper_banner_pattern"
	},
	skull_banner_pattern: {
		type: "minecraft:model",
		model: "minecraft:item/skull_banner_pattern"
	},
	mojang_banner_pattern: {
		type: "minecraft:model",
		model: "minecraft:item/mojang_banner_pattern"
	},
	sniffer_egg: {
		type: "minecraft:model",
		model: "minecraft:item/sniffer_egg"
	},
	command_block_minecart: {
		type: "minecraft:model",
		model: "minecraft:item/command_block_minecart"
	},
	oxidized_copper_chest: {
		type: "minecraft:special",
		base: "minecraft:item/oxidized_copper_chest",
		model: {
			type: "minecraft:chest",
			texture: "minecraft:copper_oxidized"
		}
	}
};

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
		if (entry.name === ".gitkeep") {
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
	const root = path.join(SRC, "assets", "dinocore", "items", "artifact");
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
		"dinocore",
		"models",
		"artifact",
		"plushie"
	);
	const plushieIds = fs
		.readdirSync(plushieModelRoot)
		.filter(name => name.endsWith(".json"))
		.map(name => name.slice(0, -5))
		.filter(name => name !== "humanoid")
		.map(name => name);
	if (new Set(plushieIds).size !== plushieIds.length) {
		throw new Error(
			"Duplicate plushie IDs were derived from dinoCore model names."
		);
	}

	const voucher = path.join(
		SRC,
		"assets",
		"dinocore",
		"items",
		"tag_voucher.json"
	);
	if (!fs.existsSync(voucher)) {
		throw new Error("Missing dinoCore tag voucher item definition.");
	}
}

function validateShopCategoryDefinitions() {
	const modelRoot = path.join(
		SRC,
		"assets",
		"dinocore",
		"items",
		"shop",
		"category"
	);
	const missingModels = SHOP_CATEGORY_IDS.filter(
		id => !fs.existsSync(path.join(modelRoot, `${id}.json`))
	);
	if (missingModels.length > 0) {
		throw new Error(
			`Missing dinoCore shop category models: ${missingModels.join(", ")}`
		);
	}
	const plushiesTexture = path.join(
		SRC,
		"assets",
		"dinocore",
		"textures",
		"item",
		"shop",
		"category",
		"plushies"
	);
	if (!fs.existsSync(plushiesTexture)) {
		throw new Error("Missing Plushies shop category texture.");
	}
}

function resourcePath(reference, kind, extension) {
	const separator = reference.indexOf(":");
	const namespace = separator === -1
		? "minecraft"
		: reference.slice(0, separator);
	const name = separator === -1
		? reference
		: reference.slice(separator + 1);
	return path.join(
		SRC,
		"assets",
		namespace,
		kind,
		name + extension
	);
}

function validateDinoCoreResources() {
	const missing = [];
	const visitedModels = new Set();
	const inspectModel = reference => {
		if (!reference.startsWith("dinocore:")) {
			return;
		}
		const file = resourcePath(reference, "models", ".json");
		if (!fs.existsSync(file)) {
			missing.push(`model ${reference}`);
			return;
		}
		if (visitedModels.has(file)) {
			return;
		}
		visitedModels.add(file);
		const model = JSON.parse(fs.readFileSync(file, "utf8"));
		if (typeof model.parent === "string") {
			inspectModel(model.parent);
		}
		for (const texture of Object.values(model.textures || {})) {
			if (typeof texture !== "string"
				|| texture.startsWith("#")
				|| !texture.startsWith("dinocore:")) {
				continue;
			}
			if (!texture.startsWith("dinocore:item/")) {
				missing.push(
					`texture ${texture} is outside the item atlas`
				);
				continue;
			}
			const textureFile = resourcePath(
				texture,
				"textures",
				".png"
			);
			if (!fs.existsSync(textureFile)) {
				missing.push(`texture ${texture}`);
			}
		}
	};
	const inspectItemModel = model => {
		if (!model || typeof model !== "object") {
			return;
		}
		if (model.type === "minecraft:model"
			&& typeof model.model === "string") {
			inspectModel(model.model);
		}
		for (const value of Object.values(model)) {
			if (Array.isArray(value)) {
				value.forEach(inspectItemModel);
			} else if (value && typeof value === "object") {
				inspectItemModel(value);
			}
		}
	};
	const inspectItemDirectory = directory => {
		for (const entry of fs.readdirSync(directory, {
			withFileTypes: true
		})) {
			const file = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				inspectItemDirectory(file);
			} else if (entry.name.endsWith(".json")) {
				const item = JSON.parse(fs.readFileSync(file, "utf8"));
				inspectItemModel(item.model);
			}
		}
	};
	inspectItemDirectory(path.join(
		SRC,
		"assets",
		"dinocore",
		"items",
		"artifact"
	));
	inspectItemModel(JSON.parse(fs.readFileSync(path.join(
		SRC,
		"assets",
		"dinocore",
		"items",
		"tag_voucher.json"
	), "utf8")).model);
	const plushieModels = path.join(
		SRC,
		"assets",
		"dinocore",
		"models",
		"artifact",
		"plushie"
	);
	for (const file of fs.readdirSync(plushieModels).sort()) {
		if (file.endsWith(".json")) {
			inspectModel(
				`dinocore:artifact/plushie/${file.slice(0, -5)}`
			);
		}
	}
	for (const id of SHOP_CATEGORY_IDS) {
		const definition = JSON.parse(fs.readFileSync(path.join(
			SRC,
			"assets",
			"dinocore",
			"items",
			"shop",
			"category",
			`${id}.json`
		), "utf8"));
		inspectItemModel(definition.model);
	}
	if (missing.length > 0) {
		throw new Error(
			`Broken dinoCore resource references:\n${missing.join("\n")}`
		);
	}
}

function validateAllCustomReferences() {
	const missing = [];
	const visited = new Set();
	const parseReference = (reference, defaultNamespace) => {
		const separator = reference.indexOf(":");
		return separator === -1
			? ["minecraft", reference]
			: [
				reference.slice(0, separator),
				reference.slice(separator + 1)
			];
	};
	const inspectModel = (reference, defaultNamespace, source) => {
		const [namespace, name] = parseReference(
			reference,
			defaultNamespace
		);
		if (namespace === "minecraft") {
			return;
		}
		const file = path.join(
			SRC,
			"assets",
			namespace,
			"models",
			name + ".json"
		);
		if (!fs.existsSync(file)) {
			missing.push(`model ${namespace}:${name} referenced by ${source}`);
			return;
		}
		if (visited.has(file)) {
			return;
		}
		visited.add(file);
		const model = JSON.parse(fs.readFileSync(file, "utf8"));
		if (typeof model.parent === "string") {
			inspectModel(model.parent, namespace, `${namespace}:${name}`);
		}
		for (const texture of Object.values(model.textures || {})) {
			if (typeof texture !== "string" || texture.startsWith("#")) {
				continue;
			}
			const [textureNamespace, textureName] = parseReference(
				texture,
				namespace
			);
			if (textureNamespace === "minecraft") {
				continue;
			}
			const textureFile = path.join(
				SRC,
				"assets",
				textureNamespace,
				"textures",
				textureName + ".png"
			);
			if (!fs.existsSync(textureFile)) {
				missing.push(
					`texture ${textureNamespace}:${textureName} `
						+ `referenced by ${namespace}:${name}`
				);
			}
		}
	};
	const inspectObject = (value, namespace, source) => {
		if (!value || typeof value !== "object") {
			return;
		}
		if ((value.type === "minecraft:model" || value.type === "model")
			&& typeof value.model === "string") {
			inspectModel(value.model, namespace, source);
		}
		for (const child of Object.values(value)) {
			if (Array.isArray(child)) {
				child.forEach(entry =>
					inspectObject(entry, namespace, source)
				);
			} else if (child && typeof child === "object") {
				inspectObject(child, namespace, source);
			}
		}
	};
	const assetsRoot = path.join(SRC, "assets");
	for (const namespace of fs.readdirSync(assetsRoot)) {
		const itemsRoot = path.join(assetsRoot, namespace, "items");
		if (!fs.existsSync(itemsRoot)) {
			continue;
		}
		const inspectDirectory = directory => {
			for (const entry of fs.readdirSync(directory, {
				withFileTypes: true
			})) {
				const file = path.join(directory, entry.name);
				if (entry.isDirectory()) {
					inspectDirectory(file);
				} else if (entry.name.endsWith(".json")) {
					inspectObject(
						JSON.parse(fs.readFileSync(file, "utf8")),
						namespace,
						path.relative(SRC, file)
					);
				}
			}
		};
		inspectDirectory(itemsRoot);
	}
	if (missing.length > 0) {
		throw new Error(
			`Broken custom resource references:\n${missing.join("\n")}`
		);
	}
}

function customModelCase(value, model) {
	return {
		when: value,
		model: typeof model === "string"
			? {
				type: "minecraft:model",
				model
			}
			: model
	};
}

function writeDinoCoreFallbackDefinitions() {
	const casesByMaterial = new Map();
	const addCase = (material, value, model) => {
		const cases = casesByMaterial.get(material) || [];
		cases.push(customModelCase(value, model));
		casesByMaterial.set(material, cases);
	};
	const artifactRoot = path.join(
		SRC,
		"assets",
		"dinocore",
		"items",
		"artifact"
	);
	const artifactModel = relativePath => {
		const definition = JSON.parse(fs.readFileSync(
			path.join(artifactRoot, relativePath),
			"utf8"
		));
		return definition.model;
	};

	for (const [id, material] of Object.entries(ARTIFACT_MATERIALS)) {
		addCase(
			material,
			`dinocore:artifact/${id}`,
			artifactModel(`${id}.json`)
		);
	}

	const plushieRoot = path.join(
		SRC,
		"assets",
		"dinocore",
		"models",
		"artifact",
		"plushie"
	);
	for (const file of fs.readdirSync(plushieRoot).sort()) {
		if (!file.endsWith(".json")) {
			continue;
		}
		const model = file.slice(0, -5);
		if (model === "humanoid") {
			continue;
		}
		addCase(
			PLUSHIE_MATERIAL,
			`dinocore:artifact/plushie/${model}`,
			`dinocore:artifact/plushie/${model}`
		);
	}

	for (const [id, material] of Object.entries(SHOP_CATEGORY_MATERIALS)) {
		const definition = JSON.parse(fs.readFileSync(path.join(
			SRC,
			"assets",
			"dinocore",
			"items",
			"shop",
			"category",
			`${id}.json`
		), "utf8"));
		addCase(
			material,
			`dinocore:shop/category/${id}`,
			definition.model
		);
	}
	addCase(
		TAG_VOUCHER_MATERIAL,
		"dinocore:tag_voucher",
		JSON.parse(fs.readFileSync(path.join(
			SRC,
			"assets",
			"dinocore",
			"items",
			"tag_voucher.json"
		), "utf8")).model
	);

	const outputRoot = path.join(OUT, "assets", "minecraft", "items");
	ensureDir(outputRoot);
	for (const [material, cases] of casesByMaterial) {
		const fallback = VANILLA_ITEM_MODELS[material];
		if (!fallback) {
			throw new Error(
				`Missing exact 26.2 vanilla fallback for ${material}.`
			);
		}
		const definition = {
			model: {
				type: "minecraft:select",
				property: "minecraft:custom_model_data",
				cases,
				fallback
			}
		};
		fs.writeFileSync(
			path.join(outputRoot, `${material}.json`),
			JSON.stringify(definition),
			"utf8"
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
	validateShopCategoryDefinitions();
	validateDinoCoreResources();
	validateAllCustomReferences();
	fs.rmSync(OUT, { recursive: true, force: true });
	fs.rmSync(ZIP, { force: true });
	ensureDir(OUT);
	walk(SRC);
	writeDinoCoreFallbackDefinitions();
	zipFolder();
	writeSha1(ZIP);
	console.log(`Done.\nOutput folder: ${OUT}\nZip file: ${ZIP}`);
} catch (error) {
	console.error(error.message);
	process.exit(1);
}
