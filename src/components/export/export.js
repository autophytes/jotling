import { ipcRenderer } from 'electron';

export const exportProject = async ({
	editorStateRef,
	editorArchivesRef,
	docStructureRef,
	mediaStructureRef,
	projectRef,
}) => {
	const currentContent = editorStateRef.current.getCurrentContent();

	const blockArray = currentContent.getBlocksAsArray();
	let newDoc = { children: [] };

	for (const block of blockArray) {
		let newParagraph = [];

		// Loop through each contiguous styling section, add text runs

		newParagraph.push({
			type: 'TextRun',
			textRun: {
				text: block.getText(),
			},
		});

		// Add the paragraph to the doc
		newDoc.children.push({
			type: 'Paragraph',
			children: newParagraph,
		});
	}

	// const doc = new Document();

	// doc.addSection({
	// 	properties: {},
	// 	children: [
	// 		new Paragraph({
	// 			children: [
	// 				new TextRun('Hello World'),
	// 				new TextRun({
	// 					text: 'Foo Bar',
	// 					bold: true,
	// 				}),
	// 				new TextRun({
	// 					text: '\tGithub is the best',
	// 					bold: true,
	// 				}),
	// 			],
	// 		}),
	// 	],
	// });

	// const childrenArray = [
	// 	{
	// 		text: 'Foo Bar',
	// 		bold: true,
	// 	},
	// 	{
	// 		text: 'Foo Bar',
	// 		bold: true,
	// 	},
	// 	{
	// 		text: 'Foo Bar',
	// 		bold: true,
	// 	},
	// ];

	// const newBuffer = Packer.toBuffer(doc);
	ipcRenderer.invoke('export-project', projectRef.current.tempPath, 'Test.docx', newDoc);
};
