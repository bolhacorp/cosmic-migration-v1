const { readFile } = require('fs/promises')
const _ = require('lodash')

const { formatObjectTypes, formatType, objectTypes, findObjectType } = require("./objectType")
const { convertToJson, saveFile, waitForUserInput, logObjectDifferences } = require("./utils")


const args = process.argv;
const index = args.indexOf('-n');
let fileName = null
if (index !== -1 && args[index + 1]) {
	const nValue = args[index + 1];

	if (!nValue) throw Error("Filename not found")

	fileName = nValue

} else {
	console.log('Filename(parameter -n) not found.');
}

const fetchData = async (filePath) => {
	try {
		let data = await readFile(filePath, 'utf-8');
		const posToRemove = 10;
		const lastPos = data.length - 1;
		data = data.slice(0, lastPos);
		data = data.slice(0, posToRemove) + data.slice(posToRemove + 1);
		const jsonData = JSON.parse(data);
		return jsonData;
	} catch (e) {
		console.log("ERRO", e);
	}
};

const formatMigrateObjects = async () => {
	const filePath = `./data/${fileName}.json`;
	const dataV1 = await fetchData(filePath);

	const nObject = {
		object_types: []
	}

	//Generate base object types
	if (dataV1.bucket['object_types']) {
		const nObjectType = dataV1.bucket['object_types'].map(el => formatObjectTypes(el))
		nObject['object_types'] = nObjectType
	} else {
		console.log("Object Types not found")
		return
	}

	if (dataV1.bucket['objects']) {
		//It iterates over all objects and checks if the objects match the object types.

		for (const [index, object] of dataV1.bucket['objects'].entries()) {
			let deleteElement = false;
			const typeSlug = object.type_slug

			const {
				objectType
			} = findObjectType(nObject['object_types'], typeSlug)

			if (!objectType) {
				console.log("ObjectTYpe not found", typeSlug)
				return
			}

			//Generates the objectTypes that exist in the object but not in the default objectTypes
			const metafields = []
			for (const metafield of object.metafields) {
				indexReistredMetafield = objectType.metafields.findIndex(el => el.key === metafield.key)
				registredMetafield = objectType.metafields[indexReistredMetafield]

				if (!registredMetafield) {
					indexReistredMetafield = metafields.findIndex(el => el.key === metafield.key)
					registredMetafield = metafields[indexReistredMetafield]
				}

				if (registredMetafield) {
					console.log("TypeSlug Registred: ", typeSlug)
					if (metafield.type === 'parent') {

						const nMetafield = formatType({ ...metafield });
						if (nMetafield.id !== registredMetafield.id) {
							console.log("Different IDs for the same Metafield")
							nMetafield.id = registredMetafield.id
						}
						const testObject = { ...nMetafield }
						if (testObject.children) {
							testObject.children = testObject.children.map(child => {
								child.id = '';
								return child
							})
						}
						const testObjectRegistred = { ...registredMetafield }
						if (testObjectRegistred.children) {
							testObjectRegistred.children = testObjectRegistred.children.map(child => {
								child.id = '';
								return child
							})
						}

						if (!_.isEqual(nMetafield, testObjectRegistred)) {

							console.log(`⚠️ Conflict detected: Two metafields share the same name/slug but contain differences.`)
							console.log("Type Slug:", typeSlug)
							console.log("Object Slug:", object.slug)
							console.log(`Key: ${metafield.key} | ID: ${metafield.id}`)
							console.log("Registered metafield:", registredMetafield)
							console.log("Incoming metafield:", nMetafield)

							logObjectDifferences(formatType(metafield), registredMetafield)

							console.log(
								`Options:\n` +
								`  1 → Keep the registered metafield\n` +
								`  5 → Replace with the new metafield\n` +
								`  9 → Delete the current metafield from the array`
							)

							//const t = await waitForUserInput("Pressione enter para continuar ou pare o script para corrigir a divergência.")
							const t = 1;

							switch(t){
								case 1:
									// Equalizes the child element IDs to match the one being kept
									break;
								case 5:
									objectType.metafields[indexReistredMetafield] = nMetafield
									break;
								case 9:
									// Removes the current metafield from the array
									delete dataV1.bucket['objects'][index]
									deleteElement = true;
									continue;
									break;
								default:
									console.log("Invalid option. Keeping the registered metafield by default.")
							}
						}
					}
				} else {
					console.log("Unregistered metafield: ", metafield.key, metafield.type)
					const nMetafield = formatType({ ...metafield })
					if (nMetafield !== null) {
						console.log("A new objectType should be created (type, key)", nMetafield.type, nMetafield.key)
						metafields.push({ ...nMetafield })
						objectTypes[nMetafield.key] = { ...nMetafield, oldSlug: metafield.slug, oldSlugType: metafield.type_slug }
					} else {
						console.log("Unregistered metafield detected:", {
							key: metafield.key,
							type: metafield.type,
						})
						console.log("Suggested creation:")
						console.log(metafield)
					}
				}

			}
			if (deleteElement) continue;

			const { index: nIndex } = findObjectType(nObject['object_types'], typeSlug)
			if (nIndex === -1) {
				console.log("TypeSlug: ", typeSlug)
				console.log("Não existe")
				nObject['object_types'].push({
					metafields,
					slug: typeSlug
				})
			} else {
				nObject['object_types'][nIndex].metafields = [
					...nObject['object_types'][nIndex].metafields,
					...metafields
				]
			}
		}


		// Generates the objects
		let nData = []
		for (const [index, object] of dataV1.bucket['objects'].entries()) {

			const typeSlug = object.type_slug
			const {
				indexObjectType,
				objectType
			} = findObjectType(nObject['object_types'], typeSlug)

			if (!objectType) {
				console.log(`Não existe esse object | Object, ${object.type_slug}, ObjectType: ${objectType.slug}`);
				continue
			}
			const nTempObject = { ...object }
			const tempDefaultMetafields = [...objectType.metafields]
			let modMetafields = null
			try {
				modMetafields = nTempObject.metafields.map(metafield => {
					nMetafield = { ...metafield }
					let metafieldIndex = tempDefaultMetafields.findIndex(meta => meta.key === metafield.key)
					if (metafieldIndex === -1) {
						const nMetafieldType = formatType({ ...metafield })
						if (nMetafieldType === null) return null // <- Isso pode dar erro
						tempDefaultMetafields.push({ ...nMetafieldType })
						metafieldIndex = tempDefaultMetafields.findIndex(meta => meta.key === metafield.key)

						//Atualiza objeto default
						objectType.metafields = tempDefaultMetafields
						nObject['object_types'][indexObjectType] = objectType
					}
					const defaultMetafieldType = tempDefaultMetafields[metafieldIndex];
					nMetafield.id = defaultMetafieldType.id

					if (["parent", "repeater_fields", "repeater"].includes(nMetafield.type)) {
						if (nMetafield.type == 'repeater') {
							if (nMetafield.repeater_fields) {
								let nRepeaterFields = null
								let repeaterFieldsTemp = null
								try {
									if (typeof nMetafield.repeater_fields === 'string') {
										repeaterFieldsTemp = convertToJson(nMetafield.repeater_fields)
									} else {
										repeaterFieldsTemp = nMetafield.repeater_fields
									}
									nRepeaterFields = repeaterFieldsTemp.map(repeaterField => {
										let nRepeaterField = null
										const defaultRepeater = defaultMetafieldType.repeater_fields.find(el => {
											if (el?.key) return el.key === repeaterField.key
											return false
										})
										if (defaultRepeater) {
											nRepeaterField = { ...repeaterField, id: defaultRepeater.id }
										} else {
											const nRepeaterDefaultFieldMetadata = formatType({ ...repeaterField })
											defaultMetafieldType.repeater_fields.push(nRepeaterDefaultFieldMetadata)
											tempDefaultMetafields[metafieldIndex] = defaultMetafieldType
										}
										return nRepeaterField
									})

								} catch (e) {
									console.log("error", e)
									throw Error("RepeaterFields format error")
								}
								nRepeaterFields = nRepeaterFields.filter(item => item != null)
								nMetafield.repeater_fields = nRepeaterFields
							}

						} else if (nMetafield.type == 'parent') {
							let nChildren = nMetafield.children.map(child => {
								let nChild = null
								const defaultChild = defaultMetafieldType.children.find(el => el.key === child.key)
								if (defaultChild) {
									nChild = { ...child, id: defaultChild.id }
								} else {
									const nMetafieldChildType = formatType({ ...child })
									nChild = { ...child, id: nMetafieldChildType.id }

									//Update default object type
									defaultMetafieldType.children.push(nMetafieldChildType)
									tempDefaultMetafields[metafieldIndex] = defaultMetafieldType
								}
								return nChild
							})
							nChildren = nChildren.filter(item => item != null)
							nMetafield.children = nChildren
						}
					}
					tempDefaultMetafields.splice(metafieldIndex, 1)
					return nMetafield
				})
				modMetafields = modMetafields.filter(item => item != null)
			} catch (e) {
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


	saveFile({ bucket: nObject }, `./data/${fileName}-formated.json`)
}

formatMigrateObjects();
