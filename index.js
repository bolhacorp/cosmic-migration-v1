const { readFile, writeFile } = require('fs/promises')
const _ = require('lodash')
const readline = require('readline')

const { formatObjectTypes, formatType, objectTypes, convertToJson } = require("./objectType")

const args = process.argv;
const index = args.indexOf('-n');
let fileName = null
if (index !== -1 && args[index + 1]) {
  	const nValue = args[index + 1];

  	if(!nValue) throw Error("Filename not found")

	fileName = nValue

} else {
  console.log('Parâmetro -n não encontrado ou sem valor.');
}

const fetchData = async (filePath) => {
	try {
		const data = await readFile(filePath, 'utf-8');
		const posToRemove = 10;
  		const lastPos = data.length - 1;
	    const withoutLast = data.slice(0, lastPos);
    	const updated = withoutLast.slice(0, posToRemove) + withoutLast.slice(posToRemove + 1);
		const jsonData = JSON.parse(updated);
		return jsonData;
	} catch (e) {
		console.log("ERRO> ", e);
	}
};

const formatMigrateObjects = async () => {
	const filePath = `./dados/${fileName}.json`;
	const dataV1 = await fetchData(filePath);

	const nObject = {
		object_types: []
	}

	if (dataV1.bucket['object_types']) {
		const nObjectType = dataV1.bucket['object_types'].map(el => formatObjectTypes(el))
		nObject['object_types'] = nObjectType
	} else {
		console.log("Object Types not found")
		return
	}

	if (dataV1.bucket['objects']) {
		//Gera os metafields_types validando todos os que existem nas coleções.
		for (const object of dataV1.bucket['objects']) {
			//dataV1.bucket['objects'].map(object => {
			const typeSlug = object.type_slug

			const objectType = nObject['object_types'].find(el => el.slug === typeSlug)
			if (!objectType) {
				console.log("ObjectTYpe not found", typeSlug)
				return
			}

			const metafields = []
			for (const metafield of object.metafields) {
				registredMetafield = objectType.metafields.find(el => el.key === metafield.key)

				if (registredMetafield) {
					if (metafield.type === 'parent') {
						const nMetafield = formatType({...metafield});
						if (!_.isEqual(nMetafield, registredMetafield)) {
							
							console.log(`Existem dois metafieds de mesmo nome e eles tem divergências.`)
							console.log("TypeSlug: ", typeSlug)
							console.log("Slug: ", object.slug)
							console.log(`Key: ${metafield.key} | ID: ${metafield.id}`)
							//console.log("formated: ", registredMetafield)
							//console.log("new: ", nMetafield)
							logObjectDifferences(formatType(metafield), registredMetafield)
							//await waitForUserInput("Pressione enter para continuar ou pare o script para corrigir a divergência.")
							
						}
					}else{
						//console.log("Metafield com chave igual a já criada: igual: ", metafield.key)
					}
				} else {
					const nMetafield = formatType({ ...metafield })
					//defaultMetafields.push(formatEmptyObject({...metafield}))
					metafields.push({ ...nMetafield })
					objectTypes[nMetafield.key] = { ...nMetafield, oldSlug: metafield.slug, oldSlugType: metafield.type_slug }
					
				}
			}
			const indexObjectType = nObject['object_types'].findIndex(el => el.slug === typeSlug)
			nObject['object_types'][indexObjectType].metafields = [
				...nObject['object_types'][indexObjectType].metafields,
				...metafields
			]
		}
		//Gera os objects utilizando os metafields
		let nData = []
		for(const object of dataV1.bucket['objects']){
			
			const typeSlug = object.type_slug
			const objectTypeIndex = nObject['object_types'].findIndex(el => el.slug === typeSlug)
			const objectType = nObject['object_types'][objectTypeIndex]
			
			if(!objectType){
				console.log("Object", object.type_slug)
				console.log("ObjectType", objectType.slug)
				console.log("Não existe esse object");
				continue
			}
			const nTempObject = {...object}
			const tempDefaultMetafields = [...objectType.metafields]
			let modMetafields = null
			try{
				modMetafields = nTempObject.metafields.map(metafield => {
					nMetafield = {...metafield}
					let metafieldIndex = tempDefaultMetafields.findIndex(meta => meta.key===metafield.key)
					if(metafieldIndex === -1){
						const nMetafieldType = formatType({ ...metafield })
						tempDefaultMetafields.push({...nMetafieldType})
						metafieldIndex = tempDefaultMetafields.findIndex(meta => meta.key===metafield.key)
						
						//Atualiza objeto default
						objectType.metafields = tempDefaultMetafields
						nObject['object_types'][objectTypeIndex] = objectType
					}
					const defaultMetafieldType = tempDefaultMetafields[metafieldIndex];
					
					nMetafield.id = defaultMetafieldType.id
					
					if(["parent", "repeater_fields", "repeater"].includes(nMetafield.type)){
						if(nMetafield.type == 'repeater'){
							if(nMetafield.repeater_fields){
								let nRepeaterFields = null
								let repeaterFieldsTemp = null
								try{
									if(typeof nMetafield.repeater_fields === 'string'){
										repeaterFieldsTemp = convertToJson(nMetafield.repeater_fields)
									}else{
										repeaterFieldsTemp = nMetafield.repeater_fields
									}
									nRepeaterFields = repeaterFieldsTemp.map(repeaterField => {
										let nRepeaterField = null
										const defaultRepeater = defaultMetafieldType.repeater_fields.find(el => {
											if(el?.key) return el.key === repeaterField.key
											return false
										})
										if(defaultRepeater){
											nRepeaterField = { ...repeaterField, id: defaultRepeater.id }
										}else{
											const nRepeaterDefaultFieldMetadata = formatType({ ...repeaterField })
											defaultMetafieldType.repeater_fields.push(nRepeaterDefaultFieldMetadata)
											tempDefaultMetafields[metafieldIndex] = defaultMetafieldType											
										}
										return nRepeaterField
									})
								}catch(e){
									console.log("error", e)
									throw Error("RepeaterFields format error")
								}
								nMetafield.repeater_fields = nRepeaterFields
							}
							
						}else if(nMetafield.type == 'parent'){
							const nChildren = nMetafield.children.map(child => {
								let nChild = null
								const defaultChild = defaultMetafieldType.children.find(el => el.key === child.key)
								if(defaultChild){
									nChild = { ...child, id: defaultChild.id }
								}else{
									console.log("nTempObject", nTempObject.slug_type, nTempObject.slug)
									console.log("não existe default parent", child.key, child.type)
								}
								return nChild
							})
							nMetafield.children = nChildren
						}else{
							console.log("OUtro type: ", nMetafield.type)
						}
					}
					tempDefaultMetafields.splice(metafieldIndex, 1)	
					return nMetafield
				})
			}catch(e){
				console.log("e", e)
			}
			const nMetafields = [
				...modMetafields,
				...tempDefaultMetafields
			]
			nTempObject.metafields = nMetafields
			nData.push(nTempObject)			

		}
		nObject.objects = nData

	} else {
		console.log("Objects not found")
	}

	
	nObject['_id'] = dataV1.bucket._id
	nObject['slug'] = dataV1.bucket.slug
	nObject['title'] = dataV1.bucket.title
	nObject['links'] = dataV1.bucket.links
	nObject['media'] = dataV1.bucket.media
	nObject['media_folders'] = dataV1.bucket.media_folders
	nObject['extensions'] = dataV1.bucket.extensions
	nObject['thumbnail'] = dataV1.bucket.thumbnail


	saveDiff({ bucket: nObject }, `./dados/${fileName}-formated.json`)
}

function logObjectDifferences(obj1, obj2, path = '') {
	const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

	allKeys.forEach(key => {
		const value1 = obj1[key];
		const value2 = obj2[key];
		const currentPath = path ? `${path}.${key}` : key;
		const pathSplit = currentPath.split(".")

		//Os ids vão ser diferentes então aqui a gente invalida as diferenças.
		if(pathSplit[pathSplit.length-1] == 'id') return
		
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

const saveDiff = async (diffData, outputPath) => {
	try {
		console.log("salvando arquivo", outputPath);
		await writeFile(outputPath, JSON.stringify(diffData, null, 2), 'utf-8');
		console.log("Arquivo salvo com sucesso.");		
	} catch (err) {
		console.error('File not save')
		console.error(err);
	}
};

const waitForUserInput = async (prompt) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question(`${prompt}\n`, () => {
			rl.close();
			resolve();
		});
	});
}

formatMigrateObjects();
