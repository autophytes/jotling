import { ipcRenderer } from 'electron';

// Remove an image use from mediaStructure and delete image file if the last use
export const cleanupJpeg = async (image, mediaStructure, tempPath) => {
	const { imageId, imageUseId } = image;
	let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
	let deleteImageFile = false;

	console.log('cleaning up the jpeg');

	if (mediaStructure[imageId] && mediaStructure[imageId].uses) {
		if (Object.keys(mediaStructure[imageId].uses).length < 2) {
			// If this is the last use of the image, delete the imageFile
			deleteImageFile = true;
			delete newMediaStructure[imageId];
		} else {
			// Otherwise, just delete the use reference
			delete newMediaStructure[imageId].uses[imageUseId];
		}
	} else {
		// If the imageId was NOT in the mediaStructure, delete the image file
		deleteImageFile = true;
	}

	// Delete the image file
	if (deleteImageFile) {
		await ipcRenderer.invoke('delete-file', tempPath, 'media', `media${imageId}.jpeg`);
	}

	return newMediaStructure;
};
