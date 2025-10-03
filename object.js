
const { convertToJson, idGenerator } = require("./utils")
let objectTypes = []

const METAFIELDS_TYPES = {
	"text": (type, data) => formatTextType(data),
	"textarea": (type, data) => formatTextAreaType(data),
	"html-textarea": (type, data) => formatHtmlTextArea(data),
	"select-dropdown": (type, data) => formatSelectDropdownType(data),
	"object": (type, data) => formatObjectType(data),
	"objects": (type, data) => formatObjectsType(data),
	"file": (type, data) => formatFileType(data),
	"files": (type, data) => objetoNaoMapeado(type, data),
	"date": (type, data) => formatDateType(data),
	"radio-buttons": (type, data) => formatRadioButtonType(data),
	"check-boxes": (type, data) => formatCheckBoxesType(data),
	"repeater": (type, data) => formatRepeaterType(data),
	"parent": (type, data) => formatParentType(data),
	"markdown": (type, data) => objetoNaoMapeado(type, data),
	"json": (type, data) => formatJsonType(data),
	"switch": (type, data) => formatSwitchType(data),
	"number": (type, data) => formatNumberType(data),
	"color": (type, data) => objetoNaoMapeado(type, data),
	"emoji": (type, data) => objetoNaoMapeado(type, data)
}

const formatType = (data) => {
	const f = METAFIELDS_TYPES[data.type]
	if (f) {
		const nData = f(data.type, data)
		return nData;
	}

	console.log("Object type not found -", data.type)
	return null
}

const formatJsonType = ({id, type, title, key, value, ...rest}) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type,
		title,
		key,
		value,
	}
	
}

const formatSelectDropdownType = ({id, title, key, type, options, ...rest}) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		title,
		key,
		type,
		options
	}
}

const formatCheckBoxesType = ({id, title, key, type, options, ...rest}) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		title,
		key,
		type,
		options
	}
}

const formatRadioButtonType = ({id, title, key, type, options, ...rest}) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		title,
		key,
		type,
		options
	}
}

const formatNumberType = ({ id, title, key }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "number",
		title,
		key,
		value: "",
		required: false
	}
}

const formatDateType = ({ id, title, key, type, ...rest }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type,
		key,
		title
	}
}

const formatObjectType = ({ id, title, key, object_type }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "object",
		title,
		key,
		object_type,
		value: null
	}
}

const formatHtmlTextArea = ({ id, title, key }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "html-textarea",
		title,
		key,
		value: "",
		required: false
	}
}

const formatTextAreaType = ({ id, title, key }) => { 
	const nId = !id ? idGenerator() : id;
	return {
		id: nId,
		type: "textarea",
		title,
		key,
		value: "",
		required: false
	}
}

const formatSwitchType = ({ id, title, key, options }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "switch",
		title,
		key,
		value: false,
		options: options ? options : "true,false"
	}
}

const formatObjectsType = ({ id, title, key, object_type }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "objects",
		title,
		key,
		object_type,
		value: null,
		required: false
	}
}

const objetoNaoMapeado = (type, data) => {
	console.error("TIPO NÃO MAPEADO", type);
}

const formatParentType = ({ id, type, title, key, children }) => {
	const nId = !id ? idGenerator() : id
	let nChildren = children ? children.map(el => formatType(el)) : []
	nChildren = nChildren.filter(item => item !== null)
	return {
		id: nId,
		type,
		title,
		key,
		children: nChildren
	}
}

const formatFileType = ({ id, type, title, key, value }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type,
		title,
		key,
		value: "", // This is the name of your media.
		media_validation_type: /* value? getFileCategoryFromExtension(value) : */ null,
	}
}

const formatRepeaterType = ({ id, type, title, key, repeater_fields, children }) => {
	const nId = !id ? idGenerator() : id
	let nRepeaterFields = null
	if (children) {
		const base = children.reduce((acum, el) => {

			if(el.children.length > acum.length)
				return el.children

			return acum
		}, [])

		if(base.length){
			nRepeaterFields = base.map(el => {
				return formatType(el)
			})
		}
	}
	if(!nRepeaterFields) {
		if(typeof repeater_fields === 'string') {
			repeater_fields = convertToJson(repeater_fields)
		}
		nRepeaterFields = repeater_fields.map(el => formatType(el))
	}
	nRepeaterFields = nRepeaterFields.filter(item => item !== null)

	return {
		id: nId,
		type,
		title,
		key,
		repeater_fields: nRepeaterFields
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

const formatTextType = ({ title, key, id, value, required }) => {
	const nId = !id ? idGenerator() : id
	return {
		id: nId,
		type: "text",
		title,
		key,
		value: "",
		required: required ? required : false
	}
}

const formatObjectTypes = ({
	title,
	slug,
	singular,
	options,
	preview_link,
	priority_locale,
	extensions,
	emoji,
	order,
	localization,
	locales,
	singleton,
	metafields
}) => {
	//console.log("->>", objectType);
	let nMetafields = []
	
	if(metafields){
		nMetafields = metafields.map(metafield => formatType(metafield))
	}
	

	return {
		title,
		slug,
		singular,
		options,
		preview_link,
		priority_locale,
		extensions,
		emoji,
		order,
		localization,
		locales,
		singleton,
		metafields: nMetafields
	}

}

const getFileCategoryFromExtension = (filename) => {
	const extension = filename.split('.').pop().toLowerCase();

	const categories = {
		image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
		video: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'],
		audio: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
		application: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'exe', 'apk', 'zip', 'rar', '7z'],
		text: ['txt', 'csv', 'json', 'xml', 'md'],
	};

	for (const [category, extensions] of Object.entries(categories)) {
		if (extensions.includes(extension)) {
			return category;
		}
	}

	return null;
}



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

module.exports = { formatObjectTypes, formatType, objectTypes, isValidJson, checkInvalidCharacters }

