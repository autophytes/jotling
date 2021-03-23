import { ipcRenderer } from 'electron';

// Remove an image use from mediaStructure and delete image file if the last use
const cleanupJpeg = async (image, mediaStructure, tempPath) => {
	const { imageId, imageUseId } = image;
	let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
	let deleteImageFile = false;

	console.log('cleaning up the jpeg');

	if (mediaStructure[imageId] && mediaStructure[imageId].uses) {
		if (
			Object.keys(mediaStructure[imageId].uses).length < 2 &&
			mediaStructure[imageId].uses[imageUseId]
		) {
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

// Cleans up unused images
export const runImageCleanup = async (
	mediaStructure,
	project,
	navData,
	editorState,
	editorArchives
) => {
	let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
	let usedDocuments = {};

	// Loop through each image instance in the media structure and organize by source document
	for (let imageId in mediaStructure) {
		for (let imageUseId in mediaStructure[imageId].uses) {
			const source = mediaStructure[imageId].uses[imageUseId].sourceDoc;

			if (!usedDocuments.hasOwnProperty(source)) {
				usedDocuments[source] = {};
			}

			// Builds a checklist of images to see if they exist, cleanup if they don't
			usedDocuments[source][`${imageId}_${imageUseId}`] = {
				imageId,
				imageUseId,
			};
		}
	}

	// Check editorArchives for everything except hte current document. Use the editorState for that.

	// For each document with images, pull the editorState and remove matches from usedDocuments
	for (let source in usedDocuments) {
		// If the currentDoc, the editorArchives will not be up to date
		let currentEditorState =
			navData.currentDoc === source ? editorState : editorArchives[source].editorState;

		// Loop through each block
		if (currentEditorState) {
			const contentState = currentEditorState.getCurrentContent();
			const blockMap = contentState.getBlockMap();

			blockMap.forEach((block) => {
				let blockData = block.getData();
				let imageData = blockData.get('images', []);

				// For each image in the block
				for (let image of imageData) {
					// Remove it from our checklist
					delete usedDocuments[source][`${image.imageId}_${image.imageUseId}`];

					// If it was the last image, then stop searching the page
					if (!Object.keys(usedDocuments[source]).length) {
						delete usedDocuments[source];
						return false; // Exits the forEach
					}
				}
			});
		}
	}

	// Anything left in usedDocuments needs to be cleaned up
	for (let sourceObj of Object.values(usedDocuments)) {
		for (let imageObj of Object.values(sourceObj)) {
			newMediaStructure = await cleanupJpeg(imageObj, newMediaStructure, project.tempPath);
		}
	}

	// process each type of cleanup action
	// maybe initialize a copy of the appropriate "structure" if needed
	// and use that (vs undefined) as a flag for setting at the end?

	// Save the mediaStructure to file
	if (newMediaStructure) {
		await ipcRenderer.invoke(
			'save-single-document',
			project.tempPath,
			project.jotsPath,
			'mediaStructure.json',
			newMediaStructure
		);
	}
};

// Clean up deleted comments
export const runCommentCleanup = async (commentStructure, project) => {
	// Duplicate commentStructure
	let newCommentStructure = JSON.parse(JSON.stringify(commentStructure));

	// Delete any comments with shouldDelete flag
	for (let commentId in newCommentStructure) {
		if (newCommentStructure[commentId].shouldDelete) {
			delete newCommentStructure[commentId];
		}
	}

	// Save to file
	if (newCommentStructure) {
		await ipcRenderer.invoke(
			'save-single-document',
			project.tempPath,
			project.jotsPath,
			'commentStructure.json',
			newCommentStructure
		);
	}
};
