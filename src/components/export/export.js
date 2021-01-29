import { convertToRaw } from 'draft-js';
import { ipcRenderer } from 'electron';

export const exportProject = async ({
	editorStateRef,
	editorArchivesRef,
	docStructureRef,
	mediaStructureRef,
	projectRef,
}) => {
	const currentContent = editorStateRef.current.getCurrentContent();
	const rawContent = convertToRaw(currentContent);

	ipcRenderer.invoke('export-project', projectRef.current.tempPath, 'Test.docx', rawContent);

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
