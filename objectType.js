const { 
	convertToJson, 
	idGenerator,
} = require("./utils")

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

const findObjectType = (objectsTypes, slug) => {
	const objectTypeIndex = objectsTypes.findIndex(el => el.slug === slug)
	let info = { 
		index: false, 
		objectType: false
	}

	if(objectTypeIndex !== -1) {
		const objectType = objectsTypes[objectTypeIndex]
		info = {
			index: objectTypeIndex,
			objectType: objectType
		}
	}
	return info
}

const formatType = (data) => {
	let f = METAFIELDS_TYPES[data.type]
	if (!data.type) {
		console.log("Object Type not found.", data)
		return null
	}
	return f(data.type, data)
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

		if(Array.isArray(repeater_fields)) {
			nRepeaterFields = repeater_fields.map(el => formatType(el))
		}else{
			nRepeaterFields = []
		}

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


module.exports = {
	formatObjectTypes,
	formatType,
	objectTypes,
	findObjectType
}

