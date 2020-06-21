// Retrieves a value along an object property path string (draft/1/folders/5/children)
// Uses '/' as the property delimiter.
const retrieveContentAtPropertyPath = (key, obj) => {
	return key.split('/').reduce(function (a, b) {
		return a && a[b];
	}, obj);
};
