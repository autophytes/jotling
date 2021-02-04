import { convertToRaw } from 'draft-js';
import { ipcRenderer } from 'electron';

export const exportProject = async ({
	editorStateRef,
	editorArchivesRef,
	docStructureRef,
	mediaStructureRef,
	projectRef,
	currentDoc,
}) => {
	// Convert the editorArchives to raw
	let rawEditorStates = {};
	for (let docName in editorArchivesRef.current) {
		const archivesCurrentContent = editorArchivesRef.current[
			docName
		].editorState.getCurrentContent();
		const archivesEditorState = convertToRaw(archivesCurrentContent);
		rawEditorStates[docName] = archivesEditorState;
	}

	// Convert the current editorState to raw
	const currentContent = editorStateRef.current.getCurrentContent();
	const rawEditorState = convertToRaw(currentContent);
	rawEditorStates[currentDoc] = rawEditorState;

	ipcRenderer.invoke('export-project-docx', {
		rawEditorStates,
		tempPath: projectRef.current.tempPath,
		jotsPath: projectRef.current.jotsPath,
		docStructure: docStructureRef.current,
		mediaStructure: mediaStructureRef.current,
	});

	// // Generate the folder scaffolding for the project
	// ipcRenderer.invoke(
	// 	'create-export-folder-structure',
	// 	projectRef.current.tempPath,
	// 	'Project Name',
	// 	docStructureRef.current
	// );

	// ipcRenderer.invoke(
	// 	'export-single-document',
	// 	projectRef.current.tempPath,
	// 	'Test.docx',
	// 	rawContent,
	// 	mediaStructureRef.current
	// );

	// const blockArray = currentContent.getBlocksAsArray();
	// let newDoc = { children: [] };

	// for (const block of blockArray) {
	// 	let newParagraph = [];

	//   // Loop through each contiguous styling section, add text runs
	//   block.findStyleRanges()

	// 	newParagraph.push({
	// 		type: 'TextRun',
	// 		textRun: {
	//       text: block.getText(),
	//       bold: true
	// 		},
	// 	});

	// 	// Add the paragraph to the doc
	// 	newDoc.children.push({
	// 		type: 'Paragraph',
	// 		children: newParagraph,
	// 	});
	// }
};
