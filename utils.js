const { writeFile } = require('fs/promises')
const _ = require('lodash')
const readline = require('readline')

function idGenerator(tamanho = 10) {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let idGerado = '';
  const comprimentoCaracteres = caracteres.length;

  for (let i = 0; i < tamanho; i++) {
    const indiceAleatorio = Math.floor(Math.random() * comprimentoCaracteres);
    idGerado += caracteres.charAt(indiceAleatorio);
  }

  return idGerado;
}

const checkInvalidCharacters = (jsonString) => {
	const invalidChars = [];
	
	// Definir a faixa de caracteres válidos (acentos e caracteres do português)
	const validCharsRange = /[\x20-\x7E\u00C0-\u00FF\u0100-\u017F\u1E00-\u1EFF\u20AC]/;

	for (let i = 0; i < jsonString.length; i++) {
		const charCode = jsonString.charCodeAt(i);
		
		// Verifica se o caractere é um controle, emoji ou fora da faixa Unicode permitida
		if (!(validCharsRange.test(jsonString[i]))) {
			invalidChars.push({ char: jsonString[i], code: charCode, position: i });
		}
	}

	return invalidChars;
}

const convertToJson = (string) => {
	string = string.replace(/^"+|"+$/g, "");
	if(isValidJson(string)){
		try{
			return JSON.parse(string.trim())
		}catch(e){
			let nString = string.slice(1, -1);
			return JSON.parse(nString.trim())
		}
	}else{
		throw Error(`JSON INVÁLIDO: -->${string}<--`)
	}
}

const isValidJson = (str) => {
	const cleanJson = str.replace(/^[^\[\{]+/, '').trim();
  	try {
    	JSON.parse(cleanJson.trim());
    	return true;
  	} catch (e) {
		let nString = str.slice(1, -1);
		try{
			JSON.parse(nString.trim())
			return true;
		}catch(e){
			return false;
		}
  	}
}

function logObjectDifferences(obj1, obj2, path = '') {
	const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

	allKeys.forEach(key => {
		const value1 = obj1[key];
		const value2 = obj2[key];
		const currentPath = path ? `${path}.${key}` : key;
		const pathSplit = currentPath.split(".")

		//Os ids vão ser diferentes então aqui a gente invalida as diferenças.
		if (pathSplit[pathSplit.length - 1] == 'id') return

		if (_.isEqual(value1, value2)) {
			// Valores iguais, nada a reportar
			return;
		}

		if (_.isObject(value1) && _.isObject(value2)) {
			// Repetir recursivamente se ambos forem objetos
			logObjectDifferences(value1, value2, currentPath);
		} else {
			// Diferença encontrada
			console.log(`Difference at "${currentPath}":`, {
				expected: value1,
				actual: value2,
			});
		}
	});
}

const saveFile = async (info, outputPath) => {
	try {
		await writeFile(outputPath, JSON.stringify(info, null, 2), 'utf-8');
		console.log(`File saved(${outputPath}).`);
	} catch (err) {
		console.error('Error saving file');
		console.error(err);
	}
};

const waitForUserInput = async (prompt) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(`${prompt}\n`, (answer) => {
			rl.close();
			resolve(answer.trim());
		});
	});
}

module.exports = {
	idGenerator,
	checkInvalidCharacters,
	convertToJson,
	isValidJson,
	logObjectDifferences,
	saveFile,
	waitForUserInput
}